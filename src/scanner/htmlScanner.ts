import { readFileSync, readdirSync, statSync } from 'fs';
import { parse } from 'node-html-parser';
import path from 'path';

export type Issue = {
  file: string;
  line?: number;
  column?: number;
  rule: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  suggestion?: string;
};

export async function scanPath(dir: string): Promise<Issue[]> {
  const results: Issue[] = [];
  const entries = readdirSync(dir);
  for (const name of entries) {
    const full = path.join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) continue; // skip nested for POC
    if (full.endsWith('.html') || full.endsWith('.htm')) {
      const issues = scanFile(full);
      results.push(...issues);
    }
  }
  return results;
}

export function scanFile(filePath: string): Issue[] {
  const src = readFileSync(filePath, 'utf8');
  const root = parse(src);
  const imgs = root.querySelectorAll('img');
  const issues: Issue[] = [];
  imgs.forEach((img) => {
    const alt = img.getAttribute('alt');
    if (!alt || alt.trim() === '') {
      const suggestion = suggestAltFromSrc(img.getAttribute('src') || '');
      issues.push({
        file: filePath,
        rule: 'img-alt-missing',
        message: 'Image tag is missing alt text',
        severity: 'warning',
        suggestion,
      });
    }
  });
  return issues;
}

export function suggestAltFromSrc(src: string) {
  if (!src) return 'Image';
  const base = path.basename(src).replace(/[-_\d]+/g, ' ').replace(/\.[a-z0-9]+$/i, '');
  const alt = base || 'Image';
  return alt.charAt(0).toUpperCase() + alt.slice(1);
}
