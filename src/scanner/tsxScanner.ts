import { readFileSync } from 'fs';

export type Issue = {
  file: string;
  rule: string;
  message: string;
  severity: 'info'|'warning'|'error';
  fix?: string;
  rationale?: string;
};

export function scanFile(filePath: string): Issue[] {
  const src = readFileSync(filePath, 'utf8');
  const issues: Issue[] = [];

  // Missing alt on images
  const imgRegex = /<img\b([^>]*?)>/gi;
  let m: RegExpExecArray | null;
  while ((m = imgRegex.exec(src))) {
    const attrs = m[1];
    if (!/\balt=/.test(attrs)) {
  issues.push({ file: filePath, rule: 'img-alt-missing', message: 'Image tag is missing alt text', severity: 'warning', fix: 'Add alt attribute', rationale: 'Provide descriptive alt text for accessibility.' });
    }
  }

  // target="_blank" without rel
  const aRegex = /<a\b([^>]*?)>/gi;
  while ((m = aRegex.exec(src))) {
    const attrs = m[1];
    if (/target=["']?_blank["']?/.test(attrs) && !/\brel=/.test(attrs)) {
  issues.push({ file: filePath, rule: 'link-target-blank-rel', message: 'Anchor opens in new tab without rel="noopener"', severity: 'warning', fix: 'Add rel="noopener noreferrer"', rationale: 'Prevent reverse tabnabbing and improve security.' });
    }
  }

  // Raw text not localized - heuristic: find literal text between tags that looks like English words and not interpolated
  const textNodeRegex = />\s*([A-Z][A-Za-z0-9\s]{2,50}?)\s*</g;
  while ((m = textNodeRegex.exec(src))) {
    const text = m[1].trim();
    if (text && !/\{\s*t\(/.test(src) && /[A-Za-z]/.test(text) && text.length < 60) {
      // Ignore obvious markup like headings if they include braces
  issues.push({ file: filePath, rule: 'i18n-missing', message: `Literal text "${text}" may be missing localization`, severity: 'warning', fix: `Wrap text with t('key')`, rationale: 'Use i18n for translatable UI strings.' });
    }
  }

  // Malformed JSX heuristic: attribute close immediately followed by text without '>' between
  // detect patterns like onClick={() => ...}Follow
  const malformedRegex = /\}\s*([A-Za-z]{2,30})/g;
  while ((m = malformedRegex.exec(src))) {
    const txt = m[1];
    if (txt && txt.length < 30) {
  issues.push({ file: filePath, rule: 'jsx-malformed', message: `Possible malformed JSX near text "${txt}" (missing ">" after tag?)`, severity: 'error', fix: 'Fix tag closing > before text', rationale: 'Malformed JSX can break rendering.' });
    }
  }

  // Duplicate ids within file
  const idRegex = /id=["']([^"']+)["']/g;
  const ids: Record<string, number> = {};
  while ((m = idRegex.exec(src))) {
    const id = m[1];
    ids[id] = (ids[id] || 0) + 1;
  }
  for (const k in ids) {
    if (ids[k] > 1) {
  issues.push({ file: filePath, rule: 'duplicate-id', message: `Duplicate id \"${k}\" found ${ids[k]} times`, severity: 'warning', fix: 'Ensure ids are unique', rationale: 'Duplicate ids can cause DOM collisions.' });
    }
  }

  return issues;
}
