import * as fs from 'fs';
import * as path from 'path';

describe('Utils Integration Tests', () => {
  const testRoot = path.join(__dirname, 'fixtures', 'utils-integration');

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

  describe('Redact secrets with real patterns', () => {
    const { redactSecrets, redactSecretsInObject } = require('../src/utils/redact');

    it('should redact AWS keys in code snippets', () => {
      const code = `
        const awsConfig = {
          accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
          secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
        };
      `;

      const redacted = redactSecrets(code);
      
      expect(redacted).not.toContain('AKIAIOSFODNN7EXAMPLE');
      expect(redacted).not.toContain('wJalrXUtnFEMI');
      expect(redacted).toContain('[REDACTED_AWS');
    });

    it('should redact GitHub tokens', () => {
      const code = 'const token = "ghp_1234567890abcdefghijklmnopqrstuvwxyz";';
      const redacted = redactSecrets(code);
      
      expect(redacted).not.toContain('ghp_1234567890');
      expect(redacted).toContain('[REDACTED_TOKEN]');
    });

    it('should redact emails in logs', () => {
      const log = 'User john.doe@example.com logged in';
      const redacted = redactSecrets(log);
      
      expect(redacted).not.toContain('john.doe@example.com');
      expect(redacted).toContain('[REDACTED_EMAIL]');
    });

    it('should redact JWT tokens', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      const redacted = redactSecrets(token);
      
      expect(redacted).not.toContain(token);
      expect(redacted).toContain('[REDACTED_TOKEN]');
    });

    it('should redact private keys', () => {
      const key = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKj
-----END PRIVATE KEY-----`;
      
      const redacted = redactSecrets(key);
      
      expect(redacted).not.toContain('MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKj');
      expect(redacted).toContain('[REDACTED_PRIVATE_KEY]');
    });

    it('should redact secrets in nested objects', () => {
      const obj = {
        config: {
          api: {
            key: 'sk-1234567890abcdefghijklmnopqrstuvwxyz',
            url: 'https://api.example.com'
          },
          user: {
            email: 'admin@example.com',
            password: 'secret123'
          }
        },
        metadata: {
          token: 'ghp_abcdefghijklmnopqrstuvwxyz123456'
        }
      };

      const redacted = redactSecretsInObject(obj);
      
      expect(JSON.stringify(redacted)).not.toContain('sk-1234567890');
      expect(JSON.stringify(redacted)).not.toContain('admin@example.com');
      expect(JSON.stringify(redacted)).not.toContain('ghp_abcdefghijklmnopqrstuvwxyz');
      expect(JSON.stringify(redacted)).toContain('[REDACTED');
    });

    it('should handle arrays of objects', () => {
      const arr = [
        { email: 'user1@example.com', token: 'abc123' },
        { email: 'user2@example.com', token: 'def456' }
      ];

      const redacted = redactSecretsInObject(arr);
      
      expect(JSON.stringify(redacted)).not.toContain('user1@example.com');
      expect(JSON.stringify(redacted)).not.toContain('user2@example.com');
    });

    it('should preserve non-sensitive data', () => {
      const code = `
        const config = {
          port: 3000,
          host: 'localhost',
          version: '1.0.0'
        };
      `;

      const redacted = redactSecrets(code);
      
      expect(redacted).toContain('3000');
      expect(redacted).toContain('localhost');
      expect(redacted).toContain('1.0.0');
    });
  });

  describe('Cache with real file operations', () => {
    const { ScanCache } = require('../src/utils/cache');

    it('should persist and retrieve complex results', async () => {
      const cacheDir = path.join(testRoot, '.cache');
      const cache = new ScanCache(60000, 100, 10000, cacheDir);

      const content = `
        export const Component = () => {
          return <div><img src="test.jpg" /></div>;
        };
      `;

      const result = {
        fileName: 'Component.tsx',
        fileType: 'TSX',
        isValid: false,
        issues: [
          {
            message: 'Missing alt attribute',
            severity: 'high',
            category: 'Accessibility',
            line: 2,
            column: 27,
            aiSuggestion: 'Add alt attribute to image'
          }
        ],
        aiSuggestedPatches: [],
        rationale: 'Accessibility issues detected',
        totalTokens: 50
      };

      await cache.set(content, result);
      const retrieved = await cache.get(content);

      expect(retrieved).toBeDefined();
      expect(retrieved?.fileName).toBe('Component.tsx');
      expect(retrieved?.issues.length).toBe(1);
      expect(retrieved?.issues[0].message).toContain('alt');
    });

    it('should handle concurrent cache operations', async () => {
      const cacheDir = path.join(testRoot, '.cache-concurrent');
      const cache = new ScanCache(60000, 100, 10000, cacheDir);

      const operations = [];
      
      // Start 10 concurrent operations
      for (let i = 0; i < 10; i++) {
        operations.push(
          cache.set(`content${i}`, {
            fileName: `file${i}.ts`,
            fileType: 'TS',
            isValid: true,
            issues: [],
            aiSuggestedPatches: [],
            rationale: `test${i}`
          })
        );
      }

      await Promise.all(operations);

      // Verify all were stored
      const retrievals = [];
      for (let i = 0; i < 10; i++) {
        retrievals.push(cache.get(`content${i}`));
      }

      const results = await Promise.all(retrievals);
      expect(results.every(r => r !== undefined)).toBe(true);
    });

    it('should handle cache eviction under memory pressure', async () => {
      const cacheDir = path.join(testRoot, '.cache-eviction');
      const cache = new ScanCache(60000, 3, 10000, cacheDir); // Max 3 entries

      // Add more than the limit
      for (let i = 0; i < 10; i++) {
        await cache.set(`content${i}`, {
          fileName: `file${i}.ts`,
          fileType: 'TS',
          isValid: true,
          issues: [],
          aiSuggestedPatches: [],
          rationale: `test${i}`
        });
      }

      // Most recent should be accessible
      const recent = await cache.get('content9');
      expect(recent).toBeDefined();

      // All should be accessible from disk
      const first = await cache.get('content0');
      expect(first).toBeDefined();
    });
  });

  describe('File analyzer with real files', () => {
    const { FileAnalyzer } = require('../src/utils/fileAnalyzer');

    it('should analyze mixed codebase', () => {
      // Create a mixed project
      fs.writeFileSync(path.join(testRoot, 'app.ts'), `
        import express from 'express';
        
        const app = express();
        
        app.get('/', (req, res) => {
          if (req.query.debug) {
            console.log('Debug mode');
          }
          res.send('Hello');
        });
      `);

      fs.writeFileSync(path.join(testRoot, 'utils.ts'), `
        export const helper = (x: any) => {
          if (x > 10) {
            if (x < 20) {
              return true;
            }
          }
          return false;
        };
      `);

      fs.writeFileSync(path.join(testRoot, 'index.html'), `
        <!DOCTYPE html>
        <html>
          <head><title>Test</title></head>
          <body>
            <img src="logo.png">
            <a href="https://example.com" target="_blank">Link</a>
          </body>
        </html>
      `);

      const analyzer = new FileAnalyzer(testRoot);
      const files = analyzer.getAllSourceFiles();
      const metrics = analyzer.analyzeFiles(files);

      expect(metrics.length).toBeGreaterThanOrEqual(3);
      
      // Check TypeScript files were analyzed
      const tsMetrics = metrics.filter(m => m.language === 'TypeScript');
      expect(tsMetrics.length).toBeGreaterThanOrEqual(2);
      
      // Check HTML file was analyzed
      const htmlMetrics = metrics.filter(m => m.language === 'HTML');
      expect(htmlMetrics.length).toBeGreaterThanOrEqual(1);

      // Check issues were detected
      const hasIssues = metrics.some(m => m.issues.length > 0);
      expect(hasIssues).toBe(true);
    });

    it('should detect code patterns accurately', () => {
      fs.writeFileSync(path.join(testRoot, 'patterns.ts'), `
        // This file tests pattern detection
        
        function complexFunction() {
          if (a) {
            for (let i = 0; i < 10; i++) {
              while (condition) {
                switch (value) {
                  case 1:
                    if (nested) {
                      return true;
                    }
                    break;
                  case 2:
                    break;
                }
              }
            }
          }
        }
        
        const variable: any = getData();
        console.log('Debug:', variable);
      `);

      const analyzer = new FileAnalyzer(testRoot);
      const files = analyzer.getAllSourceFiles();
      const metrics = analyzer.analyzeFiles(files.filter(f => f.includes('patterns.ts')));

      expect(metrics[0].complexity).toBeGreaterThan(10);
      expect(metrics[0].issues.some(i => i.includes('any'))).toBe(true);
      expect(metrics[0].issues.some(i => i.includes('console.log'))).toBe(true);
    });
  });

  describe('AST Patcher with file operations', () => {
    const { generateHtmlAstPatch, generateTsxAstPatch } = require('../src/patcher/astPatcher');

    it('should generate valid HTML patches', () => {
      const html = `
        <html>
          <body>
            <img src="photo.jpg">
            <a href="https://example.com" target="_blank">Link</a>
          </body>
        </html>
      `;

      const patch = generateHtmlAstPatch('test.html', html);

      expect(patch).toContain('alt="Photo"');
      expect(patch).toContain('rel="noopener noreferrer"');
      expect(patch).toContain('lang="en"');
    });

    it('should generate valid TSX patches', () => {
      const tsx = `
        export const Gallery = ({ images }) => (
          <div>
            {images.map(img => (
              <img key={img.id} src={img.url} />
            ))}
          </div>
        );
      `;

      const patch = generateTsxAstPatch('Gallery.tsx', tsx);

      expect(patch).toContain('alt=');
      expect(patch.length).toBeGreaterThan(tsx.length);
    });

    it('should handle malformed HTML gracefully', () => {
      const malformed = '<html><body><img src="test.jpg">';
      
      expect(() => {
        generateHtmlAstPatch('test.html', malformed);
      }).not.toThrow();
    });

    it('should preserve existing attributes', () => {
      const html = `
        <html>
          <body>
            <img src="test.jpg" width="100" height="100">
          </body>
        </html>
      `;

      const patch = generateHtmlAstPatch('test.html', html);

      expect(patch).toContain('width="100"');
      expect(patch).toContain('height="100"');
      expect(patch).toContain('alt=');
    });
  });

  describe('Verification formatting', () => {
    const { formatComparisonSummary, generateComparisonHTML } = require('../src/utils/verificationFormatting');

    it('should format improvement metrics', () => {
      const comparison = {
        before: {
          totalIssues: 50,
          highSeverity: 10,
          mediumSeverity: 25,
          lowSeverity: 15,
          categories: {
            'Accessibility': 20,
            'Security': 15,
            'SEO': 10,
            'Performance': 5
          }
        },
        after: {
          totalIssues: 20,
          highSeverity: 3,
          mediumSeverity: 10,
          lowSeverity: 7,
          categories: {
            'Accessibility': 5,
            'Security': 8,
            'SEO': 5,
            'Performance': 2
          }
        },
        improvement: {
          totalIssues: 60,
          highSeverity: 70,
          mediumSeverity: 60,
          lowSeverity: 53.33
        }
      };

      const summary = formatComparisonSummary(comparison);

      expect(summary).toContain('60%');
      expect(summary).toContain('70%');
      expect(summary).toContain('Accessibility');
      expect(summary).toContain('Security');
    });

    it('should generate valid HTML report', () => {
      const comparison = {
        before: { totalIssues: 50, highSeverity: 10, mediumSeverity: 25, lowSeverity: 15, categories: {} },
        after: { totalIssues: 20, highSeverity: 3, mediumSeverity: 10, lowSeverity: 7, categories: {} },
        improvement: { totalIssues: 60, highSeverity: 70, mediumSeverity: 60, lowSeverity: 53.33 }
      };

      const html = generateComparisonHTML(comparison);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html');
      expect(html).toContain('</html>');
      expect(html).toContain('60%');
      expect(html).toContain('<style>');
    });
  });
});
