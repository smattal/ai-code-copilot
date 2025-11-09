import { readFileSync, writeFileSync } from 'fs';
import { createPatch } from 'diff';
import path from 'path';
import { suggestAltFromSrc } from '../scanner/htmlScanner';
import { InteractivePrompts, ContextConfig } from '../utils/prompts';
import { generateHtmlAstPatch, generateTsxAstPatch, createUnifiedPatch } from './astPatcher';

export async function previewFixForFile(filePath: string): Promise<string> {
  const prompts = InteractivePrompts.getInstance();
  const src = readFileSync(filePath, 'utf8');
  let modified = src;
  
  // Determine file type and required context
  const ext = path.extname(filePath).toLowerCase();
  let context: ContextConfig = {};
  
  // Gather required context based on file type and content
  if (ext === '.html' || ext === '.jsx' || ext === '.tsx') {
    // Check if file contains viewport-sensitive elements
    if (/<meta\s+name=["']viewport["']/.test(src) || /media=/i.test(src)) {
      context.viewport = await prompts.promptForViewport();
    }
    
    // Check if file needs localization
    if (/<html\b/.test(src) || /lang=/.test(src)) {
      context.locale = await prompts.promptForLocale();
    }

    // Check for color scheme sensitivity
    if (/color|background|theme/i.test(src)) {
      context.colorScheme = await prompts.promptForColorScheme();
    }

    // Check for accessibility requirements
    if (/<img|aria-|role=/.test(src)) {
      context.a11yLevel = await prompts.promptForA11yLevel();
    }
  }
  
  if (ext === '.css') {
    // For CSS files, always ask about viewport and color scheme
    context.viewport = await prompts.promptForViewport();
    context.colorScheme = await prompts.promptForColorScheme();
    await prompts.promptForTargetDevices();
  }

  // Prefer AST-driven patching for HTML and TSX/JSX
  if (ext === '.html' || ext === '.htm') {
    const res = generateHtmlAstPatch(filePath, src);
    const unified = createUnifiedPatch(path.basename(filePath), src, res.modified);
    // Include rationale and any AI-generated content as comments at top of patch for visibility
    const header = `/* RATIONALE: ${res.rationale} */\n${res.aiContent ? `/* AI_CONTENT_ADDED: yes */\n` : ''}`;
    return header + unified;
  }

  if (ext === '.tsx' || ext === '.jsx') {
    const res = generateTsxAstPatch(filePath, src);
    const unified = createUnifiedPatch(path.basename(filePath), src, res.modified);
    const header = `/* RATIONALE: ${res.rationale} */\n`;
    return header + unified;
  }

  // Fallback to previous heuristic-based changes for other files
  // Apply fixes based on gathered context (simple HTML/CSS fallback)
  const imgRegex = /<img\b([^>]*?)>/gi;
  modified = modified.replace(imgRegex, (match, attrs) => {
    if (/\balt=/.test(attrs)) return match;
    const srcMatch = /src=["']?([^"'\s>]+)["']?/.exec(attrs);
    const suggestion = suggestAltFromSrc((srcMatch && srcMatch[1]) || '');
    const replacement = `<img ${attrs} alt="${suggestion}" ${context.a11yLevel === 'AAA' ? 'role="img"' : ''}>`;
    return replacement;
  });

  // Add viewport meta if needed
  if (context.viewport && !/meta.*viewport/.test(modified)) {
    const viewportContent = context.viewport === 'responsive' 
      ? 'width=device-width, initial-scale=1.0' 
      : `width=${context.viewport === 'mobile' ? '420' : context.viewport === 'tablet' ? '768' : '1024'}`;
    modified = modified.replace(/<head>/, `<head>\n  <meta name="viewport" content="${viewportContent}">`);
  }

  // Add language attribute if needed
  if (context.locale && /<html[^>]*>/.test(modified) && !/<html[^>]*lang=/.test(modified)) {
    modified = modified.replace(/<html/, `<html lang="${context.locale}"`);
  }

  // Add color scheme support if needed
  if (context.colorScheme === 'both' && !/@media.*(prefers-color-scheme)/.test(modified)) {
    modified = modified.replace(/<\/head>/, `  <meta name="color-scheme" content="light dark">\n</head>`);
  }

  const patch = createPatch(path.basename(filePath), src, modified);
  return patch;
}

export async function applyFixForFile(filePath: string): Promise<string> {
  const patch = await previewFixForFile(filePath);
  const out = filePath + '.patch';
  writeFileSync(out, patch, 'utf8');
  return out;
}
