import { parse as parseHtml } from 'node-html-parser';
import fs from 'fs';
import path from 'path';
import { createPatch } from 'diff';
import { suggestAltFromSrc } from '../scanner/htmlScanner';
import { parse as babelParse } from '@babel/parser';
import generate from '@babel/generator';
import traverse from '@babel/traverse';
import * as t from '@babel/types';

export interface PatchResult {
  modified: string;
  rationale: string;
  aiContent?: string | null;
}

/**
 * Generate AST-driven patch for HTML files (adds alt attributes, JSON-LD snippet when missing)
 */
export function generateHtmlAstPatch(filePath: string, src: string): PatchResult {
  const root = parseHtml(src);

  let changed = false;
  let rationaleParts: string[] = [];
  let aiContent: string | null = null;

  // Add missing lang attribute on <html>
  const htmlEl = root.querySelector('html');
  if (htmlEl && !htmlEl.getAttribute('lang')) {
    htmlEl.setAttribute('lang', 'en-US');
    changed = true;
    rationaleParts.push('Added missing `lang` attribute to <html> for accessibility and SEO.');
  }

  // Fix <img> without alt
  const imgs = root.querySelectorAll('img');
  for (const img of imgs) {
    if (!img.getAttribute('alt')) {
      const srcAttr = img.getAttribute('src') || '';
      const suggestedAlt = suggestAltFromSrc(srcAttr);
      img.setAttribute('alt', suggestedAlt);
      changed = true;
      rationaleParts.push(`Added alt to <img> ("${suggestedAlt}").`);
    }
  }

  // Add a basic JSON-LD snippet for WebPage if missing
  const hasJsonLd = root.querySelector('script[type="application/ld+json"]');
  if (!hasJsonLd) {
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": path.basename(filePath),
      "description": (root.querySelector('meta[name="description"]') || { getAttribute: () => '' }).getAttribute('content') || ''
    };
    const script = `<script type="application/ld+json">${JSON.stringify(jsonLd, null, 2)}</script>`;
    const head = root.querySelector('head');
    if (head) {
      head.insertAdjacentHTML('beforeend', '\n' + script + '\n');
      changed = true;
      rationaleParts.push('Inserted SEO-friendly JSON-LD WebPage snippet.');
      aiContent = script;
    }
  }

  const modified = changed ? root.toString() : src;
  const rationale = rationaleParts.length ? rationaleParts.join(' ') : 'No AST-based changes necessary.';
  return { modified, rationale, aiContent };
}

/**
 * Generate AST-driven patch for TSX/JSX files (adds alt attributes to <img>)
 */
export function generateTsxAstPatch(filePath: string, src: string): PatchResult {
  const ast = babelParse(src, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript', 'classProperties', 'decorators-legacy'] as any
  });

  let changed = false;
  const rationaleParts: string[] = [];
  
  traverse(ast as any, {
    JSXElement(pathNode) {
      const opening = pathNode.node.openingElement;
      if (t.isJSXIdentifier(opening.name) && opening.name.name === 'img') {
        const hasAlt = opening.attributes.some(attr => t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name) && attr.name.name === 'alt');
        if (!hasAlt) {
          // Create alt attribute with placeholder text
          const srcAttr = opening.attributes.find(a => t.isJSXAttribute(a) && t.isJSXIdentifier(a.name) && a.name.name === 'src') as t.JSXAttribute | undefined;
          let suggested = 'Image';
          if (srcAttr && t.isStringLiteral(srcAttr.value)) {
            const srcVal = srcAttr.value.value;
            const base = path.basename(srcVal || 'image');
            suggested = base.replace(/[-_\d]+/g, ' ').replace(/\.[a-z0-9]+$/i, '').trim() || 'Image';
          }
          const altAttr = t.jsxAttribute(t.jsxIdentifier('alt'), t.stringLiteral(suggested));
          opening.attributes.push(altAttr);
          changed = true;
          rationaleParts.push(`Added alt to <img> JSX ("${suggested}").`);
        }
      }
    }
  });

  if (!changed) {
    return { modified: src, rationale: 'No AST-based changes necessary.', aiContent: null };
  }

  const output = generate(ast as any, { retainFunctionParens: true }, src);
  return { modified: output.code, rationale: rationaleParts.join(' '), aiContent: null };
}

/**
 * Create a unified diff patch using diff.createPatch
 */
export function createUnifiedPatch(filename: string, original: string, modified: string): string {
  return createPatch(filename, original, modified);
}
