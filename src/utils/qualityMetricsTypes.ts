/**
 * Type definitions for code quality metrics
 */

export interface CodeQualityMetrics {
  project: ProjectMetrics;
  files: FileMetrics[];
  codeComplexity: ComplexityMetrics;
  maintainability: MaintainabilityMetrics;
  testCoverage: TestCoverageMetrics;
  dependencies: DependencyMetrics;
  bestPractices: BestPracticesMetrics;
  overallScore: number;
  grade: string;
}

export interface ProjectMetrics {
  name: string;
  totalFiles: number;
  totalLines: number;
  totalCodeLines: number;
  totalCommentLines: number;
  totalBlankLines: number;
  languages: Record<string, number>;
}

export interface FileMetrics {
  filePath: string;
  language: string;
  lines: number;
  codeLines: number;
  commentLines: number;
  complexity: number;
  functions: number;
  classes: number;
  issues: string[];
}

export interface ComplexityMetrics {
  averageComplexity: number;
  maxComplexity: number;
  filesOverThreshold: number;
  complexFiles: Array<{ file: string; complexity: number }>;
}

export interface MaintainabilityMetrics {
  score: number;
  codeSmells: string[];
  duplicateCode: number;
  longFunctions: number;
  deepNesting: number;
}

export interface TestCoverageMetrics {
  hasTests: boolean;
  testFiles: number;
  testToCodeRatio: number;
  estimatedCoverage: number;
}

export interface DependencyMetrics {
  total: number;
  production: number;
  development: number;
  outdated: number;
  security: string[];
}

export interface BestPracticesMetrics {
  hasReadme: boolean;
  hasLicense: boolean;
  hasGitignore: boolean;
  hasTypeScript: boolean;
  hasLinting: boolean;
  hasTesting: boolean;
  hasCI: boolean;
  hasDocs: boolean;
}
