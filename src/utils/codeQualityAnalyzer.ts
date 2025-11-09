/**
 * Main Code Quality Analyzer
 * Coordinates file analysis and metrics calculation
 */

import { CodeQualityMetrics } from './qualityMetricsTypes';
import { FileAnalyzer } from './fileAnalyzer';
import { MetricsCalculator } from './metricsCalculator';

export * from './qualityMetricsTypes';

export class CodeQualityAnalyzer {
  private projectRoot: string;
  private fileAnalyzer: FileAnalyzer;
  private metricsCalculator: MetricsCalculator;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.fileAnalyzer = new FileAnalyzer(projectRoot);
    this.metricsCalculator = new MetricsCalculator(projectRoot);
  }

  async analyze(): Promise<CodeQualityMetrics> {
    const files = this.fileAnalyzer.getAllSourceFiles();
    const fileMetrics = this.fileAnalyzer.analyzeFiles(files);
    const projectMetrics = this.metricsCalculator.calculateProjectMetrics(fileMetrics);
    const complexityMetrics = this.metricsCalculator.calculateComplexityMetrics(fileMetrics);
    const maintainabilityMetrics = this.metricsCalculator.calculateMaintainability(fileMetrics);
    const testCoverage = this.metricsCalculator.analyzeTestCoverage(fileMetrics);
    const dependencies = this.metricsCalculator.analyzeDependencies();
    const bestPractices = this.metricsCalculator.checkBestPractices();

    const overallScore = this.metricsCalculator.calculateOverallScore({
      complexity: complexityMetrics,
      maintainability: maintainabilityMetrics,
      testCoverage,
      dependencies,
      bestPractices
    });

    const grade = this.metricsCalculator.calculateGrade(overallScore);

    return {
      project: projectMetrics,
      files: fileMetrics,
      codeComplexity: complexityMetrics,
      maintainability: maintainabilityMetrics,
      testCoverage,
      dependencies,
      bestPractices,
      overallScore,
      grade
    };
  }
}
