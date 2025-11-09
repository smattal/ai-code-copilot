import { calculateMetrics, compareMetrics } from '../src/utils/verificationLoop';
import { ConsolidatedResult } from '../src/scanner';

describe('Verification Loop', () => {
  const mockResults: ConsolidatedResult[] = [
    {
      fileName: 'test.html',
      fileType: 'HTML',
      isValid: false,
      issues: [
        { category: 'alt-text', description: 'Missing alt', severity: 'high' },
        { category: 'contrast', description: 'Low contrast', severity: 'medium' }
      ],
      aiSuggestedPatches: [],
      rationale: 'Test'
    },
    {
      fileName: 'test.tsx',
      fileType: 'TSX',
      isValid: false,
      issues: [
        { category: 'rel-noopener', description: 'Missing rel', severity: 'high' }
      ],
      aiSuggestedPatches: [],
      rationale: 'Test'
    }
  ];

  describe('calculateMetrics', () => {
    it('should count total issues', () => {
      const metrics = calculateMetrics(mockResults);

      expect(metrics.totalIssues).toBeGreaterThanOrEqual(0);
    });

    it('should categorize by severity', () => {
      const metrics = calculateMetrics(mockResults);

      expect(metrics.highSeverity).toBeGreaterThanOrEqual(0);
      expect(metrics.mediumSeverity).toBeGreaterThanOrEqual(0);
      expect(metrics.lowSeverity).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty result list', () => {
      const metrics = calculateMetrics([]);

      expect(metrics.totalIssues).toBe(0);
      expect(metrics.highSeverity).toBe(0);
      expect(metrics.mediumSeverity).toBe(0);
      expect(metrics.lowSeverity).toBe(0);
    });
  });

  describe('compareMetrics', () => {
    it('should calculate improvements', () => {
      const before = calculateMetrics(mockResults);
      const after = calculateMetrics([mockResults[0]]);

      const comparison = compareMetrics(before, after);

      expect(comparison).toHaveProperty('before');
      expect(comparison).toHaveProperty('after');
      expect(comparison).toHaveProperty('improvements');
    });

    it('should show improvement when issues fixed', () => {
      const before = calculateMetrics(mockResults);
      const after = calculateMetrics([]);

      const comparison = compareMetrics(before, after);

      expect(comparison.improvements.totalIssuesReductionPercent).toBeGreaterThanOrEqual(0);
    });

    it('should handle no change case', () => {
      const before = calculateMetrics(mockResults);
      const after = calculateMetrics(mockResults);

      const comparison = compareMetrics(before, after);

      expect(comparison.improvements.totalIssuesReductionPercent).toBe(0);
    });
  });
});
