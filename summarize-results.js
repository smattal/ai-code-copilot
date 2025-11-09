const data = require('./test-scan-results.json');

const summary = {};
let totalIssues = 0;

data.forEach(file => {
  file.issues.forEach(issue => {
    const cat = issue.category;
    summary[cat] = (summary[cat] || 0) + 1;
    totalIssues++;
  });
});

console.log('\n✅ Issue Detection Summary by Category:');
console.log('==========================================');
Object.entries(summary)
  .sort((a, b) => b[1] - a[1])
  .forEach(([cat, count]) => {
    console.log(`${cat.padEnd(20)} : ${count} issues`);
  });
console.log('==========================================');
console.log(`Total Issues Found   : ${totalIssues}`);
console.log(`Files Scanned        : ${data.length}`);
console.log('\n📋 Detection Categories Implemented:');
console.log('  ✓ Structural (invalid nesting, duplicate IDs, broken links)');
console.log('  ✓ Accessibility (WCAG 2.2 AA compliance)');
console.log('  ✓ SEO (metadata, headings, semantic tags, JSON-LD)');
console.log('  ✓ Security (XSS, CSP, insecure protocols)');
console.log('  ✓ Performance (DOM depth, lazy loading, image optimization)');
console.log('  ✓ Internationalization (i18n, locale, RTL support)');
