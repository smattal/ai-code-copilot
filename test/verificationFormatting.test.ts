import { 
  formatComparisonSummary, 
  generateComparisonHTML 
} from '../src/utils/verificationLoop';
import { ConsolidatedResult } from '../src/scanner';

describe('Verification Loop - Formatting', () => {
  const mockResultsBefore: ConsolidatedResult[] = [
    {
      fileName: 'test1.html',
      fileType: 'HTML',
      isValid: false,
      issues: [
        { category: 'alt-text', description: 'Missing alt', severity: 'high' },
        { category: 'contrast', description: 'Low contrast', severity: 'medium' },
        { category: 'lang', description: 'Missing lang', severity: 'high' }
      ],
      aiSuggestedPatches: [],
      rationale: 'Test'
    },
    {
      fileName: 'test2.html',
      fileType: 'HTML',
      isValid: false,
      issues: [
        { category: 'seo', description: 'Missing meta', severity: 'low' }
      ],
      aiSuggestedPatches: [],
      rationale: 'Test'
    }
  ];

  const mockResultsAfter: ConsolidatedResult[] = [
    {
      fileName: 'test1.html',
      fileType: 'HTML',
      isValid: false,
      issues: [
        { category: 'contrast', description: 'Low contrast', severity: 'medium' }
      ],
      aiSuggestedPatches: [],
      rationale: 'Test'
    }
  ];

  describe('formatComparisonSummary', () => {
    it('should format comparison as text', () => {
      const { calculateMetrics, compareMetrics } = require('../src/utils/verificationLoop');
      
      const before = calculateMetrics(mockResultsBefore);
      const after = calculateMetrics(mockResultsAfter);
      const comparison = compareMetrics(before, after);

      const summary = formatComparisonSummary(comparison);

      expect(summary).toBeDefined();
      expect(typeof summary).toBe('string');
      expect(summary).toContain('Verification Results');
    });

    it('should include before and after metrics', () => {
      const { calculateMetrics, compareMetrics } = require('../src/utils/verificationLoop');
      
      const before = calculateMetrics(mockResultsBefore);
      const after = calculateMetrics(mockResultsAfter);
      const comparison = compareMetrics(before, after);

      const summary = formatComparisonSummary(comparison);

      expect(summary).toContain('Before:');
      expect(summary).toContain('After:');
    });

    it('should show improvement percentage', () => {
      const { calculateMetrics, compareMetrics } = require('../src/utils/verificationLoop');
      
      const before = calculateMetrics(mockResultsBefore);
      const after = calculateMetrics(mockResultsAfter);
      const comparison = compareMetrics(before, after);

      const summary = formatComparisonSummary(comparison);

      expect(summary).toContain('%');
    });

    it('should handle zero improvements', () => {
      const { calculateMetrics, compareMetrics } = require('../src/utils/verificationLoop');
      
      const before = calculateMetrics(mockResultsBefore);
      const after = calculateMetrics(mockResultsBefore);
      const comparison = compareMetrics(before, after);

      const summary = formatComparisonSummary(comparison);

      expect(summary).toBeDefined();
      expect(summary).toContain('0%');
    });
  });

  describe('generateComparisonHTML', () => {
    it('should generate valid HTML', () => {
      const { calculateMetrics, compareMetrics } = require('../src/utils/verificationLoop');
      
      const before = calculateMetrics(mockResultsBefore);
      const after = calculateMetrics(mockResultsAfter);
      const comparison = compareMetrics(before, after);

      const html = generateComparisonHTML(comparison);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html');
      expect(html).toContain('</html>');
    });

    it('should include metrics in HTML', () => {
      const { calculateMetrics, compareMetrics } = require('../src/utils/verificationLoop');
      
      const before = calculateMetrics(mockResultsBefore);
      const after = calculateMetrics(mockResultsAfter);
      const comparison = compareMetrics(before, after);

      const html = generateComparisonHTML(comparison);

      expect(html).toContain('Verification');
      expect(html).toContain('Before');
      expect(html).toContain('After');
    });

    it('should apply styling', () => {
      const { calculateMetrics, compareMetrics } = require('../src/utils/verificationLoop');
      
      const before = calculateMetrics(mockResultsBefore);
      const after = calculateMetrics(mockResultsAfter);
      const comparison = compareMetrics(before, after);

      const html = generateComparisonHTML(comparison);

      expect(html).toContain('<style>');
      expect(html).toContain('</style>');
    });

    it('should show improvement visualization', () => {
      const { calculateMetrics, compareMetrics } = require('../src/utils/verificationLoop');
      
      const before = calculateMetrics(mockResultsBefore);
      const after = calculateMetrics(mockResultsAfter);
      const comparison = compareMetrics(before, after);

      const html = generateComparisonHTML(comparison);

      expect(html).toContain('%');
    });

    it('should handle 100% improvement case', () => {
      const { calculateMetrics, compareMetrics } = require('../src/utils/verificationLoop');
      
      const before = calculateMetrics(mockResultsBefore);
      const after = calculateMetrics([]);
      const comparison = compareMetrics(before, after);

      const html = generateComparisonHTML(comparison);

      expect(html).toContain('100');
    });
  });
});
