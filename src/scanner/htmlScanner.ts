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
  const issues: Issue[] = [];

  // --- Accessibility (WCAG 2.2 AA) ---
  // img alt
  const imgs = root.querySelectorAll('img');
  imgs.forEach((img) => {
    const alt = img.getAttribute('alt');
    if (!alt) {
      const suggestion = suggestAltFromSrc(img.getAttribute('src') || '');
      issues.push({
        file: filePath,
        rule: 'img-alt-missing',
        message: 'Image tag is missing alt text (WCAG 2.2 AA)',
        severity: 'error',
        suggestion,
      });
    } else if (alt.trim() === '') {
      issues.push({
        file: filePath,
        rule: 'img-alt-empty',
        message: 'Image has empty alt text (WCAG 2.2 AA)',
        severity: 'warning',
        suggestion: 'Add descriptive alt text or use alt="" only for decorative images',
      });
    }
  });

  // Missing lang attribute (WCAG 2.2 AA)
  const html = root.querySelector('html');
  if (!html || !html.getAttribute('lang')) {
    issues.push({
      file: filePath,
      rule: 'lang-missing',
      message: 'Missing lang attribute on <html> (WCAG 2.2 AA)',
      severity: 'error',
      suggestion: 'Add lang="en" or appropriate language code',
    });
  }
  
  // Invalid lang code
  if (html) {
    const langCode = html.getAttribute('lang');
    if (langCode && !/^[a-z]{2}(-[A-Z]{2})?$/.test(langCode)) {
      issues.push({
        file: filePath,
        rule: 'lang-invalid',
        message: `Invalid lang code: "${langCode}"`,
        severity: 'warning',
        suggestion: 'Use valid ISO 639-1 language code (e.g., "en", "es", "en-US")',
      });
    }
  }
  
  // Form labels (WCAG 2.2 AA)
  const inputs = root.querySelectorAll('input');
  inputs.forEach((input) => {
    const type = input.getAttribute('type') || 'text';
    if (!['hidden', 'submit', 'button', 'reset'].includes(type)) {
      const id = input.getAttribute('id');
      const ariaLabel = input.getAttribute('aria-label');
      const ariaLabelledBy = input.getAttribute('aria-labelledby');
      
      if (!ariaLabel && !ariaLabelledBy) {
        if (!id || !root.querySelector(`label[for="${id}"]`)) {
          issues.push({
            file: filePath,
            rule: 'form-label-missing',
            message: 'Form input missing associated label (WCAG 2.2 AA)',
            severity: 'error',
            suggestion: 'Add <label> with for attribute or aria-label',
          });
        }
      }
    }
  });
  
  // Buttons without text (WCAG 2.2 AA)
  const buttons = root.querySelectorAll('button');
  buttons.forEach((button) => {
    const text = button.text.trim();
    const ariaLabel = button.getAttribute('aria-label');
    if (!text && !ariaLabel) {
      issues.push({
        file: filePath,
        rule: 'button-label-missing',
        message: 'Button has no text or aria-label (WCAG 2.2 AA)',
        severity: 'error',
        suggestion: 'Add button text or aria-label',
      });
    }
  });
  
  // Color contrast check (simple)
  if (/color:\s*#aaa/i.test(src) && /background(-color)?:\s*#fff/i.test(src)) {
    issues.push({
      file: filePath,
      rule: 'contrast-low',
      message: 'Low color contrast detected (color: #aaa on #fff) - WCAG 2.2 AA violation',
      severity: 'error',
      suggestion: 'Use higher contrast colors (min 4.5:1 for normal text)',
    });
  }
  
  // Keyboard traps (WCAG 2.2 AA)
  if (/tabindex\s*=\s*["']?-1["']?/i.test(src)) {
    issues.push({
      file: filePath,
      rule: 'keyboard-trap',
      message: 'Possible keyboard trap (tabindex=-1) - WCAG 2.2 AA',
      severity: 'warning',
      suggestion: 'Avoid tabindex=-1 on interactive elements',
    });
  }

  // --- SEO ---
  // --- SEO ---
  const head = root.querySelector('head');
  if (head) {
    if (!head.querySelector('meta[name="description"]')) {
      issues.push({
        file: filePath,
        rule: 'seo-missing-description',
        message: 'Missing meta description',
        severity: 'warning',
        suggestion: 'Add <meta name="description" content="...">',
      });
    }
    if (!head.querySelector('title')) {
      issues.push({
        file: filePath,
        rule: 'seo-missing-title',
        message: 'Missing <title> tag',
        severity: 'warning',
        suggestion: 'Add <title>Page Title</title>',
      });
    }
    if (!head.querySelector('script[type="application/ld+json"]')) {
      issues.push({
        file: filePath,
        rule: 'seo-missing-jsonld',
        message: 'Missing JSON-LD schema',
        severity: 'info',
        suggestion: 'Add JSON-LD structured data',
      });
    }
    
    // Missing viewport (mobile SEO)
    if (!head.querySelector('meta[name="viewport"]')) {
      issues.push({
        file: filePath,
        rule: 'seo-missing-viewport',
        message: 'Missing viewport meta tag',
        severity: 'warning',
        suggestion: 'Add <meta name="viewport" content="width=device-width, initial-scale=1">',
      });
    }
    
    // Missing Open Graph tags
    if (!head.querySelector('meta[property="og:title"]')) {
      issues.push({
        file: filePath,
        rule: 'seo-missing-og-title',
        message: 'Missing Open Graph title (og:title)',
        severity: 'info',
        suggestion: 'Add Open Graph meta tags for social media',
      });
    }
    
    // Missing canonical link
    if (!head.querySelector('link[rel="canonical"]')) {
      issues.push({
        file: filePath,
        rule: 'seo-missing-canonical',
        message: 'Missing canonical link',
        severity: 'info',
        suggestion: 'Add <link rel="canonical" href="...">',
      });
    }
  }
  
  // SEO: at least one heading
  if (!root.querySelector('h1') && !root.querySelector('h2') && !root.querySelector('h3')) {
    issues.push({
      file: filePath,
      rule: 'seo-missing-heading',
      message: 'No heading (h1-h3) found',
      severity: 'warning',
      suggestion: 'Add at least one heading (h1-h3)',
    });
  }
  
  // Non-semantic tags
  const divsWithRole = root.querySelectorAll('div[role="main"]');
  if (divsWithRole.length > 0) {
    issues.push({
      file: filePath,
      rule: 'seo-non-semantic',
      message: 'Non-semantic tag used for main content',
      severity: 'info',
      suggestion: 'Use <main> tag instead of <div role="main">',
    });
  }

  // --- Security ---
  // CSP
  if (head && !head.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
    issues.push({
      file: filePath,
      rule: 'security-missing-csp',
      message: 'Missing Content-Security-Policy meta tag',
      severity: 'warning',
      suggestion: 'Add CSP meta tag to prevent XSS',
    });
  }
  
  // Inline scripts
  const scripts = root.querySelectorAll('script');
  scripts.forEach((script) => {
    if (!script.getAttribute('src')) {
      issues.push({
        file: filePath,
        rule: 'security-inline-script',
        message: 'Inline <script> tag detected',
        severity: 'error',
        suggestion: 'Move script to external file',
      });
    }
  });
  
  // target="_blank" without rel
  const links = root.querySelectorAll('a');
  links.forEach((link) => {
    const target = link.getAttribute('target');
    const rel = link.getAttribute('rel');
    
    if (target === '_blank') {
      if (!rel) {
        issues.push({
          file: filePath,
          rule: 'link-target-blank-rel',
          message: 'Anchor opens in new tab without rel="noopener noreferrer"',
          severity: 'error',
          suggestion: 'Add rel="noopener noreferrer"',
        });
      } else if (!rel.includes('noopener')) {
        issues.push({
          file: filePath,
          rule: 'link-target-blank-noopener',
          message: 'Link with target="_blank" missing rel="noopener"',
          severity: 'warning',
          suggestion: 'Add noopener to rel attribute',
        });
      }
    }
  });
  
  // Potential XSS vectors
  if (/eval\s*\(/.test(src)) {
    issues.push({
      file: filePath,
      rule: 'security-xss-eval',
      message: 'Potential XSS vector: eval() usage',
      severity: 'error',
      suggestion: 'Avoid eval()',
    });
  }
  
  if (/new\s+Function\s*\(/.test(src)) {
    issues.push({
      file: filePath,
      rule: 'security-xss-function-constructor',
      message: 'Potential XSS vector: Function constructor',
      severity: 'error',
      suggestion: 'Avoid Function constructor',
    });
  }
  
  // Inline event handlers
  if (/<[^>]+\bon[a-z]+=["'][^"']*["']/gi.test(src)) {
    issues.push({
      file: filePath,
      rule: 'security-inline-event-handler',
      message: 'Inline event handler detected (e.g., onclick)',
      severity: 'warning',
      suggestion: 'Use addEventListener instead',
    });
  }
  
  // HTTP links (should be HTTPS)
  const httpLinks = root.querySelectorAll('a[href^="http:"]');
  httpLinks.forEach(() => {
    issues.push({
      file: filePath,
      rule: 'security-http-link',
      message: 'Insecure HTTP link found',
      severity: 'warning',
      suggestion: 'Use HTTPS instead of HTTP',
    });
  });
  
  // HTTP resources (images, scripts, etc.)
  const httpSrc = root.querySelectorAll('[src^="http:"]');
  httpSrc.forEach(() => {
    issues.push({
      file: filePath,
      rule: 'security-http-resource',
      message: 'Insecure HTTP resource found',
      severity: 'warning',
      suggestion: 'Use HTTPS for all resources',
    });
  });

  // --- Structural ---
  // Duplicate IDs
  const idMap: Record<string, number> = {};
  root.querySelectorAll('[id]').forEach((el) => {
    const id = el.getAttribute('id');
    if (id) {
      idMap[id] = (idMap[id] || 0) + 1;
    }
  });
  Object.entries(idMap).forEach(([id, count]) => {
    if (count > 1) {
      issues.push({
        file: filePath,
        rule: 'structural-duplicate-id',
        message: `Duplicate id "${id}" found ${count} times`,
        severity: 'error',
        suggestion: 'Ensure ids are unique',
      });
    }
  });

  // Broken links (href/src empty or #)
  root.querySelectorAll('a').forEach((a) => {
    const href = a.getAttribute('href');
    if (!href || href.trim() === '' || href.trim() === '#') {
      issues.push({
        file: filePath,
        rule: 'broken-link',
        message: '<a> tag has broken or empty href',
        severity: 'warning',
        suggestion: 'Provide a valid href value',
      });
    }
  });
  
  root.querySelectorAll('img').forEach((img) => {
    const srcAttr = img.getAttribute('src');
    if (!srcAttr || srcAttr.trim() === '') {
      issues.push({
        file: filePath,
        rule: 'broken-img-src',
        message: '<img> tag has empty src',
        severity: 'warning',
        suggestion: 'Provide a valid image src',
      });
    }
  });
  
  // Invalid nesting
  // Check for p > div
  root.querySelectorAll('p').forEach((p) => {
    if (p.querySelector('div')) {
      issues.push({
        file: filePath,
        rule: 'structural-invalid-nesting-div-in-p',
        message: 'Invalid nesting: <div> inside <p>',
        severity: 'error',
        suggestion: 'Remove div from paragraph or use span',
      });
    }
  });
  
  // Check for a > button
  root.querySelectorAll('a').forEach((a) => {
    if (a.querySelector('button')) {
      issues.push({
        file: filePath,
        rule: 'structural-invalid-nesting-button-in-a',
        message: 'Invalid nesting: <button> inside <a>',
        severity: 'error',
        suggestion: 'Remove button or use CSS styling on anchor',
      });
    }
  });
  
  // Check for nested anchors
  root.querySelectorAll('a').forEach((a) => {
    if (a.querySelector('a')) {
      issues.push({
        file: filePath,
        rule: 'structural-invalid-nesting-a-in-a',
        message: 'Invalid nesting: <a> inside <a>',
        severity: 'error',
        suggestion: 'Remove nested anchor',
      });
    }
  });
  
  // Check for li outside ul/ol
  const listItems = root.querySelectorAll('li');
  listItems.forEach((li) => {
    const parent = li.parentNode;
    if (parent && parent.tagName !== 'UL' && parent.tagName !== 'OL') {
      issues.push({
        file: filePath,
        rule: 'structural-li-outside-list',
        message: '<li> tag found outside of <ul> or <ol>',
        severity: 'error',
        suggestion: 'Wrap <li> in <ul> or <ol>',
      });
    }
  });
  
  // Check for td/th outside tr
  const cells = root.querySelectorAll('td, th');
  cells.forEach((cell) => {
    const parent = cell.parentNode;
    if (parent && parent.tagName !== 'TR') {
      issues.push({
        file: filePath,
        rule: 'structural-cell-outside-row',
        message: 'Table cell found outside of <tr>',
        severity: 'error',
        suggestion: 'Wrap cells in <tr>',
      });
    }
  });

  // --- Performance ---
  // Excessive DOM depth
  function getDomDepth(node: any, depth = 0): number {
    if (!node.childNodes || node.childNodes.length === 0) return depth;
    return Math.max(...node.childNodes.map((c: any) => getDomDepth(c, depth + 1)));
  }
  const domDepth = getDomDepth(root);
  if (domDepth > 10) {
    issues.push({
      file: filePath,
      rule: 'perf-excessive-dom-depth',
      message: `DOM depth is ${domDepth}, which may impact performance`,
      severity: 'warning',
      suggestion: 'Reduce nesting depth for better performance',
    });
  }
  
  // Missing lazy loading on images
  imgs.forEach((img) => {
    if (!img.getAttribute('loading')) {
      issues.push({
        file: filePath,
        rule: 'perf-missing-lazy-loading',
        message: 'Image missing lazy loading attribute',
        severity: 'info',
        suggestion: 'Add loading="lazy" to images below the fold',
      });
    }
  });
  
  // Missing width/height on images
  imgs.forEach((img) => {
    const width = img.getAttribute('width');
    const height = img.getAttribute('height');
    if (!width || !height) {
      issues.push({
        file: filePath,
        rule: 'perf-missing-image-dimensions',
        message: 'Image missing width or height attributes',
        severity: 'info',
        suggestion: 'Add width and height to prevent layout shift',
      });
    }
  });
  
  // Blocking scripts in head
  if (head) {
    const blockingScripts = head.querySelectorAll('script[src]:not([async]):not([defer])');
    if (blockingScripts.length > 0) {
      issues.push({
        file: filePath,
        rule: 'perf-blocking-script',
        message: 'Blocking script in <head> without async/defer',
        severity: 'warning',
        suggestion: 'Add async or defer attribute to scripts',
      });
    }
  }
  
  // Large images (simple check)
  imgs.forEach((img) => {
    const src = img.getAttribute('src') || '';
    if (/\b(large|big|huge|unoptimized)\b/i.test(src)) {
      issues.push({
        file: filePath,
        rule: 'perf-large-image',
        message: `Image src "${src}" may be large or unoptimized`,
        severity: 'info',
        suggestion: 'Optimize or compress image',
      });
    }
  });
  
  // Unused CSS classes
  const styles = root.querySelectorAll('style');
  styles.forEach((style) => {
    const css = style.text;
    const classRegex = /\.(\w+)/g;
    let match;
    while ((match = classRegex.exec(css))) {
      const className = match[1];
      if (!root.querySelector(`.${className}`)) {
        issues.push({
          file: filePath,
          rule: 'perf-unused-css',
          message: `Unused CSS class ".${className}"`,
          severity: 'info',
          suggestion: 'Remove unused CSS',
        });
      }
    }
  });

  // --- Internationalization (i18n) ---
  // Untranslated strings (literal text not in script/style)
  function findUntranslatedText(node: any) {
    if (node.nodeType === 3) { // text node
      const text = node.rawText?.trim();
      if (text && /[A-Za-z]/.test(text) && text.length > 2 && text.length < 60) {
        // Check if page uses translation patterns
        if (src.includes('data-i18n') || src.includes('t(') || src.includes('translate(')) {
          issues.push({
            file: filePath,
            rule: 'i18n-untranslated',
            message: `Literal text "${text}" may be missing localization`,
            severity: 'info',
            suggestion: 'Use translation system for user-facing text',
          });
        }
      }
    } else if (node.childNodes) {
      node.childNodes.forEach(findUntranslatedText);
    }
  }
  
  // Only scan body for untranslated text
  const body = root.querySelector('body');
  if (body) findUntranslatedText(body);
  
  // Missing dir attribute for RTL languages
  if (html) {
    const langCode = html.getAttribute('lang') || '';
    const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
    if (rtlLanguages.some(lang => langCode.startsWith(lang))) {
      const dir = html.getAttribute('dir');
      if (dir !== 'rtl') {
        issues.push({
          file: filePath,
          rule: 'i18n-missing-rtl-dir',
          message: 'RTL language detected but missing dir="rtl" attribute',
          severity: 'warning',
          suggestion: 'Add dir="rtl" to <html>',
        });
      }
    }
  }
  
  // Hardcoded dates/numbers
  if (/\d{1,2}\/\d{1,2}\/\d{2,4}/.test(src) || /\d{4}-\d{2}-\d{2}/.test(src)) {
    issues.push({
      file: filePath,
      rule: 'i18n-hardcoded-date',
      message: 'Hardcoded date format detected',
      severity: 'info',
      suggestion: 'Use Intl.DateTimeFormat for dates',
    });
  }
  
  // Missing hreflang on alternate language links
  links.forEach((link) => {
    const href = link.getAttribute('href') || '';
    const hreflang = link.getAttribute('hreflang');
    if (!hreflang && /\/(en|es|fr|de|it|pt|ja|zh|ar|ru)\//i.test(href)) {
      issues.push({
        file: filePath,
        rule: 'i18n-missing-hreflang',
        message: 'Link to alternate language missing hreflang attribute',
        severity: 'info',
        suggestion: 'Add hreflang attribute for language variants',
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
