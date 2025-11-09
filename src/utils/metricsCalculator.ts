/**
 * Metrics calculation utilities
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  FileMetrics,
  ProjectMetrics,
  ComplexityMetrics,
  MaintainabilityMetrics,
  TestCoverageMetrics,
  DependencyMetrics,
  BestPracticesMetrics
} from './qualityMetricsTypes';

export class MetricsCalculator {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  calculateProjectMetrics(fileMetrics: FileMetrics[]): ProjectMetrics {
    const languages: Record<string, number> = {};
    let totalLines = 0;
    let totalCodeLines = 0;
    let totalCommentLines = 0;

    for (const file of fileMetrics) {
      languages[file.language] = (languages[file.language] || 0) + 1;
      totalLines += file.lines;
      totalCodeLines += file.codeLines;
      totalCommentLines += file.commentLines;
    }

    const totalBlankLines = totalLines - totalCodeLines - totalCommentLines;
    const projectName = this.getProjectName();

    return {
      name: projectName,
      totalFiles: fileMetrics.length,
      totalLines,
      totalCodeLines,
      totalCommentLines,
      totalBlankLines,
      languages
    };
  }

  calculateComplexityMetrics(fileMetrics: FileMetrics[]): ComplexityMetrics {
    const complexities = fileMetrics.map(f => f.complexity);
    const avgComplexity = complexities.reduce((a, b) => a + b, 0) / complexities.length;
    const maxComplexity = Math.max(...complexities);
    const threshold = 15;
    const filesOverThreshold = fileMetrics.filter(f => f.complexity > threshold).length;
    
    const complexFiles = fileMetrics
      .filter(f => f.complexity > threshold)
      .sort((a, b) => b.complexity - a.complexity)
      .slice(0, 5)
      .map(f => ({ file: f.filePath, complexity: f.complexity }));

    return {
      averageComplexity: Math.round(avgComplexity * 10) / 10,
      maxComplexity,
      filesOverThreshold,
      complexFiles
    };
  }

  calculateMaintainability(fileMetrics: FileMetrics[]): MaintainabilityMetrics {
    const allIssues = fileMetrics.flatMap(f => f.issues);
    const uniqueSmells = [...new Set(allIssues)];

    // Calculate maintainability score (0-100)
    const avgComplexity = fileMetrics.reduce((a, b) => a + b.complexity, 0) / fileMetrics.length;
    const avgFileSize = fileMetrics.reduce((a, b) => a + b.codeLines, 0) / fileMetrics.length;
    
    let score = 100;
    score -= Math.min(avgComplexity * 2, 30);
    score -= Math.min(avgFileSize / 10, 20);
    score -= Math.min(uniqueSmells.length * 5, 30);

    return {
      score: Math.max(0, Math.round(score)),
      codeSmells: uniqueSmells,
      duplicateCode: 0,
      longFunctions: 0,
      deepNesting: 0
    };
  }

  analyzeTestCoverage(fileMetrics: FileMetrics[]): TestCoverageMetrics {
    const testFiles = fileMetrics.filter(f => 
      f.filePath.includes('test') || f.filePath.includes('spec')
    ).length;

    const sourceFiles = fileMetrics.filter(f => 
      !f.filePath.includes('test') && !f.filePath.includes('spec')
    ).length;

    const testToCodeRatio = sourceFiles > 0 ? testFiles / sourceFiles : 0;
    const estimatedCoverage = Math.min(testToCodeRatio * 100, 100);

    return {
      hasTests: testFiles > 0,
      testFiles,
      testToCodeRatio: Math.round(testToCodeRatio * 100) / 100,
      estimatedCoverage: Math.round(estimatedCoverage)
    };
  }

  analyzeDependencies(): DependencyMetrics {
    const packageJson = path.join(this.projectRoot, 'package.json');
    
    if (!fs.existsSync(packageJson)) {
      return {
        total: 0,
        production: 0,
        development: 0,
        outdated: 0,
        security: []
      };
    }

    const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
    const prodDeps = Object.keys(pkg.dependencies || {}).length;
    const devDeps = Object.keys(pkg.devDependencies || {}).length;

    return {
      total: prodDeps + devDeps,
      production: prodDeps,
      development: devDeps,
      outdated: 0,
      security: []
    };
  }

  checkBestPractices(): BestPracticesMetrics {
    const hasReadme = fs.existsSync(path.join(this.projectRoot, 'README.md'));
    const hasLicense = fs.existsSync(path.join(this.projectRoot, 'LICENSE'));
    const hasGitignore = fs.existsSync(path.join(this.projectRoot, '.gitignore'));
    const hasTypeScript = fs.existsSync(path.join(this.projectRoot, 'tsconfig.json'));
    const hasLinting = fs.existsSync(path.join(this.projectRoot, '.eslintrc.json')) ||
                       fs.existsSync(path.join(this.projectRoot, '.eslintrc.js'));
    const hasTesting = fs.existsSync(path.join(this.projectRoot, 'jest.config.js'));
    const hasCI = fs.existsSync(path.join(this.projectRoot, '.github/workflows'));
    const hasDocs = fs.existsSync(path.join(this.projectRoot, 'docs'));

    return {
      hasReadme,
      hasLicense,
      hasGitignore,
      hasTypeScript,
      hasLinting,
      hasTesting,
      hasCI,
      hasDocs
    };
  }

  calculateOverallScore(metrics: {
    complexity: ComplexityMetrics;
    maintainability: MaintainabilityMetrics;
    testCoverage: TestCoverageMetrics;
    dependencies: DependencyMetrics;
    bestPractices: BestPracticesMetrics;
  }): number {
    let score = 0;

    // Complexity score (25 points)
    const complexityScore = Math.max(0, 25 - metrics.complexity.averageComplexity);
    score += complexityScore;

    // Maintainability score (25 points)
    score += (metrics.maintainability.score / 100) * 25;

    // Test coverage score (20 points)
    score += (metrics.testCoverage.estimatedCoverage / 100) * 20;

    // Best practices score (30 points)
    score += this.calculateBestPracticesScore(metrics.bestPractices);

    return Math.round(score);
  }

  private calculateBestPracticesScore(practices: BestPracticesMetrics): number {
    const weights = [
      { check: practices.hasReadme, points: 5 },
      { check: practices.hasLicense, points: 3 },
      { check: practices.hasGitignore, points: 3 },
      { check: practices.hasTypeScript, points: 6 },
      { check: practices.hasLinting, points: 5 },
      { check: practices.hasTesting, points: 5 },
      { check: practices.hasCI, points: 3 }
    ];
    
    return weights.reduce((total, item) => total + (item.check ? item.points : 0), 0);
  }

  calculateGrade(score: number): string {
    const grades = [
      { min: 90, grade: 'A+' },
      { min: 85, grade: 'A' },
      { min: 80, grade: 'A-' },
      { min: 75, grade: 'B+' },
      { min: 70, grade: 'B' },
      { min: 65, grade: 'B-' },
      { min: 60, grade: 'C+' },
      { min: 55, grade: 'C' },
      { min: 50, grade: 'C-' },
      { min: 45, grade: 'D' }
    ];

    const match = grades.find(g => score >= g.min);
    return match ? match.grade : 'F';
  }

  private getProjectName(): string {
    const packageJson = path.join(this.projectRoot, 'package.json');
    if (fs.existsSync(packageJson)) {
      const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
      return pkg.name || 'Unknown';
    }
    return 'Unknown';
  }
}
