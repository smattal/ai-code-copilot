import * as fs from 'fs';
import * as path from 'path';

describe('Complete System Integration Tests', () => {
  const testRoot = path.join(__dirname, 'fixtures', 'system-integration');

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

  describe('End-to-End Scanner Workflow', () => {
    it('should scan HTML, detect issues, generate patches, and create reports', async () => {
      // Create test project
      const srcDir = path.join(testRoot, 'project', 'src');
      fs.mkdirSync(srcDir, { recursive: true });

      fs.writeFileSync(path.join(srcDir, 'index.html'), `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Test App</title>
          </head>
          <body>
            <h1>Welcome</h1>
            <img src="hero.jpg">
            <img src="logo.png">
            <a href="https://example.com" target="_blank">Visit Site</a>
          </body>
        </html>
      `);

      fs.writeFileSync(path.join(srcDir, 'App.tsx'), `
        export const App = () => (
          <div>
            <h1>My App</h1>
            <img src="banner.jpg" />
            <button>Click here</button>
          </div>
        );
      `);

      fs.writeFileSync(path.join(srcDir, 'styles.css'), `
        .header {
          color: #aaa;
          background: #fff;
          font-size: 11px;
        }
        
        .footer {
          color: #ccc;
          background: #fff;
        }
      `);

      const { scanAndReport } = require('../src/scanner/index');
      const results = await scanAndReport(path.join(testRoot, 'project'));

      // Verify scanning worked
      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);

      // Check HTML was scanned
      const htmlResult = results.find((r: any) => r.fileName.includes('index.html'));
      expect(htmlResult).toBeDefined();
      expect(htmlResult.issues.length).toBeGreaterThan(0);

      // Check TSX was scanned
      const tsxResult = results.find((r: any) => r.fileName.includes('App.tsx'));
      expect(tsxResult).toBeDefined();

      // Check CSS was scanned
      const cssResult = results.find((r: any) => r.fileName.includes('styles.css'));
      expect(cssResult).toBeDefined();

      // Generate report
      const { generateHTMLReport } = require('../src/utils/htmlReportGenerator');
      const reportPath = path.join(testRoot, 'reports', 'full-report.html');
      await generateHTMLReport(results, reportPath);

      expect(fs.existsSync(reportPath)).toBe(true);
    });

    it('should cache results on repeated scans', async () => {
      const projectDir = path.join(testRoot, 'cache-test');
      fs.mkdirSync(projectDir, { recursive: true });

      fs.writeFileSync(path.join(projectDir, 'test.html'), `
        <html><body><img src="test.jpg"></body></html>
      `);

      const { scanAndReport } = require('../src/scanner/index');

      // First scan
      const start1 = Date.now();
      const results1 = await scanAndReport(projectDir);
      const time1 = Date.now() - start1;

      // Second scan (should use cache)
      const start2 = Date.now();
      const results2 = await scanAndReport(projectDir);
      const time2 = Date.now() - start2;

      // Results should be consistent
      expect(results1.length).toBe(results2.length);

      // Generally second scan should be faster or similar
      expect(time2).toBeLessThanOrEqual(time1 * 2);
    });

    it('should handle errors gracefully', async () => {
      const { scanAndReport } = require('../src/scanner/index');

      // Non-existent directory
      await expect(
        scanAndReport(path.join(testRoot, 'non-existent'))
      ).resolves.toBeDefined();

      // Empty directory
      const emptyDir = path.join(testRoot, 'empty');
      fs.mkdirSync(emptyDir, { recursive: true });
      
      const results = await scanAndReport(emptyDir);
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('Quality Analysis Workflow', () => {
    it('should analyze complete project structure', async () => {
      const projectDir = path.join(testRoot, 'quality-test');
      const srcDir = path.join(projectDir, 'src');
      const testDir = path.join(projectDir, 'test');

      fs.mkdirSync(srcDir, { recursive: true });
      fs.mkdirSync(testDir, { recursive: true });

      // Create source files
      fs.writeFileSync(path.join(srcDir, 'app.ts'), `
        export class Application {
          private config: any;
          
          constructor() {
            this.config = {};
          }
          
          run() {
            console.log('Starting app');
            if (this.config.debug) {
              console.log('Debug mode');
            }
          }
        }
      `);

      fs.writeFileSync(path.join(srcDir, 'utils.ts'), `
        export const helper = (value: any) => {
          if (value) {
            return true;
          }
          return false;
        };
      `);

      // Create test files
      fs.writeFileSync(path.join(testDir, 'app.test.ts'), `
        import { Application } from '../src/app';
        
        describe('Application', () => {
          it('should initialize', () => {
            const app = new Application();
            expect(app).toBeDefined();
          });
        });
      `);

      // Create config files
      fs.writeFileSync(path.join(projectDir, 'package.json'), JSON.stringify({
        name: 'test-project',
        version: '1.0.0',
        dependencies: {},
        devDependencies: { jest: '29.0.0' }
      }));

      fs.writeFileSync(path.join(projectDir, 'tsconfig.json'), JSON.stringify({
        compilerOptions: { target: 'ES2020', module: 'commonjs' }
      }));

      fs.writeFileSync(path.join(projectDir, 'README.md'), '# Test Project');
      fs.writeFileSync(path.join(projectDir, 'LICENSE'), 'MIT');
      fs.writeFileSync(path.join(projectDir, '.gitignore'), 'node_modules/');

      const { CodeQualityAnalyzer } = require('../src/utils/codeQualityAnalyzer');
      const analyzer = new CodeQualityAnalyzer(projectDir);
      
      const metrics = await analyzer.analyze();

      expect(metrics).toBeDefined();
      expect(metrics.project).toBeDefined();
      expect(metrics.codeComplexity).toBeDefined();
      expect(metrics.maintainability).toBeDefined();
      expect(metrics.testCoverage).toBeDefined();
      expect(metrics.dependencies).toBeDefined();
      expect(metrics.bestPractices).toBeDefined();
      expect(metrics.overallScore).toBeGreaterThanOrEqual(0);
      expect(metrics.overallScore).toBeLessThanOrEqual(100);
      expect(metrics.grade).toMatch(/^[A-F][+-]?$/);
    });

    it('should generate quality reports', async () => {
      const { CodeQualityAnalyzer } = require('../src/utils/codeQualityAnalyzer');
      const { generateCodeQualityReport, generateCodeQualityHTML } = require('../src/utils/qualityReporter');

      const projectDir = path.join(testRoot, 'report-test');
      fs.mkdirSync(projectDir, { recursive: true });

      fs.writeFileSync(path.join(projectDir, 'test.ts'), 'const x = 1;');
      fs.writeFileSync(path.join(projectDir, 'package.json'), JSON.stringify({ name: 'test' }));

      const analyzer = new CodeQualityAnalyzer(projectDir);
      const metrics = await analyzer.analyze();

      // Generate text report
      const textReport = generateCodeQualityReport(metrics);
      expect(textReport).toContain('CODE QUALITY REPORT');
      expect(textReport).toContain('Overall Score');

      // Generate HTML report
      const htmlReport = generateCodeQualityHTML(metrics);
      expect(htmlReport).toContain('<!DOCTYPE html>');
      expect(htmlReport).toContain('Overall Score');
    });
  });

  describe('File Analyzer Edge Cases', () => {
    it('should handle various file encodings', () => {
      const { FileAnalyzer } = require('../src/utils/fileAnalyzer');

      // Create files with different content
      fs.writeFileSync(path.join(testRoot, 'ascii.ts'), 'const x = 1;');
      fs.writeFileSync(path.join(testRoot, 'utf8.ts'), 'const greeting = "Hello 世界";');
      fs.writeFileSync(path.join(testRoot, 'special.ts'), 'const emoji = "🚀";');

      const analyzer = new FileAnalyzer(testRoot);
      const files = analyzer.getAllSourceFiles().filter(f => 
        f.includes('ascii.ts') || f.includes('utf8.ts') || f.includes('special.ts')
      );
      
      const metrics = analyzer.analyzeFiles(files);

      expect(metrics.length).toBe(3);
      metrics.forEach(m => {
        expect(m.lines).toBeGreaterThan(0);
      });
    });

    it('should detect all complexity patterns', () => {
      const { FileAnalyzer } = require('../src/utils/fileAnalyzer');

      fs.writeFileSync(path.join(testRoot, 'complexity.ts'), `
        function testComplexity() {
          // If statements
          if (a) {}
          if (b) {}
          
          // For loops
          for (let i = 0; i < 10; i++) {}
          for (const item of items) {}
          
          // While loops
          while (condition) {}
          do {} while (condition);
          
          // Switch cases
          switch (value) {
            case 1: break;
            case 2: break;
            case 3: break;
          }
          
          // Logical operators
          if (a && b || c && d) {}
          
          // Ternary
          const x = condition ? 1 : 2;
          
          // Try-catch
          try {} catch (e) {}
        }
      `);

      const analyzer = new FileAnalyzer(testRoot);
      const files = analyzer.getAllSourceFiles().filter(f => f.includes('complexity.ts'));
      const metrics = analyzer.analyzeFiles(files);

      expect(metrics[0].complexity).toBeGreaterThan(10);
    });

    it('should handle deeply nested directories', () => {
      const { FileAnalyzer } = require('../src/utils/fileAnalyzer');

      const deepPath = path.join(testRoot, 'a', 'b', 'c', 'd', 'e');
      fs.mkdirSync(deepPath, { recursive: true });
      fs.writeFileSync(path.join(deepPath, 'deep.ts'), 'const x = 1;');

      const analyzer = new FileAnalyzer(testRoot);
      const files = analyzer.getAllSourceFiles();

      expect(files.some(f => f.includes('deep.ts'))).toBe(true);
    });
  });

  describe('Metrics Calculator Comprehensive', () => {
    it('should calculate all metrics for realistic project', () => {
      const { MetricsCalculator } = require('../src/utils/metricsCalculator');
      const { FileMetrics } = require('../src/utils/fileAnalyzer');

      const calculator = new MetricsCalculator();
      
      const files: any[] = [
        // Source files
        ...Array.from({ length: 20 }, (_, i) => ({
          filePath: `/src/module${i}.ts`,
          language: 'TypeScript',
          lines: 100 + i * 10,
          codeLines: 80 + i * 8,
          commentLines: 10 + i,
          blankLines: 10,
          complexity: 5 + Math.floor(i / 2),
          functions: 3 + Math.floor(i / 3),
          classes: Math.floor(i / 5),
          imports: 2 + Math.floor(i / 4),
          exports: 1 + Math.floor(i / 5),
          issues: i % 3 === 0 ? ['Some issue'] : []
        })),
        // Test files
        ...Array.from({ length: 10 }, (_, i) => ({
          filePath: `/test/module${i}.test.ts`,
          language: 'TypeScript',
          lines: 50 + i * 5,
          codeLines: 40 + i * 4,
          commentLines: 5,
          blankLines: 5,
          complexity: 2 + Math.floor(i / 3),
          functions: 2 + Math.floor(i / 2),
          classes: 0,
          imports: 2,
          exports: 0,
          issues: []
        })),
        // HTML files
        ...Array.from({ length: 5 }, (_, i) => ({
          filePath: `/public/page${i}.html`,
          language: 'HTML',
          lines: 50,
          codeLines: 45,
          commentLines: 2,
          blankLines: 3,
          complexity: 1,
          functions: 0,
          classes: 0,
          imports: 0,
          exports: 0,
          issues: ['Missing meta tag']
        })),
        // CSS files
        ...Array.from({ length: 3 }, (_, i) => ({
          filePath: `/styles/style${i}.css`,
          language: 'CSS',
          lines: 100,
          codeLines: 90,
          commentLines: 5,
          blankLines: 5,
          complexity: 1,
          functions: 0,
          classes: 0,
          imports: 0,
          exports: 0,
          issues: ['Low contrast']
        }))
      ];

      const projectMetrics = calculator.calculateProjectMetrics(files);
      const complexityMetrics = calculator.calculateComplexityMetrics(files);
      const maintainability = calculator.calculateMaintainability(files);
      const testCoverage = calculator.analyzeTestCoverage(files);

      // Project metrics
      expect(projectMetrics.totalFiles).toBe(38);
      expect(projectMetrics.totalLines).toBeGreaterThan(1000);
      expect(projectMetrics.languages['TypeScript']).toBe(30);
      expect(projectMetrics.languages['HTML']).toBe(5);
      expect(projectMetrics.languages['CSS']).toBe(3);

      // Complexity metrics
      expect(complexityMetrics.averageComplexity).toBeGreaterThan(0);
      expect(complexityMetrics.maxComplexity).toBeGreaterThan(5);

      // Maintainability
      expect(maintainability.score).toBeGreaterThanOrEqual(0);
      expect(maintainability.score).toBeLessThanOrEqual(100);
      expect(maintainability.codeSmells.length).toBeGreaterThan(0);

      // Test coverage
      expect(testCoverage.hasTests).toBe(true);
      expect(testCoverage.testFiles).toBe(10);
      expect(testCoverage.estimatedCoverage).toBeGreaterThan(0);

      // Grade calculation
      const overallScore = (
        (maintainability.score * 0.3) +
        (Math.max(0, 100 - complexityMetrics.averageComplexity * 5) * 0.2) +
        (testCoverage.estimatedCoverage * 0.3) +
        (50 * 0.2) // Best practices
      );

      const grade = calculator.calculateGrade(overallScore);
      expect(grade).toMatch(/^[A-F][+-]?$/);
    });
  });

  describe('Secret Redaction Edge Cases', () => {
    it('should handle mixed content with multiple secret types', () => {
      const { redactSecrets } = require('../src/utils/redact');

      const content = `
        const config = {
          awsAccessKey: 'AKIAIOSFODNN7EXAMPLE',
          awsSecretKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
          email: 'admin@company.com',
          githubToken: 'ghp_1234567890abcdefghijklmnopqrstuvwxyz',
          apiKey: 'sk-1234567890abcdefghijklmnopqrstuvwxyz',
          privateKey: '-----BEGIN PRIVATE KEY-----\\nMIIEv...\\n-----END PRIVATE KEY-----',
          jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature'
        };
      `;

      const redacted = redactSecrets(content);

      expect(redacted).not.toContain('AKIAIOSFODNN7EXAMPLE');
      expect(redacted).not.toContain('wJalrXUtnFEMI');
      expect(redacted).not.toContain('admin@company.com');
      expect(redacted).not.toContain('ghp_1234567890');
      expect(redacted).not.toContain('sk-1234567890');
      expect(redacted).toContain('[REDACTED');
    });

    it('should preserve code structure while redacting', () => {
      const { redactSecrets } = require('../src/utils/redact');

      const code = `
        function connect() {
          const credentials = {
            user: 'admin@example.com',
            pass: 'secret123',
            host: 'localhost',
            port: 5432
          };
          return db.connect(credentials);
        }
      `;

      const redacted = redactSecrets(code);

      expect(redacted).toContain('function connect');
      expect(redacted).toContain('localhost');
      expect(redacted).toContain('5432');
      expect(redacted).not.toContain('admin@example.com');
    });
  });

  describe('Verification Loop Integration', () => {
    it('should compare before and after metrics', () => {
      const { calculateMetrics, compareMetrics } = require('../src/utils/verificationLoop');

      const issuesBefore = [
        { message: 'Issue 1', severity: 'high', category: 'Accessibility', line: 1, column: 0 },
        { message: 'Issue 2', severity: 'high', category: 'Accessibility', line: 2, column: 0 },
        { message: 'Issue 3', severity: 'medium', category: 'Security', line: 3, column: 0 },
        { message: 'Issue 4', severity: 'medium', category: 'Security', line: 4, column: 0 },
        { message: 'Issue 5', severity: 'low', category: 'SEO', line: 5, column: 0 }
      ];

      const issuesAfter = [
        { message: 'Issue 3', severity: 'medium', category: 'Security', line: 3, column: 0 },
        { message: 'Issue 5', severity: 'low', category: 'SEO', line: 5, column: 0 }
      ];

      const metricsBefore = calculateMetrics([{
        fileName: 'test.html',
        fileType: 'HTML',
        isValid: false,
        issues: issuesBefore,
        aiSuggestedPatches: [],
        rationale: 'test'
      }]);

      const metricsAfter = calculateMetrics([{
        fileName: 'test.html',
        fileType: 'HTML',
        isValid: false,
        issues: issuesAfter,
        aiSuggestedPatches: [],
        rationale: 'test'
      }]);

      const comparison = compareMetrics(metricsBefore, metricsAfter);

      expect(comparison.improvement.totalIssues).toBeGreaterThan(50);
      expect(comparison.improvement.highSeverity).toBe(100);
    });
  });
});
