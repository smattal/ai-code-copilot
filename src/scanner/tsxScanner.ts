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
  let m: RegExpExecArray | null;

  // --- Accessibility (WCAG 2.2 AA) ---
  // Missing alt on images
  const imgRegex = /<img\b([^>]*?)>/gi;
  while ((m = imgRegex.exec(src))) {
    const attrs = m[1];
    if (!/\balt=/.test(attrs)) {
      issues.push({ file: filePath, rule: 'img-alt-missing', message: 'Image tag is missing alt text (WCAG 2.2 AA)', severity: 'error', fix: 'Add alt attribute', rationale: 'Provide descriptive alt text for accessibility.' });
    } else {
      // Check for empty alt text
      const altMatch = /\balt=["']([^"']*)["']/.exec(attrs);
      if (altMatch && altMatch[1].trim() === '') {
        issues.push({ file: filePath, rule: 'img-alt-empty', message: 'Image has empty alt text (WCAG 2.2 AA)', severity: 'warning', fix: 'Add descriptive alt text or use alt="" only for decorative images', rationale: 'Meaningful images require descriptive alt text.' });
      }
    }
    // Large/unoptimized images (simple: check for width/height or large file names)
    const srcAttr = /src=["']([^"']+)["']/.exec(attrs);
    if (srcAttr && /\b(large|big|huge|unoptimized)\b/i.test(srcAttr[1])) {
      issues.push({ file: filePath, rule: 'perf-large-image', message: `Image src "${srcAttr[1]}" may be large or unoptimized`, severity: 'info', fix: 'Optimize or compress image', rationale: 'Large images impact performance.' });
    }
  }
  
  // Poor color contrast (WCAG 2.2 AA)
  if (/color:\s*#aaa/i.test(src) && /background(-color)?:\s*#fff/i.test(src)) {
    issues.push({ file: filePath, rule: 'contrast-low', message: 'Low color contrast (color: #aaa on #fff) - WCAG 2.2 AA violation', severity: 'error', fix: 'Use higher contrast colors (min 4.5:1 for normal text)', rationale: 'Meets WCAG AA contrast ratio.' });
  }
  
  // Missing lang attribute on <html> (WCAG 2.2 AA)
  if (!/<html[^>]*lang=/i.test(src)) {
    issues.push({ file: filePath, rule: 'lang-missing', message: 'Missing lang attribute on <html> (WCAG 2.2 AA)', severity: 'error', fix: 'Add lang attribute (e.g., lang="en")', rationale: 'Improves accessibility for screen readers.' });
  }
  
  // Keyboard traps (WCAG 2.2 AA)
  if (/tabIndex\s*=\s*['"]?-1['"]?/.test(src)) {
    issues.push({ file: filePath, rule: 'keyboard-trap', message: 'Possible keyboard trap (tabIndex=-1) - WCAG 2.2 AA', severity: 'warning', fix: 'Avoid tabIndex=-1 on interactive elements', rationale: 'Prevents keyboard traps.' });
  }
  
  // Missing form labels (WCAG 2.2 AA)
  const inputRegex = /<input\b([^>]*?)>/gi;
  while ((m = inputRegex.exec(src))) {
    const attrs = m[1];
    if (!/type=["']?(hidden|submit|button)["']?/i.test(attrs)) {
      if (!/\b(aria-label|aria-labelledby)=/i.test(attrs)) {
        const idMatch = /\bid=["']([^"']+)["']/.exec(attrs);
        if (!idMatch || !new RegExp(`<label[^>]+for=["']${idMatch[1]}["']`).test(src)) {
          issues.push({ file: filePath, rule: 'form-label-missing', message: 'Form input missing associated label (WCAG 2.2 AA)', severity: 'error', fix: 'Add <label> with for attribute or aria-label', rationale: 'Form inputs must be labeled for accessibility.' });
        }
      }
    }
  }
  
  // Missing button text/aria-label (WCAG 2.2 AA)
  const buttonRegex = /<button\b([^>]*?)>([\s\S]*?)<\/button>/gi;
  while ((m = buttonRegex.exec(src))) {
    const attrs = m[1];
    const content = m[2].trim();
    if (!content && !/\baria-label=/i.test(attrs)) {
      issues.push({ file: filePath, rule: 'button-label-missing', message: 'Button has no text or aria-label (WCAG 2.2 AA)', severity: 'error', fix: 'Add button text or aria-label', rationale: 'Buttons must have accessible names.' });
    }
  }
  
  // Missing role on interactive elements (WCAG 2.2 AA)
  if (/<div[^>]+onClick/i.test(src) && !/<div[^>]+role=["']button["']/i.test(src)) {
    issues.push({ file: filePath, rule: 'role-missing', message: 'Interactive div missing role attribute (WCAG 2.2 AA)', severity: 'warning', fix: 'Add role="button" or use <button> element', rationale: 'Interactive elements need proper roles.' });
  }

  // --- SEO ---
  // Missing meta description
  if (!/<meta[^>]+name=["']description["']/i.test(src)) {
    issues.push({ file: filePath, rule: 'seo-missing-description', message: 'Missing meta description', severity: 'warning', fix: 'Add meta description', rationale: 'Improves SEO.' });
  }
  
  // Missing <title>
  if (!/<title>/i.test(src)) {
    issues.push({ file: filePath, rule: 'seo-missing-title', message: 'Missing <title> tag', severity: 'warning', fix: 'Add <title>', rationale: 'Improves SEO.' });
  }
  
  // Missing headings
  if (!/<h[1-3][^>]*>/i.test(src)) {
    issues.push({ file: filePath, rule: 'seo-missing-heading', message: 'No heading (h1-h3) found', severity: 'warning', fix: 'Add heading', rationale: 'Improves SEO and structure.' });
  }
  
  // Missing JSON-LD schema
  if (!/<script[^>]+type=["']application\/ld\+json["']/i.test(src)) {
    issues.push({ file: filePath, rule: 'seo-missing-jsonld', message: 'Missing JSON-LD schema', severity: 'info', fix: 'Add JSON-LD schema', rationale: 'Improves SEO.' });
  }
  
  // Non-semantic tags (divs with role=main, etc.)
  if (/<div[^>]+role=["']main["']/i.test(src)) {
    issues.push({ file: filePath, rule: 'seo-non-semantic', message: 'Non-semantic tag used for main content', severity: 'info', fix: 'Use <main> tag', rationale: 'Improves semantic structure.' });
  }
  
  // Missing meta viewport (mobile SEO)
  if (!/<meta[^>]+name=["']viewport["']/i.test(src)) {
    issues.push({ file: filePath, rule: 'seo-missing-viewport', message: 'Missing viewport meta tag', severity: 'warning', fix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1">', rationale: 'Essential for mobile SEO.' });
  }
  
  // Missing Open Graph tags
  if (!/<meta[^>]+property=["']og:title["']/i.test(src)) {
    issues.push({ file: filePath, rule: 'seo-missing-og-title', message: 'Missing Open Graph title (og:title)', severity: 'info', fix: 'Add Open Graph meta tags', rationale: 'Improves social media sharing.' });
  }
  
  // Missing canonical link
  if (!/<link[^>]+rel=["']canonical["']/i.test(src)) {
    issues.push({ file: filePath, rule: 'seo-missing-canonical', message: 'Missing canonical link', severity: 'info', fix: 'Add <link rel="canonical" href="...">', rationale: 'Prevents duplicate content issues.' });
  }

  // --- Security ---
  // target="_blank" without rel
  const aRegex = /<a\b([^>]*?)>/gi;
  while ((m = aRegex.exec(src))) {
    const attrs = m[1];
    if (/target=["']?_blank["']?/.test(attrs) && !/\brel=/.test(attrs)) {
      issues.push({ file: filePath, rule: 'link-target-blank-rel', message: 'Anchor opens in new tab without rel="noopener noreferrer"', severity: 'error', fix: 'Add rel="noopener noreferrer"', rationale: 'Prevent reverse tabnabbing and improve security.' });
    } else if (/target=["']?_blank["']?/.test(attrs) && !/\brel=["'][^"']*noopener[^"']*["']/.test(attrs)) {
      issues.push({ file: filePath, rule: 'link-target-blank-noopener', message: 'Link with target="_blank" missing rel="noopener"', severity: 'warning', fix: 'Add noopener to rel attribute', rationale: 'Prevents reverse tabnabbing attacks.' });
    }
    
    // Broken links (href empty or #)
    const hrefAttr = /href=["']([^"']*)["']/.exec(attrs);
    if (hrefAttr && (!hrefAttr[1] || hrefAttr[1] === '#')) {
      issues.push({ file: filePath, rule: 'broken-link', message: '<a> tag has broken or empty href', severity: 'warning', fix: 'Provide valid href', rationale: 'Broken links harm UX and SEO.' });
    }
  }
  
  // Inline scripts
  const scriptRegex = /<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi;
  while ((m = scriptRegex.exec(src))) {
    issues.push({ file: filePath, rule: 'security-inline-script', message: 'Inline <script> tag detected', severity: 'error', fix: 'Move script to external file', rationale: 'Inline scripts are a security risk and violate CSP.' });
  }
  
  // Missing CSP
  if (!/<meta[^>]+http-equiv=["']Content-Security-Policy["']/i.test(src)) {
    issues.push({ file: filePath, rule: 'security-missing-csp', message: 'Missing Content-Security-Policy meta tag', severity: 'warning', fix: 'Add CSP meta tag', rationale: 'CSP helps prevent XSS.' });
  }
  
  // Potential XSS vectors (dangerouslySetInnerHTML)
  if (/dangerouslySetInnerHTML/.test(src)) {
    issues.push({ file: filePath, rule: 'security-xss-dangerous-html', message: 'Potential XSS vector: dangerouslySetInnerHTML', severity: 'error', fix: 'Avoid dangerouslySetInnerHTML or sanitize input', rationale: 'Can introduce XSS vulnerabilities.' });
  }
  
  // Potential XSS vectors (eval, Function constructor)
  if (/\beval\s*\(/.test(src)) {
    issues.push({ file: filePath, rule: 'security-xss-eval', message: 'Potential XSS vector: eval() usage', severity: 'error', fix: 'Avoid eval()', rationale: 'eval() can execute arbitrary code.' });
  }
  
  if (/new\s+Function\s*\(/.test(src)) {
    issues.push({ file: filePath, rule: 'security-xss-function-constructor', message: 'Potential XSS vector: Function constructor', severity: 'error', fix: 'Avoid Function constructor', rationale: 'Can execute arbitrary code.' });
  }
  
  // Inline event handlers (onclick, onerror, etc.)
  if (/<[^>]+\bon[a-z]+=["'][^"']*["']/gi.test(src)) {
    issues.push({ file: filePath, rule: 'security-inline-event-handler', message: 'Inline event handler detected (e.g., onclick)', severity: 'warning', fix: 'Use addEventListener instead', rationale: 'Inline event handlers violate CSP and are less maintainable.' });
  }
  
  // Missing HTTPS in links/images
  const httpRegex = /(href|src)=["']http:\/\//gi;
  while ((m = httpRegex.exec(src))) {
    issues.push({ file: filePath, rule: 'security-http-link', message: `Insecure HTTP link/resource found (${m[1]})`, severity: 'warning', fix: 'Use HTTPS instead of HTTP', rationale: 'HTTP is insecure and can be intercepted.' });
  }

  // --- Performance ---
  // Unused CSS (simple: style tag present but no class usage)
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  while ((m = styleRegex.exec(src))) {
    const css = m[1];
    const classRegex = /\.(\w+)/g;
    let classMatch;
    while ((classMatch = classRegex.exec(css))) {
      const className = classMatch[1];
      if (!new RegExp('className=["\'].*' + className + '.*["\']').test(src)) {
        issues.push({ file: filePath, rule: 'perf-unused-css', message: `Unused CSS class ".${className}"`, severity: 'info', fix: 'Remove unused CSS', rationale: 'Removes dead code.' });
      }
    }
  }
  
  // Excessive DOM depth (simple: count nested divs)
  const maxDepth = (() => {
    let max = 0;
    function findDepth(str: string, tag: string, depth = 0): number {
      const open = new RegExp(`<${tag}[^>]*>`, 'gi');
      const close = new RegExp(`</${tag}>`, 'gi');
      let d = depth;
      let m;
      while ((m = open.exec(str))) {
        d++;
        if (d > max) max = d;
      }
      while ((m = close.exec(str))) {
        d--;
      }
      return d;
    }
    findDepth(src, 'div');
    return max;
  })();
  if (maxDepth > 10) {
    issues.push({ file: filePath, rule: 'perf-excessive-dom-depth', message: `DOM depth is ${maxDepth}, which may impact performance`, severity: 'warning', fix: 'Reduce DOM depth', rationale: 'Deep DOM trees impact performance.' });
  }
  
  // Missing lazy loading for images
  const lazyImgRegex = /<img\b([^>]*?)>/gi;
  while ((m = lazyImgRegex.exec(src))) {
    const attrs = m[1];
    if (!/\bloading=["']lazy["']/.test(attrs)) {
      issues.push({ file: filePath, rule: 'perf-missing-lazy-loading', message: 'Image missing lazy loading attribute', severity: 'info', fix: 'Add loading="lazy" to images below the fold', rationale: 'Improves initial page load performance.' });
    }
  }
  
  // Missing width/height on images (causes layout shift)
  const dimensionImgRegex = /<img\b([^>]*?)>/gi;
  while ((m = dimensionImgRegex.exec(src))) {
    const attrs = m[1];
    if (!/\bwidth=/.test(attrs) || !/\bheight=/.test(attrs)) {
      issues.push({ file: filePath, rule: 'perf-missing-image-dimensions', message: 'Image missing width or height attributes', severity: 'info', fix: 'Add width and height attributes', rationale: 'Prevents cumulative layout shift (CLS).' });
    }
  }
  
  // Blocking resources in head
  const blockingScriptRegex = /<head[\s\S]*?<script(?![^>]*async)(?![^>]*defer)[^>]*src=/gi;
  if (blockingScriptRegex.test(src)) {
    issues.push({ file: filePath, rule: 'perf-blocking-script', message: 'Blocking script in <head> without async/defer', severity: 'warning', fix: 'Add async or defer attribute', rationale: 'Blocking scripts delay page rendering.' });
  }
  
  // Multiple font families (performance issue)
  const fontFamilyMatches = src.match(/font-family:\s*[^;]+;/gi);
  if (fontFamilyMatches && new Set(fontFamilyMatches).size > 3) {
    issues.push({ file: filePath, rule: 'perf-multiple-fonts', message: 'Multiple font families detected (may impact performance)', severity: 'info', fix: 'Limit font families', rationale: 'Each font family requires additional downloads.' });
  }

  // --- Internationalization (i18n) ---
  // Missing locale attribute (lang missing on html)
  if (!/<html[^>]*lang=/i.test(src)) {
    issues.push({ file: filePath, rule: 'i18n-locale-missing', message: 'Missing locale/lang attribute on <html>', severity: 'warning', fix: 'Add lang attribute', rationale: 'Improves i18n support.' });
  }
  
  // Invalid or non-standard lang codes
  const langMatch = /<html[^>]*lang=["']([^"']+)["']/i.exec(src);
  if (langMatch) {
    const langCode = langMatch[1];
    // Check if lang code is valid (simple check: 2-letter ISO 639-1 or with region)
    if (!/^[a-z]{2}(-[A-Z]{2})?$/.test(langCode)) {
      issues.push({ file: filePath, rule: 'i18n-invalid-lang-code', message: `Invalid lang code: "${langCode}"`, severity: 'warning', fix: 'Use valid ISO 639-1 language code (e.g., "en", "es", "en-US")', rationale: 'Valid lang codes are required for proper i18n.' });
    }
  }
  
  // Missing dir attribute for RTL languages
  const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
  if (langMatch && rtlLanguages.some(lang => langMatch[1].startsWith(lang))) {
    if (!/<html[^>]*dir=["']rtl["']/i.test(src)) {
      issues.push({ file: filePath, rule: 'i18n-missing-rtl-dir', message: 'RTL language detected but missing dir="rtl" attribute', severity: 'warning', fix: 'Add dir="rtl" to <html>', rationale: 'RTL languages require dir="rtl".' });
    }
  }
  
  // Untranslated strings (literal text not wrapped)
  const textNodeRegex = />\s*([A-Z][A-Za-z0-9\s]{2,50}?)\s*</g;
  const translationFunctions = /\{\s*(t|i18n|translate|__)\s*\(/;
  const hasTranslation = translationFunctions.test(src);
  
  while ((m = textNodeRegex.exec(src))) {
    const text = m[1].trim();
    if (hasTranslation && text && /[A-Za-z]/.test(text) && text.length < 60) {
      // Check if this specific text is wrapped in translation function
      const beforeText = src.substring(Math.max(0, m.index - 50), m.index);
      const afterText = src.substring(m.index, Math.min(src.length, m.index + m[0].length + 50));
      if (!translationFunctions.test(beforeText + afterText)) {
        issues.push({ file: filePath, rule: 'i18n-untranslated-text', message: `Literal text "${text}" may be missing localization`, severity: 'info', fix: `Wrap text with t('key')`, rationale: 'Use i18n for translatable UI strings.' });
      }
    }
  }
  
  // Hardcoded dates/numbers (should use Intl)
  if (/\d{1,2}\/\d{1,2}\/\d{2,4}/.test(src) || /\d{4}-\d{2}-\d{2}/.test(src)) {
    issues.push({ file: filePath, rule: 'i18n-hardcoded-date', message: 'Hardcoded date format detected', severity: 'info', fix: 'Use Intl.DateTimeFormat for dates', rationale: 'Date formats vary by locale.' });
  }
  
  // Missing hreflang on links to other languages
  const hrefLangRegex = /<a\b[^>]*href=["'][^"']*["'][^>]*>/gi;
  while ((m = hrefLangRegex.exec(src))) {
    if (!/hreflang=/i.test(m[0]) && /\/(en|es|fr|de|it|pt|ja|zh|ar|ru)\//i.test(m[0])) {
      issues.push({ file: filePath, rule: 'i18n-missing-hreflang', message: 'Link to alternate language missing hreflang attribute', severity: 'info', fix: 'Add hreflang attribute', rationale: 'Helps search engines understand language variants.' });
    }
  }

  // --- Structural ---
  // Duplicate ids within file
  const idRegex = /id=["']([^"']+)["']/g;
  const ids: Record<string, number> = {};
  while ((m = idRegex.exec(src))) {
    const id = m[1];
    ids[id] = (ids[id] || 0) + 1;
  }
  for (const k in ids) {
    if (ids[k] > 1) {
      issues.push({ file: filePath, rule: 'structural-duplicate-id', message: `Duplicate id "${k}" found ${ids[k]} times`, severity: 'error', fix: 'Ensure ids are unique', rationale: 'Duplicate ids can cause DOM collisions.' });
    }
  }
  
  // Invalid nesting (e.g., div inside p, button inside a)
  if (/<p[^>]*>[\s\S]*?<div/i.test(src)) {
    issues.push({ file: filePath, rule: 'structural-invalid-nesting-div-in-p', message: 'Invalid nesting: <div> inside <p>', severity: 'error', fix: 'Remove div from paragraph or use span', rationale: 'Block elements cannot be nested inside inline elements.' });
  }
  
  if (/<a[^>]*>[\s\S]*?<button/i.test(src)) {
    issues.push({ file: filePath, rule: 'structural-invalid-nesting-button-in-a', message: 'Invalid nesting: <button> inside <a>', severity: 'error', fix: 'Remove button or anchor', rationale: 'Interactive elements should not be nested.' });
  }
  
  if (/<a[^>]*>[\s\S]*?<a\b/i.test(src)) {
    issues.push({ file: filePath, rule: 'structural-invalid-nesting-a-in-a', message: 'Invalid nesting: <a> inside <a>', severity: 'error', fix: 'Remove nested anchor', rationale: 'Anchor tags cannot be nested.' });
  }
  
  if (/<button[^>]*>[\s\S]*?<button/i.test(src)) {
    issues.push({ file: filePath, rule: 'structural-invalid-nesting-button-in-button', message: 'Invalid nesting: <button> inside <button>', severity: 'error', fix: 'Remove nested button', rationale: 'Button tags cannot be nested.' });
  }
  
  // Missing closing tags (simple check)
  const openTags = (src.match(/<(div|span|p|a|button|form|ul|ol|li)[^>]*>/gi) || []).length;
  const closeTags = (src.match(/<\/(div|span|p|a|button|form|ul|ol|li)>/gi) || []).length;
  if (openTags !== closeTags) {
    issues.push({ file: filePath, rule: 'structural-unclosed-tags', message: 'Possible unclosed tags detected', severity: 'warning', fix: 'Ensure all tags are properly closed', rationale: 'Unclosed tags can break layout.' });
  }
  
  // List items outside of lists
  if (/<li\b/.test(src) && !/<[ou]l[^>]*>/i.test(src)) {
    issues.push({ file: filePath, rule: 'structural-li-outside-list', message: '<li> tag found outside of <ul> or <ol>', severity: 'error', fix: 'Wrap <li> in <ul> or <ol>', rationale: 'List items must be inside list containers.' });
  }
  
  // Table cells outside of table rows
  if (/<t[dh]\b/.test(src) && !/<tr[^>]*>/i.test(src)) {
    issues.push({ file: filePath, rule: 'structural-cell-outside-row', message: 'Table cell found outside of <tr>', severity: 'error', fix: 'Wrap cells in <tr>', rationale: 'Table cells must be inside table rows.' });
  }

  return issues;
}
