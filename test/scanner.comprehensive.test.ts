import * as fs from 'fs';
import * as path from 'path';
import { scanFile as scanHtmlFile } from '../src/scanner/htmlScanner';
import { scanFile as scanTsxFile } from '../src/scanner/tsxScanner';
import { scanFile as scanCssFile } from '../src/scanner/cssScanner';

describe('Scanner Edge Cases and Integration', () => {
  const testRoot = path.join(__dirname, 'fixtures', 'scanner-integration');

  beforeAll(() => {
    if (!fs.existsSync(testRoot)) {
      fs.mkdirSync(testRoot, { recursive: true });
    }
  });

  afterAll(() => {
    const fixturesDir = path.join(__dirname, 'fixtures');
    if (fs.existsSync(fixturesDir)) {
      fs.rmSync(fixturesDir, { recursive: true, force: true });
    }
  });

  describe('HTML Scanner - Comprehensive', () => {
    it('should detect multiple missing alt attributes', async () => {
      const htmlFile = path.join(testRoot, 'multi-images.html');
      fs.writeFileSync(htmlFile, `
        <html>
          <body>
            <img src="img1.jpg">
            <img src="img2.jpg">
            <img src="img3.jpg">
            <img src="img4.jpg" alt="Valid">
          </body>
        </html>
      `);

      const result = await scanHtmlFile(htmlFile);
      const altIssues = result.issues.filter(i => i.category === 'Accessibility' && i.message.includes('alt'));
      expect(altIssues.length).toBeGreaterThanOrEqual(3);
    });

    it('should detect missing lang with suggestions', async () => {
      const htmlFile = path.join(testRoot, 'no-lang.html');
      fs.writeFileSync(htmlFile, '<html><head><title>Test</title></head></html>');

      const result = await scanHtmlFile(htmlFile);
      const langIssue = result.issues.find(i => i.message.includes('lang'));
      
      expect(langIssue).toBeDefined();
      expect(langIssue?.severity).toBe('medium');
      expect(langIssue?.aiSuggestion).toBeDefined();
    });

    it('should detect multiple security issues', async () => {
      const htmlFile = path.join(testRoot, 'security.html');
      fs.writeFileSync(htmlFile, `
        <html>
          <body>
            <a href="https://example.com" target="_blank">Link 1</a>
            <a href="https://example.org" target="_blank">Link 2</a>
            <a href="https://example.net" target="_blank">Link 3</a>
          </body>
        </html>
      `);

      const result = await scanHtmlFile(htmlFile);
      const securityIssues = result.issues.filter(i => i.category === 'Security');
      expect(securityIssues.length).toBeGreaterThanOrEqual(3);
    });

    it('should detect missing meta viewport', async () => {
      const htmlFile = path.join(testRoot, 'no-viewport.html');
      fs.writeFileSync(htmlFile, `
        <!DOCTYPE html>
        <html>
          <head><title>No Viewport</title></head>
          <body>Content</body>
        </html>
      `);

      const result = await scanHtmlFile(htmlFile);
      const viewportIssue = result.issues.find(i => i.message.includes('viewport'));
      expect(viewportIssue).toBeDefined();
    });

    it('should detect missing charset', async () => {
      const htmlFile = path.join(testRoot, 'no-charset.html');
      fs.writeFileSync(htmlFile, `
        <!DOCTYPE html>
        <html>
          <head><title>No Charset</title></head>
          <body>Content</body>
        </html>
      `);

      const result = await scanHtmlFile(htmlFile);
      const charsetIssue = result.issues.find(i => i.message.includes('charset'));
      expect(charsetIssue).toBeDefined();
    });

    it('should handle HTML with inline styles', async () => {
      const htmlFile = path.join(testRoot, 'inline-styles.html');
      fs.writeFileSync(htmlFile, `
        <html>
          <body>
            <div style="color: red; background: white;">
              <img src="test.jpg" style="width: 100px;">
            </div>
          </body>
        </html>
      `);

      const result = await scanHtmlFile(htmlFile);
      expect(result).toBeDefined();
      expect(result.isValid).toBe(false);
    });

    it('should handle HTML with embedded JavaScript', async () => {
      const htmlFile = path.join(testRoot, 'with-script.html');
      fs.writeFileSync(htmlFile, `
        <html>
          <head>
            <script>
              function test() {
                console.log('test');
              }
            </script>
          </head>
          <body><img src="test.jpg"></body>
        </html>
      `);

      const result = await scanHtmlFile(htmlFile);
      expect(result).toBeDefined();
    });

    it('should detect SEO issues - missing description', async () => {
      const htmlFile = path.join(testRoot, 'no-description.html');
      fs.writeFileSync(htmlFile, `
        <!DOCTYPE html>
        <html>
          <head><title>Test</title></head>
          <body>Content</body>
        </html>
      `);

      const result = await scanHtmlFile(htmlFile);
      const seoIssue = result.issues.find(i => i.category === 'SEO' && i.message.includes('description'));
      expect(seoIssue).toBeDefined();
    });
  });

  describe('TSX Scanner - Comprehensive', () => {
    it('should detect multiple missing alt in images', async () => {
      const tsxFile = path.join(testRoot, 'multi-images.tsx');
      fs.writeFileSync(tsxFile, `
        export const Gallery = () => (
          <div>
            <img src="img1.jpg" />
            <img src="img2.jpg" />
            <img src="img3.jpg" />
            <img src="img4.jpg" alt="Valid" />
          </div>
        );
      `);

      const result = await scanTsxFile(tsxFile);
      const altIssues = result.issues.filter(i => i.message.includes('alt'));
      expect(altIssues.length).toBeGreaterThanOrEqual(3);
    });

    it('should detect hardcoded strings', async () => {
      const tsxFile = path.join(testRoot, 'hardcoded.tsx');
      fs.writeFileSync(tsxFile, `
        export const Component = () => (
          <div>
            <h1>Welcome to our site</h1>
            <p>This is some hardcoded text</p>
            <button>Click here</button>
          </div>
        );
      `);

      const result = await scanTsxFile(tsxFile);
      const i18nIssues = result.issues.filter(i => i.category === 'Internationalization');
      expect(i18nIssues.length).toBeGreaterThan(0);
    });

    it('should detect links without rel attribute', async () => {
      const tsxFile = path.join(testRoot, 'links.tsx');
      fs.writeFileSync(tsxFile, `
        export const Links = () => (
          <div>
            <a href="https://example.com" target="_blank">Link 1</a>
            <a href="https://example.org" target="_blank">Link 2</a>
          </div>
        );
      `);

      const result = await scanTsxFile(tsxFile);
      const securityIssues = result.issues.filter(i => i.category === 'Security');
      expect(securityIssues.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle complex JSX structures', async () => {
      const tsxFile = path.join(testRoot, 'complex.tsx');
      fs.writeFileSync(tsxFile, `
        export const Complex = ({ items }: { items: any[] }) => (
          <div>
            {items.map((item, idx) => (
              <div key={idx}>
                <img src={item.image} />
                <a href={item.link} target="_blank">{item.title}</a>
              </div>
            ))}
          </div>
        );
      `);

      const result = await scanTsxFile(tsxFile);
      expect(result).toBeDefined();
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should handle TypeScript with generics', async () => {
      const tsxFile = path.join(testRoot, 'generics.tsx');
      fs.writeFileSync(tsxFile, `
        export const Generic = <T extends { id: number }>({ data }: { data: T[] }) => (
          <div>
            {data.map(item => (
              <div key={item.id}>
                <img src="placeholder.jpg" />
              </div>
            ))}
          </div>
        );
      `);

      const result = await scanTsxFile(tsxFile);
      expect(result).toBeDefined();
    });

    it('should handle fragments', async () => {
      const tsxFile = path.join(testRoot, 'fragments.tsx');
      fs.writeFileSync(tsxFile, `
        export const WithFragment = () => (
          <>
            <img src="test.jpg" />
            <p>Some text</p>
          </>
        );
      `);

      const result = await scanTsxFile(tsxFile);
      expect(result).toBeDefined();
    });
  });

  describe('CSS Scanner - Comprehensive', () => {
    it('should detect multiple contrast issues', async () => {
      const cssFile = path.join(testRoot, 'contrast.css');
      fs.writeFileSync(cssFile, `
        .text1 { color: #aaa; background: #fff; }
        .text2 { color: #bbb; background: #fff; }
        .text3 { color: #ccc; background: #fff; }
        .text4 { color: #000; background: #fff; }
      `);

      const result = await scanCssFile(cssFile);
      const contrastIssues = result.issues.filter(i => i.message.includes('contrast'));
      expect(contrastIssues.length).toBeGreaterThanOrEqual(3);
    });

    it('should detect small font sizes', async () => {
      const cssFile = path.join(testRoot, 'font-size.css');
      fs.writeFileSync(cssFile, `
        .small1 { font-size: 8px; }
        .small2 { font-size: 10px; }
        .small3 { font-size: 11px; }
        .normal { font-size: 16px; }
      `);

      const result = await scanCssFile(cssFile);
      const fontIssues = result.issues.filter(i => i.message.includes('font-size'));
      expect(fontIssues.length).toBeGreaterThanOrEqual(3);
    });

    it('should handle CSS with comments', async () => {
      const cssFile = path.join(testRoot, 'comments.css');
      fs.writeFileSync(cssFile, `
        /* This is a comment */
        .class1 { color: #aaa; background: #fff; }
        
        /* Another comment
           spanning multiple lines */
        .class2 { font-size: 10px; }
      `);

      const result = await scanCssFile(cssFile);
      expect(result).toBeDefined();
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should handle CSS with media queries', async () => {
      const cssFile = path.join(testRoot, 'media.css');
      fs.writeFileSync(cssFile, `
        @media (max-width: 768px) {
          .text { color: #aaa; background: #fff; }
        }
        
        @media (min-width: 1024px) {
          .text { font-size: 10px; }
        }
      `);

      const result = await scanCssFile(cssFile);
      expect(result).toBeDefined();
    });

    it('should handle CSS with pseudo-classes', async () => {
      const cssFile = path.join(testRoot, 'pseudo.css');
      fs.writeFileSync(cssFile, `
        .button:hover { color: #aaa; background: #fff; }
        .link:active { color: #bbb; background: #fff; }
        .input:focus { color: #ccc; background: #fff; }
      `);

      const result = await scanCssFile(cssFile);
      expect(result).toBeDefined();
    });

    it('should handle CSS with animations', async () => {
      const cssFile = path.join(testRoot, 'animations.css');
      fs.writeFileSync(cssFile, `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animated {
          animation: fadeIn 1s;
          color: #aaa;
          background: #fff;
        }
      `);

      const result = await scanCssFile(cssFile);
      expect(result).toBeDefined();
    });

    it('should calculate total tokens accurately', async () => {
      const cssFile = path.join(testRoot, 'tokens.css');
      fs.writeFileSync(cssFile, `
        .class1 { color: red; }
        .class2 { background: blue; padding: 10px; }
        .class3 { margin: 5px; font-size: 14px; }
      `);

      const result = await scanCssFile(cssFile);
      expect(result.totalTokens).toBeGreaterThan(0);
    });
  });

  describe('Cross-scanner consistency', () => {
    it('should use consistent issue structure', async () => {
      const htmlFile = path.join(testRoot, 'test.html');
      const tsxFile = path.join(testRoot, 'test.tsx');
      const cssFile = path.join(testRoot, 'test.css');

      fs.writeFileSync(htmlFile, '<html><body><img src="test.jpg"></body></html>');
      fs.writeFileSync(tsxFile, 'export const C = () => <img src="test.jpg" />;');
      fs.writeFileSync(cssFile, '.text { color: #aaa; background: #fff; }');

      const htmlResult = await scanHtmlFile(htmlFile);
      const tsxResult = await scanTsxFile(tsxFile);
      const cssResult = await scanCssFile(cssFile);

      // All should have consistent structure
      [htmlResult, tsxResult, cssResult].forEach(result => {
        expect(result).toHaveProperty('fileName');
        expect(result).toHaveProperty('fileType');
        expect(result).toHaveProperty('isValid');
        expect(result).toHaveProperty('issues');
        expect(Array.isArray(result.issues)).toBe(true);
        
        result.issues.forEach(issue => {
          expect(issue).toHaveProperty('message');
          expect(issue).toHaveProperty('severity');
          expect(issue).toHaveProperty('category');
          expect(issue).toHaveProperty('line');
        });
      });
    });

    it('should apply severity levels consistently', async () => {
      const htmlFile = path.join(testRoot, 'severity.html');
      fs.writeFileSync(htmlFile, `
        <html>
          <body>
            <img src="test.jpg">
            <a href="https://example.com" target="_blank">Link</a>
          </body>
        </html>
      `);

      const result = await scanHtmlFile(htmlFile);
      
      result.issues.forEach(issue => {
        expect(['high', 'medium', 'low']).toContain(issue.severity);
      });
    });
  });
});
