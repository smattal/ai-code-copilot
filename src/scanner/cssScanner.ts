import { readFileSync } from 'fs';

export type Issue = {
  file: string;
  rule: string;
  description?: string;
  severity: 'low'|'medium'|'high';
  fix?: string;
  rationale?: string;
};

function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  const bigint = parseInt(h.length === 3 ? h.split('').map(c=>c+ c).join('') : h, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

function luminance(r:number,g:number,b:number){
  const a=[r,g,b].map((v)=>{
    v=v/255;
    return v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055,2.4);
  });
  return 0.2126*a[0]+0.7152*a[1]+0.0722*a[2];
}

export function scanFile(filePath: string): Issue[] {
  const src = readFileSync(filePath, 'utf8');
  const issues: Issue[] = [];

  // Detect direct color usage (hex) and poor contrast vs white background
  const colorRegex = /color\s*:\s*(#[0-9a-fA-F]{3,6})/g;
  const bgRegex = /background\s*:\s*(#[0-9a-fA-F]{3,6})/g;
  const colors: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = colorRegex.exec(src))) colors.push(m[1]);
  const bgs: string[] = [];
  while ((m = bgRegex.exec(src))) bgs.push(m[1]);
  // If white background present and text color low contrast
  const bg = bgs[0] || '#ffffff';
  const bgRgb = hexToRgb(bg);
  const Lbg = luminance(bgRgb.r,bgRgb.g,bgRgb.b);
  for (const c of colors) {
    const rgb = hexToRgb(c);
    const L = luminance(rgb.r,rgb.g,rgb.b);
    const ratio = (Math.max(Lbg,L)+0.05)/(Math.min(Lbg,L)+0.05);
    if (ratio < 4.5) {
      issues.push({ file: filePath, rule: 'low-contrast', description: `Color ${c} has low contrast against ${bg}`, severity: 'high', fix: 'Use design token color with sufficient contrast', rationale: 'Meets WCAG AA contrast ratio.' });
    } else {
      issues.push({ file: filePath, rule: 'color-usage', description: `Direct color ${c} used`, severity: 'low', fix: 'Prefer design tokens (var(--...))', rationale: 'Use CSS variables for design consistency.' });
    }
  }

  // Check if file uses design tokens
  if (!/var\(--/.test(src)) {
    issues.push({ file: filePath, rule: 'design-tokens-missing', description: 'Styles do not use design tokens (CSS variables)', severity: 'medium', fix: 'Replace hard-coded values with design tokens', rationale: 'Keeps styles consistent with design system.' });
  }

  return issues;
}
