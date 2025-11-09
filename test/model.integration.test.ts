import * as fs from 'fs';
import * as path from 'path';

describe('Model and Routing Integration', () => {
  const testRoot = path.join(__dirname, 'fixtures', 'model-integration');

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

  describe('Mock Model - Pattern Recognition', () => {
    const { MockModel, suggestAltTextContextual } = require('../src/model/mockModel');

    it('should generate contextual suggestions for accessibility', async () => {
      const model = new MockModel();
      
      const code = '<img src="user-profile.jpg">';
      const result = await model.generateSuggestion(code, 'accessibility');

      expect(result).toContain('alt=');
      expect(result.toLowerCase()).toContain('user');
    });

    it('should generate security suggestions', async () => {
      const model = new MockModel();
      
      const code = '<a href="https://example.com" target="_blank">Link</a>';
      const result = await model.generateSuggestion(code, 'security');

      expect(result).toContain('rel=');
      expect(result).toContain('noopener');
    });

    it('should generate i18n suggestions', async () => {
      const model = new MockModel();
      
      const code = '<h1>Welcome to our site</h1>';
      const result = await model.generateSuggestion(code, 'i18n');

      expect(result).toContain('i18n');
    });

    it('should generate SEO suggestions', async () => {
      const model = new MockModel();
      
      const code = '<html><head><title>Page</title></head></html>';
      const result = await model.generateSuggestion(code, 'seo');

      expect(result.toLowerCase()).toContain('meta');
    });

    it('should handle complex image filenames', async () => {
      const testCases = [
        'logo-company-2023.png',
        'hero_banner_image.jpg',
        'product-photo-xl.webp',
        'user-avatar-default.svg',
        'icon_settings_24px.png'
      ];

      for (const filename of testCases) {
        const result = await suggestAltTextContextual(filename);
        
        expect(result).toBeDefined();
        expect(result.length).toBeGreaterThan(0);
        expect(result).not.toContain('_');
        expect(result).not.toContain('-');
        expect(result).not.toContain('.png');
        expect(result).not.toContain('.jpg');
      }
    });

    it('should handle edge case filenames', async () => {
      const edgeCases = [
        '',
        '...',
        'a',
        '123.jpg',
        'image@2x.png',
        'file%20name.jpg',
        'very-long-filename-with-many-words-in-it.jpg'
      ];

      for (const filename of edgeCases) {
        const result = await suggestAltTextContextual(filename);
        
        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
      }
    });
  });

  describe('Model Router - Load Balancing', () => {
    const { ModelRouter } = require('../src/model/modelRouter');

    it('should route requests to available models', async () => {
      const router = new ModelRouter();
      
      const code = '<img src="test.jpg">';
      const result = await router.route(code, 'accessibility');

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle batch requests efficiently', async () => {
      const router = new ModelRouter();
      
      const requests = [
        { code: '<img src="img1.jpg">', category: 'accessibility' },
        { code: '<a href="https://example.com" target="_blank">Link</a>', category: 'security' },
        { code: '<h1>Title</h1>', category: 'i18n' },
        { code: '<html><head></head></html>', category: 'seo' }
      ];

      const results = await router.routeBatch(requests);

      expect(results).toHaveLength(4);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
      });
    });

    it('should list available models', () => {
      const router = new ModelRouter();
      const models = router.getAvailableModels();

      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);
      expect(models[0]).toHaveProperty('name');
      expect(models[0]).toHaveProperty('type');
    });

    it('should provide model information', () => {
      const router = new ModelRouter();
      const info = router.getModelInfo('mock');

      expect(info).toBeDefined();
      expect(info).toHaveProperty('name');
      expect(info).toHaveProperty('type');
      expect(info).toHaveProperty('capabilities');
    });

    it('should handle concurrent routing', async () => {
      const router = new ModelRouter();
      
      const promises = [];
      for (let i = 0; i < 20; i++) {
        promises.push(
          router.route(`<img src="img${i}.jpg">`, 'accessibility')
        );
      }

      const results = await Promise.all(promises);

      expect(results).toHaveLength(20);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result).toContain('alt=');
      });
    });

    it('should route different categories appropriately', async () => {
      const router = new ModelRouter();
      
      const categories = ['accessibility', 'security', 'i18n', 'seo', 'performance'];
      
      for (const category of categories) {
        const result = await router.route('<div>Content</div>', category);
        
        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
      }
    });
  });

  describe('Patch Generation Integration', () => {
    const { previewFixForFile, applyFixForFile } = require('../src/patcher/patchGenerator');

    it('should generate preview for HTML file', async () => {
      const htmlFile = path.join(testRoot, 'preview.html');
      fs.writeFileSync(htmlFile, `
        <html>
          <body>
            <img src="test.jpg">
            <a href="https://example.com" target="_blank">Link</a>
          </body>
        </html>
      `);

      const preview = await previewFixForFile(htmlFile);

      expect(preview).toBeDefined();
      expect(preview).toContain('alt=');
      expect(preview).toContain('rel=');
    });

    it('should apply fixes to file', async () => {
      const htmlFile = path.join(testRoot, 'apply.html');
      fs.writeFileSync(htmlFile, `
        <html>
          <body>
            <img src="test.jpg">
          </body>
        </html>
      `);

      const originalContent = fs.readFileSync(htmlFile, 'utf-8');
      
      await applyFixForFile(htmlFile);

      const patchFile = htmlFile + '.patch';
      expect(fs.existsSync(patchFile)).toBe(true);

      const patchContent = fs.readFileSync(patchFile, 'utf-8');
      expect(patchContent).toContain('alt=');
    });

    it('should handle TSX files', async () => {
      const tsxFile = path.join(testRoot, 'component.tsx');
      fs.writeFileSync(tsxFile, `
        export const Component = () => (
          <div>
            <img src="logo.png" />
          </div>
        );
      `);

      const preview = await previewFixForFile(tsxFile);

      expect(preview).toBeDefined();
      expect(preview).toContain('alt=');
    });

    it('should handle files with multiple issues', async () => {
      const htmlFile = path.join(testRoot, 'multiple.html');
      fs.writeFileSync(htmlFile, `
        <html>
          <body>
            <img src="img1.jpg">
            <img src="img2.jpg">
            <img src="img3.jpg">
            <a href="https://link1.com" target="_blank">Link 1</a>
            <a href="https://link2.com" target="_blank">Link 2</a>
          </body>
        </html>
      `);

      const preview = await previewFixForFile(htmlFile);

      // Should have multiple alt attributes added
      const altCount = (preview.match(/alt=/g) || []).length;
      expect(altCount).toBeGreaterThanOrEqual(3);

      // Should have multiple rel attributes added
      const relCount = (preview.match(/rel=/g) || []).length;
      expect(relCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe('HTML Report Generation', () => {
    const { generateHTMLReport } = require('../src/utils/htmlReportGenerator');

    it('should generate comprehensive report', async () => {
      const results = [
        {
          fileName: 'test.html',
          fileType: 'HTML',
          isValid: false,
          issues: [
            {
              message: 'Missing alt attribute',
              severity: 'high',
              category: 'Accessibility',
              line: 5,
              column: 10,
              aiSuggestion: 'Add alt="Image description"'
            },
            {
              message: 'Missing rel attribute',
              severity: 'medium',
              category: 'Security',
              line: 8,
              column: 15,
              aiSuggestion: 'Add rel="noopener noreferrer"'
            }
          ],
          aiSuggestedPatches: [],
          rationale: 'Multiple issues detected'
        }
      ];

      const outputPath = path.join(testRoot, 'reports', 'test-report.html');
      await generateHTMLReport(results, outputPath);

      expect(fs.existsSync(outputPath)).toBe(true);

      const content = fs.readFileSync(outputPath, 'utf-8');
      expect(content).toContain('<!DOCTYPE html>');
      expect(content).toContain('test.html');
      expect(content).toContain('Missing alt attribute');
      expect(content).toContain('Accessibility');
      expect(content).toContain('Security');
    });

    it('should handle empty results', async () => {
      const results: any[] = [];
      const outputPath = path.join(testRoot, 'reports', 'empty-report.html');

      await generateHTMLReport(results, outputPath);

      expect(fs.existsSync(outputPath)).toBe(true);
    });

    it('should handle large reports', async () => {
      const results = [];
      
      // Generate 100 file results
      for (let i = 0; i < 100; i++) {
        results.push({
          fileName: `file${i}.html`,
          fileType: 'HTML',
          isValid: false,
          issues: [
            {
              message: `Issue ${i}`,
              severity: 'medium',
              category: 'Accessibility',
              line: i,
              column: 0,
              aiSuggestion: `Fix ${i}`
            }
          ],
          aiSuggestedPatches: [],
          rationale: `Test ${i}`
        });
      }

      const outputPath = path.join(testRoot, 'reports', 'large-report.html');
      
      const startTime = Date.now();
      await generateHTMLReport(results, outputPath);
      const duration = Date.now() - startTime;

      expect(fs.existsSync(outputPath)).toBe(true);
      expect(duration).toBeLessThan(5000); // Should complete quickly

      const stats = fs.statSync(outputPath);
      expect(stats.size).toBeGreaterThan(1000); // Should have substantial content
    });
  });
});
