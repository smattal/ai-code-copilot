import { MetricsCalculator } from '../src/utils/metricsCalculator';
import { FileMetrics } from '../src/utils/fileAnalyzer';

describe('MetricsCalculator - Edge Cases', () => {
  let calculator: MetricsCalculator;

  beforeEach(() => {
    calculator = new MetricsCalculator();
  });

  describe('calculateProjectMetrics with edge cases', () => {
    it('should handle single file project', () => {
      const files: FileMetrics[] = [{
        filePath: '/test.ts',
        language: 'TypeScript',
        lines: 100,
        codeLines: 80,
        commentLines: 10,
        blankLines: 10,
        complexity: 5,
        functions: 3,
        classes: 1,
        imports: 2,
        exports: 1,
        issues: []
      }];

      const metrics = calculator.calculateProjectMetrics(files);

      expect(metrics.totalFiles).toBe(1);
      expect(metrics.totalLines).toBe(100);
      expect(metrics.totalCodeLines).toBe(80);
      expect(metrics.totalCommentLines).toBe(10);
      expect(metrics.languages['TypeScript']).toBe(1);
    });

    it('should aggregate multiple language files', () => {
      const files: FileMetrics[] = [
        {
          filePath: '/test.ts',
          language: 'TypeScript',
          lines: 100,
          codeLines: 80,
          commentLines: 10,
          blankLines: 10,
          complexity: 5,
          functions: 3,
          classes: 1,
          imports: 2,
          exports: 1,
          issues: []
        },
        {
          filePath: '/test.html',
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
          issues: []
        },
        {
          filePath: '/test.css',
          language: 'CSS',
          lines: 30,
          codeLines: 25,
          commentLines: 3,
          blankLines: 2,
          complexity: 1,
          functions: 0,
          classes: 0,
          imports: 0,
          exports: 0,
          issues: []
        }
      ];

      const metrics = calculator.calculateProjectMetrics(files);

      expect(metrics.totalFiles).toBe(3);
      expect(metrics.totalLines).toBe(180);
      expect(metrics.languages['TypeScript']).toBe(1);
      expect(metrics.languages['HTML']).toBe(1);
      expect(metrics.languages['CSS']).toBe(1);
    });

    it('should handle files with zero lines', () => {
      const files: FileMetrics[] = [{
        filePath: '/empty.ts',
        language: 'TypeScript',
        lines: 0,
        codeLines: 0,
        commentLines: 0,
        blankLines: 0,
        complexity: 0,
        functions: 0,
        classes: 0,
        imports: 0,
        exports: 0,
        issues: []
      }];

      const metrics = calculator.calculateProjectMetrics(files);

      expect(metrics.totalFiles).toBe(1);
      expect(metrics.totalLines).toBe(0);
    });

    it('should count multiple files of same language', () => {
      const files: FileMetrics[] = [
        {
          filePath: '/test1.ts',
          language: 'TypeScript',
          lines: 100,
          codeLines: 80,
          commentLines: 10,
          blankLines: 10,
          complexity: 5,
          functions: 3,
          classes: 1,
          imports: 2,
          exports: 1,
          issues: []
        },
        {
          filePath: '/test2.ts',
          language: 'TypeScript',
          lines: 150,
          codeLines: 120,
          commentLines: 15,
          blankLines: 15,
          complexity: 7,
          functions: 5,
          classes: 2,
          imports: 3,
          exports: 2,
          issues: []
        },
        {
          filePath: '/test3.ts',
          language: 'TypeScript',
          lines: 200,
          codeLines: 160,
          commentLines: 20,
          blankLines: 20,
          complexity: 10,
          functions: 8,
          classes: 3,
          imports: 4,
          exports: 3,
          issues: []
        }
      ];

      const metrics = calculator.calculateProjectMetrics(files);

      expect(metrics.totalFiles).toBe(3);
      expect(metrics.languages['TypeScript']).toBe(3);
      expect(metrics.totalLines).toBe(450);
    });
  });

  describe('calculateComplexityMetrics edge cases', () => {
    it('should handle all files with same complexity', () => {
      const files: FileMetrics[] = [
        { filePath: '/test1.ts', language: 'TypeScript', lines: 100, codeLines: 80, commentLines: 10, blankLines: 10, complexity: 10, functions: 3, classes: 1, imports: 2, exports: 1, issues: [] },
        { filePath: '/test2.ts', language: 'TypeScript', lines: 100, codeLines: 80, commentLines: 10, blankLines: 10, complexity: 10, functions: 3, classes: 1, imports: 2, exports: 1, issues: [] },
        { filePath: '/test3.ts', language: 'TypeScript', lines: 100, codeLines: 80, commentLines: 10, blankLines: 10, complexity: 10, functions: 3, classes: 1, imports: 2, exports: 1, issues: [] }
      ];

      const metrics = calculator.calculateComplexityMetrics(files);

      expect(metrics.averageComplexity).toBe(10);
      expect(metrics.maxComplexity).toBe(10);
      expect(metrics.filesOverThreshold).toBe(3);
    });

    it('should identify complex files correctly', () => {
      const files: FileMetrics[] = [
        { filePath: '/simple.ts', language: 'TypeScript', lines: 50, codeLines: 40, commentLines: 5, blankLines: 5, complexity: 5, functions: 2, classes: 1, imports: 1, exports: 1, issues: [] },
        { filePath: '/complex.ts', language: 'TypeScript', lines: 200, codeLines: 180, commentLines: 10, blankLines: 10, complexity: 25, functions: 10, classes: 3, imports: 5, exports: 3, issues: [] },
        { filePath: '/medium.ts', language: 'TypeScript', lines: 100, codeLines: 90, commentLines: 5, blankLines: 5, complexity: 12, functions: 5, classes: 2, imports: 3, exports: 2, issues: [] }
      ];

      const metrics = calculator.calculateComplexityMetrics(files);

      expect(metrics.complexFiles.length).toBeGreaterThan(0);
      expect(metrics.complexFiles[0].filePath).toContain('complex.ts');
      expect(metrics.complexFiles[0].complexity).toBe(25);
    });

    it('should handle zero complexity files', () => {
      const files: FileMetrics[] = [
        { filePath: '/constants.ts', language: 'TypeScript', lines: 10, codeLines: 10, commentLines: 0, blankLines: 0, complexity: 0, functions: 0, classes: 0, imports: 0, exports: 1, issues: [] }
      ];

      const metrics = calculator.calculateComplexityMetrics(files);

      expect(metrics.averageComplexity).toBe(0);
      expect(metrics.filesOverThreshold).toBe(0);
    });
  });

  describe('calculateMaintainability edge cases', () => {
    it('should handle project with no issues', () => {
      const files: FileMetrics[] = [
        { filePath: '/perfect.ts', language: 'TypeScript', lines: 100, codeLines: 80, commentLines: 15, blankLines: 5, complexity: 5, functions: 5, classes: 2, imports: 3, exports: 2, issues: [] }
      ];

      const metrics = calculator.calculateMaintainability(files);

      expect(metrics.score).toBeGreaterThan(80);
      expect(metrics.codeSmells.length).toBe(0);
    });

    it('should penalize many issues', () => {
      const files: FileMetrics[] = [
        {
          filePath: '/problematic.ts',
          language: 'TypeScript',
          lines: 700,
          codeLines: 600,
          commentLines: 10,
          blankLines: 90,
          complexity: 35,
          functions: 20,
          classes: 5,
          imports: 15,
          exports: 10,
          issues: [
            'Uses "any" type',
            'Contains console.log statements',
            'File is too large (>500 lines)',
            'High complexity (35)',
            'Low test coverage'
          ]
        }
      ];

      const metrics = calculator.calculateMaintainability(files);

      expect(metrics.score).toBeLessThan(50);
      expect(metrics.codeSmells.length).toBeGreaterThan(3);
    });

    it('should consider code to comment ratio', () => {
      const wellCommented: FileMetrics[] = [
        { filePath: '/documented.ts', language: 'TypeScript', lines: 100, codeLines: 60, commentLines: 30, blankLines: 10, complexity: 5, functions: 5, classes: 2, imports: 3, exports: 2, issues: [] }
      ];

      const poorlyCommented: FileMetrics[] = [
        { filePath: '/undocumented.ts', language: 'TypeScript', lines: 100, codeLines: 95, commentLines: 1, blankLines: 4, complexity: 5, functions: 5, classes: 2, imports: 3, exports: 2, issues: [] }
      ];

      const wellScore = calculator.calculateMaintainability(wellCommented).score;
      const poorScore = calculator.calculateMaintainability(poorlyCommented).score;

      expect(wellScore).toBeGreaterThan(poorScore);
    });
  });

  describe('analyzeTestCoverage edge cases', () => {
    it('should detect various test file patterns', () => {
      const files: FileMetrics[] = [
        { filePath: '/src/app.ts', language: 'TypeScript', lines: 100, codeLines: 80, commentLines: 10, blankLines: 10, complexity: 5, functions: 5, classes: 2, imports: 3, exports: 2, issues: [] },
        { filePath: '/test/app.test.ts', language: 'TypeScript', lines: 50, codeLines: 45, commentLines: 2, blankLines: 3, complexity: 3, functions: 3, classes: 0, imports: 2, exports: 0, issues: [] },
        { filePath: '/test/utils.spec.ts', language: 'TypeScript', lines: 40, codeLines: 35, commentLines: 2, blankLines: 3, complexity: 2, functions: 2, classes: 0, imports: 2, exports: 0, issues: [] },
        { filePath: '/__tests__/helpers.test.ts', language: 'TypeScript', lines: 30, codeLines: 25, commentLines: 2, blankLines: 3, complexity: 2, functions: 2, classes: 0, imports: 1, exports: 0, issues: [] }
      ];

      const coverage = calculator.analyzeTestCoverage(files);

      expect(coverage.hasTests).toBe(true);
      expect(coverage.testFiles).toBe(3);
      expect(coverage.testToCodeRatio).toBeGreaterThan(0);
    });

    it('should handle project with no tests', () => {
      const files: FileMetrics[] = [
        { filePath: '/src/app.ts', language: 'TypeScript', lines: 100, codeLines: 80, commentLines: 10, blankLines: 10, complexity: 5, functions: 5, classes: 2, imports: 3, exports: 2, issues: [] },
        { filePath: '/src/utils.ts', language: 'TypeScript', lines: 50, codeLines: 45, commentLines: 2, blankLines: 3, complexity: 3, functions: 3, classes: 0, imports: 2, exports: 1, issues: [] }
      ];

      const coverage = calculator.analyzeTestCoverage(files);

      expect(coverage.hasTests).toBe(false);
      expect(coverage.testFiles).toBe(0);
      expect(coverage.estimatedCoverage).toBe(0);
    });

    it('should calculate test ratio accurately', () => {
      const files: FileMetrics[] = [
        { filePath: '/src/app.ts', language: 'TypeScript', lines: 100, codeLines: 100, commentLines: 0, blankLines: 0, complexity: 5, functions: 5, classes: 2, imports: 3, exports: 2, issues: [] },
        { filePath: '/test/app.test.ts', language: 'TypeScript', lines: 50, codeLines: 50, commentLines: 0, blankLines: 0, complexity: 3, functions: 3, classes: 0, imports: 2, exports: 0, issues: [] }
      ];

      const coverage = calculator.analyzeTestCoverage(files);

      expect(coverage.testToCodeRatio).toBe(0.5); // 50/100
    });
  });

  describe('calculateGrade edge cases', () => {
    it('should assign A+ for perfect score', () => {
      const grade = calculator.calculateGrade(100);
      expect(grade).toBe('A+');
    });

    it('should assign F for very low score', () => {
      const grade = calculator.calculateGrade(45);
      expect(grade).toBe('F');
    });

    it('should handle boundary scores', () => {
      expect(calculator.calculateGrade(90)).toMatch(/A/);
      expect(calculator.calculateGrade(80)).toMatch(/B/);
      expect(calculator.calculateGrade(70)).toMatch(/C/);
      expect(calculator.calculateGrade(60)).toMatch(/D/);
      expect(calculator.calculateGrade(50)).toBe('F');
    });

    it('should assign plus/minus modifiers', () => {
      expect(calculator.calculateGrade(93)).toBe('A');
      expect(calculator.calculateGrade(87)).toBe('B+');
      expect(calculator.calculateGrade(83)).toBe('B');
      expect(calculator.calculateGrade(77)).toBe('C+');
    });

    it('should handle zero score', () => {
      const grade = calculator.calculateGrade(0);
      expect(grade).toBe('F');
    });

    it('should handle negative score', () => {
      const grade = calculator.calculateGrade(-10);
      expect(grade).toBe('F');
    });

    it('should handle score over 100', () => {
      const grade = calculator.calculateGrade(110);
      expect(grade).toBe('A+');
    });
  });

  describe('Integration - complex scenarios', () => {
    it('should handle realistic large project', () => {
      const files: FileMetrics[] = [];
      
      // Generate 50 source files
      for (let i = 0; i < 50; i++) {
        files.push({
          filePath: `/src/module${i}.ts`,
          language: 'TypeScript',
          lines: 100 + Math.floor(Math.random() * 200),
          codeLines: 80 + Math.floor(Math.random() * 150),
          commentLines: 5 + Math.floor(Math.random() * 20),
          blankLines: 10 + Math.floor(Math.random() * 30),
          complexity: 5 + Math.floor(Math.random() * 15),
          functions: 3 + Math.floor(Math.random() * 10),
          classes: Math.floor(Math.random() * 3),
          imports: 2 + Math.floor(Math.random() * 8),
          exports: 1 + Math.floor(Math.random() * 5),
          issues: Math.random() > 0.7 ? ['Some issue'] : []
        });
      }

      // Generate 25 test files
      for (let i = 0; i < 25; i++) {
        files.push({
          filePath: `/test/module${i}.test.ts`,
          language: 'TypeScript',
          lines: 50 + Math.floor(Math.random() * 100),
          codeLines: 40 + Math.floor(Math.random() * 80),
          commentLines: 2 + Math.floor(Math.random() * 10),
          blankLines: 5 + Math.floor(Math.random() * 15),
          complexity: 2 + Math.floor(Math.random() * 5),
          functions: 2 + Math.floor(Math.random() * 5),
          classes: 0,
          imports: 2 + Math.floor(Math.random() * 5),
          exports: 0,
          issues: []
        });
      }

      const projectMetrics = calculator.calculateProjectMetrics(files);
      const complexityMetrics = calculator.calculateComplexityMetrics(files);
      const maintainability = calculator.calculateMaintainability(files);
      const testCoverage = calculator.analyzeTestCoverage(files);

      expect(projectMetrics.totalFiles).toBe(75);
      expect(complexityMetrics.averageComplexity).toBeGreaterThan(0);
      expect(maintainability.score).toBeGreaterThanOrEqual(0);
      expect(maintainability.score).toBeLessThanOrEqual(100);
      expect(testCoverage.hasTests).toBe(true);
      expect(testCoverage.testFiles).toBe(25);
    });
  });
});
