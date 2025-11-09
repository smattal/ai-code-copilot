import { readFileSync, writeFileSync } from 'fs';
import { createPatch } from 'diff';
import path from 'path';
import { ContextConfig } from '../utils/prompts';
import { generateHtmlAstPatch, generateTsxAstPatch, createUnifiedPatch } from './astPatcher';
import { ContextGatherer } from './contextGatherer';
import { HeuristicPatcher } from './heuristicPatcher';

const contextGatherer = new ContextGatherer();
const heuristicPatcher = new HeuristicPatcher();

async function gatherContext(ext: string, content: string): Promise<ContextConfig> {
  if (ext === '.html' || ext === '.jsx' || ext === '.tsx') {
    return contextGatherer.gatherHtmlContext(content);
  }
  if (ext === '.css') {
    return contextGatherer.gatherCssContext();
  }
  return {};
}

function generateAstPatch(ext: string, filePath: string, src: string): string | null {
  if (ext === '.html' || ext === '.htm') {
    const res = generateHtmlAstPatch(filePath, src);
    const unified = createUnifiedPatch(path.basename(filePath), src, res.modified);
    const header = `/* RATIONALE: ${res.rationale} */\n${res.aiContent ? `/* AI_CONTENT_ADDED: yes */\n` : ''}`;
    return header + unified;
  }

  if (ext === '.tsx' || ext === '.jsx') {
    const res = generateTsxAstPatch(filePath, src);
    const unified = createUnifiedPatch(path.basename(filePath), src, res.modified);
    return `/* RATIONALE: ${res.rationale} */\n` + unified;
  }

  return null;
}

function applyHeuristicFixes(content: string, context: ContextConfig): string {
  let modified = content;
  modified = heuristicPatcher.applyImageAltFixes(modified, context);
  modified = heuristicPatcher.applyViewportFix(modified, context);
  modified = heuristicPatcher.applyLocaleFix(modified, context);
  modified = heuristicPatcher.applyColorSchemeFix(modified, context);
  return modified;
}

export async function previewFixForFile(filePath: string): Promise<string> {
  const src = readFileSync(filePath, 'utf8');
  const ext = path.extname(filePath).toLowerCase();
  
  // Gather context based on file type
  const context = await gatherContext(ext, src);

  // Try AST-based patching first
  const astPatch = generateAstPatch(ext, filePath, src);
  if (astPatch) {
    return astPatch;
  }

  // Fallback to heuristic-based patching
  const modified = applyHeuristicFixes(src, context);
  return createPatch(path.basename(filePath), src, modified);
}

export async function applyFixForFile(filePath: string): Promise<string> {
  const patch = await previewFixForFile(filePath);
  const out = filePath + '.patch';
  writeFileSync(out, patch, 'utf8');
  return out;
}
