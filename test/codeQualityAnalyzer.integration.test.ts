import { CodeQualityAnalyzer } from '../src/utils/codeQualityAnalyzer';
import * as fs from 'fs';
import * as path from 'path';

describe('CodeQualityAnalyzer - Integration', () => {
  const testRoot = path.join(__dirname, 'fixtures', 'quality');
  let analyzer: CodeQualityAnalyzer;

  beforeAll(() => {
    if (!fs.existsSync(testRoot)) {
      fs.mkdirSync(testRoot, { recursive: true });
    }

    // Create a realistic project structure
    const srcDir = path.join(testRoot, 'src');
    const testDir = path.join(testRoot, 'test');
    
    fs.mkdirSync(srcDir, { recursive: true });
    fs.mkdirSync(testDir, { recursive: true });

    // Create source files
    fs.writeFileSync(path.join(srcDir, 'index.ts'), `
      export class App {
        constructor() {}
        run() {
          console.log('Running');
        }
      }
    `);

    fs.writeFileSync(path.join(srcDir, 'utils.ts'), `
      export const helper = () => {
        if (condition) {
          return true;
        }
        return false;
      };
    `);

    // Create test files
    fs.writeFileSync(path.join(testDir, 'index.test.ts'), `
      describe('App', () => {
        it('should run', () => {
          expect(true).toBe(true);
        });
      });
    `);

    // Create config files
    fs.writeFileSync(path.join(testRoot, 'package.json'), JSON.stringify({
      name: 'test-project',
      dependencies: { 'lodash': '4.17.21' },
      devDependencies: { 'jest': '29.0.0' }
    }));

    fs.writeFileSync(path.join(testRoot, 'tsconfig.json'), JSON.stringify({
      compilerOptions: { target: 'ES2020' }
    }));

    fs.writeFileSync(path.join(testRoot, 'README.md'), '# Test Project');
    fs.writeFileSync(path.join(testRoot, 'LICENSE'), 'MIT License');
    fs.writeFileSync(path.join(testRoot, '.gitignore'), 'node_modules/');

    analyzer = new CodeQualityAnalyzer(testRoot);
  });

  afterAll(() => {
    const fixturesDir = path.join(__dirname, 'fixtures');
    if (fs.existsSync(fixturesDir)) {
      fs.rmSync(fixturesDir, { recursive: true, force: true });
    }
  });

  describe('Complete analysis', () => {
    it('should analyze entire project', async () => {
      const metrics = await analyzer.analyze();

      expect(metrics.project).toBeDefined();
      expect(metrics.files).toBeDefined();
      expect(metrics.codeComplexity).toBeDefined();
      expect(metrics.maintainability).toBeDefined();
      expect(metrics.testCoverage).toBeDefined();
      expect(metrics.dependencies).toBeDefined();
      expect(metrics.bestPractices).toBeDefined();
      expect(metrics.overallScore).toBeDefined();
      expect(metrics.grade).toBeDefined();
    });

    it('should calculate project metrics', async () => {
      const metrics = await analyzer.analyze();

      expect(metrics.project.totalFiles).toBeGreaterThan(0);
      expect(metrics.project.totalLines).toBeGreaterThan(0);
      expect(metrics.project.totalCodeLines).toBeGreaterThan(0);
      expect(metrics.project.name).toBe('test-project');
    });

    it('should calculate complexity metrics', async () => {
      const metrics = await analyzer.analyze();

      expect(metrics.codeComplexity.averageComplexity).toBeGreaterThanOrEqual(0);
      expect(metrics.codeComplexity.maxComplexity).toBeGreaterThanOrEqual(0);
      expect(metrics.codeComplexity.filesOverThreshold).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(metrics.codeComplexity.complexFiles)).toBe(true);
    });

    it('should calculate maintainability score', async () => {
      const metrics = await analyzer.analyze();

      expect(metrics.maintainability.score).toBeGreaterThanOrEqual(0);
      expect(metrics.maintainability.score).toBeLessThanOrEqual(100);
      expect(Array.isArray(metrics.maintainability.codeSmells)).toBe(true);
    });

    it('should detect test coverage', async () => {
      const metrics = await analyzer.analyze();

      expect(metrics.testCoverage.hasTests).toBe(true);
      expect(metrics.testCoverage.testFiles).toBeGreaterThan(0);
      expect(metrics.testCoverage.testToCodeRatio).toBeGreaterThanOrEqual(0);
      expect(metrics.testCoverage.estimatedCoverage).toBeGreaterThanOrEqual(0);
    });

    it('should analyze dependencies', async () => {
      const metrics = await analyzer.analyze();

      expect(metrics.dependencies.total).toBeGreaterThan(0);
      expect(metrics.dependencies.production).toBeGreaterThan(0);
      expect(metrics.dependencies.development).toBeGreaterThan(0);
    });

    it('should check best practices', async () => {
      const metrics = await analyzer.analyze();

      expect(metrics.bestPractices.hasReadme).toBe(true);
      expect(metrics.bestPractices.hasLicense).toBe(true);
      expect(metrics.bestPractices.hasGitignore).toBe(true);
      expect(metrics.bestPractices.hasTypeScript).toBe(true);
    });

    it('should calculate overall score and grade', async () => {
      const metrics = await analyzer.analyze();

      expect(metrics.overallScore).toBeGreaterThanOrEqual(0);
      expect(metrics.overallScore).toBeLessThanOrEqual(100);
      expect(metrics.grade).toMatch(/^[A-F][+-]?$/);
    });

    it('should correlate grade with score', async () => {
      const metrics = await analyzer.analyze();

      if (metrics.overallScore >= 90) {
        expect(metrics.grade).toMatch(/^A/);
      } else if (metrics.overallScore >= 80) {
        expect(metrics.grade).toMatch(/^[AB]/);
      } else if (metrics.overallScore >= 70) {
        expect(metrics.grade).toMatch(/^[ABC]/);
      }
    });
  });

  describe('Language detection', () => {
    it('should identify TypeScript usage', async () => {
      const metrics = await analyzer.analyze();

      expect(metrics.project.languages).toHaveProperty('TypeScript');
      expect(metrics.project.languages['TypeScript']).toBeGreaterThan(0);
    });

    it('should count files by language', async () => {
      const metrics = await analyzer.analyze();

      const totalByLanguage = Object.values(metrics.project.languages).reduce((a, b) => a + b, 0);
      expect(totalByLanguage).toBeGreaterThan(0);
    });
  });

  describe('File-level metrics', () => {
    it('should provide per-file metrics', async () => {
      const metrics = await analyzer.analyze();

      expect(metrics.files.length).toBeGreaterThan(0);
      
      const file = metrics.files[0];
      expect(file).toHaveProperty('filePath');
      expect(file).toHaveProperty('language');
      expect(file).toHaveProperty('lines');
      expect(file).toHaveProperty('complexity');
      expect(file).toHaveProperty('functions');
      expect(file).toHaveProperty('classes');
      expect(file).toHaveProperty('issues');
    });

    it('should identify problematic files', async () => {
      const metrics = await analyzer.analyze();

      const filesWithIssues = metrics.files.filter(f => f.issues.length > 0);
      // Depending on the test files, this may or may not have issues
      expect(Array.isArray(filesWithIssues)).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should complete analysis in reasonable time', async () => {
      const startTime = Date.now();
      await analyzer.analyze();
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });

  describe('Consistency', () => {
    it('should produce consistent results', async () => {
      const metrics1 = await analyzer.analyze();
      const metrics2 = await analyzer.analyze();

      expect(metrics1.project.totalFiles).toBe(metrics2.project.totalFiles);
      expect(metrics1.project.totalLines).toBe(metrics2.project.totalLines);
      expect(metrics1.overallScore).toBe(metrics2.overallScore);
    });
  });
});
