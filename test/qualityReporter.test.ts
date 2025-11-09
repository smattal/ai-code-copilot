import { generateCodeQualityReport, generateCodeQualityHTML } from '../src/utils/qualityReporter';
import { CodeQualityMetrics } from '../src/utils/qualityMetricsTypes';

describe('Quality Reporter', () => {
  const mockMetrics: CodeQualityMetrics = {
    project: {
      name: 'test-project',
      totalFiles: 10,
      totalLines: 1000,
      totalCodeLines: 800,
      totalCommentLines: 100,
      totalBlankLines: 100,
      languages: { TypeScript: 8, JavaScript: 2 }
    },
    files: [],
    codeComplexity: {
      averageComplexity: 10,
      maxComplexity: 25,
      filesOverThreshold: 2,
      complexFiles: [{ file: 'complex.ts', complexity: 25 }]
    },
    maintainability: {
      score: 75,
      codeSmells: ['Uses "any" type'],
      duplicateCode: 0,
      longFunctions: 0,
      deepNesting: 0
    },
    testCoverage: {
      hasTests: true,
      testFiles: 5,
      testToCodeRatio: 0.5,
      estimatedCoverage: 70
    },
    dependencies: {
      total: 20,
      production: 12,
      development: 8,
      outdated: 0,
      security: []
    },
    bestPractices: {
      hasReadme: true,
      hasLicense: true,
      hasGitignore: true,
      hasTypeScript: true,
      hasLinting: true,
      hasTesting: true,
      hasCI: false,
      hasDocs: false
    },
    overallScore: 75,
    grade: 'B'
  };

  describe('generateCodeQualityReport', () => {
    it('should generate text report', () => {
      const report = generateCodeQualityReport(mockMetrics);

      expect(report).toContain('CODE QUALITY REPORT');
      expect(report).toContain('Overall Score');
      expect(report).toContain('75/100');
      expect(report).toContain('Grade: B');
    });

    it('should include all sections', () => {
      const report = generateCodeQualityReport(mockMetrics);

      expect(report).toContain('Project Overview');
      expect(report).toContain('Code Complexity');
      expect(report).toContain('Maintainability');
      expect(report).toContain('Test Coverage');
      expect(report).toContain('Dependencies');
      expect(report).toContain('Best Practices');
    });

    it('should show code smells if present', () => {
      const report = generateCodeQualityReport(mockMetrics);

      expect(report).toContain('Code Smells');
      expect(report).toContain('Uses "any" type');
    });

    it('should handle metrics without code smells', () => {
      const cleanMetrics = { ...mockMetrics, maintainability: { ...mockMetrics.maintainability, codeSmells: [] } };
      const report = generateCodeQualityReport(cleanMetrics);

      expect(report).toBeDefined();
      expect(report).toContain('CODE QUALITY REPORT');
    });
  });

  describe('generateCodeQualityHTML', () => {
    it('should generate valid HTML', () => {
      const html = generateCodeQualityHTML(mockMetrics);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html');
      expect(html).toContain('</html>');
    });

    it('should include metrics in HTML', () => {
      const html = generateCodeQualityHTML(mockMetrics);

      expect(html).toContain('75/100');
      expect(html).toContain('Grade: B');
    });

    it('should apply styling', () => {
      const html = generateCodeQualityHTML(mockMetrics);

      expect(html).toContain('<style>');
      expect(html).toContain('background');
      expect(html).toContain('color');
    });

    it('should include all metric sections', () => {
      const html = generateCodeQualityHTML(mockMetrics);

      expect(html).toContain('Project Overview');
      expect(html).toContain('Code Complexity');
      expect(html).toContain('Maintainability');
    });
  });
});
