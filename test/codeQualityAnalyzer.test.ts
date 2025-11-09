import { CodeQualityAnalyzer } from '../src/utils/codeQualityAnalyzer';
import * as path from 'path';

describe('CodeQualityAnalyzer', () => {
  let analyzer: CodeQualityAnalyzer;

  beforeEach(() => {
    analyzer = new CodeQualityAnalyzer(path.resolve(__dirname, '..'));
  });

  describe('analyze', () => {
    it('should return comprehensive metrics', async () => {
      const metrics = await analyzer.analyze();

      expect(metrics).toHaveProperty('project');
      expect(metrics).toHaveProperty('files');
      expect(metrics).toHaveProperty('codeComplexity');
      expect(metrics).toHaveProperty('maintainability');
      expect(metrics).toHaveProperty('testCoverage');
      expect(metrics).toHaveProperty('dependencies');
      expect(metrics).toHaveProperty('bestPractices');
      expect(metrics).toHaveProperty('overallScore');
      expect(metrics).toHaveProperty('grade');
    });

    it('should calculate overall score', async () => {
      const metrics = await analyzer.analyze();

      expect(metrics.overallScore).toBeGreaterThanOrEqual(0);
      expect(metrics.overallScore).toBeLessThanOrEqual(100);
    });

    it('should assign a grade', async () => {
      const metrics = await analyzer.analyze();

      expect(metrics.grade).toMatch(/^[A-F][+-]?$/);
    });

    it('should analyze project structure', async () => {
      const metrics = await analyzer.analyze();

      expect(metrics.project.totalFiles).toBeGreaterThan(0);
      expect(metrics.project.totalLines).toBeGreaterThan(0);
      expect(metrics.project.name).toBeDefined();
    });

    it('should return array of file metrics', async () => {
      const metrics = await analyzer.analyze();

      expect(Array.isArray(metrics.files)).toBe(true);
      expect(metrics.files.length).toBeGreaterThan(0);
    });
  });
});
