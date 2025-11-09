import * as fs from 'fs';
import * as path from 'path';

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

export class CodeQualityAnalyzer {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  async analyze(): Promise<CodeQualityMetrics> {
    const files = this.getAllSourceFiles();
    const fileMetrics = this.analyzeFiles(files);
    const projectMetrics = this.calculateProjectMetrics(fileMetrics);
    const complexityMetrics = this.calculateComplexityMetrics(fileMetrics);
    const maintainabilityMetrics = this.calculateMaintainability(fileMetrics);
    const testCoverage = this.analyzeTestCoverage(fileMetrics);
    const dependencies = this.analyzeDependencies();
    const bestPractices = this.checkBestPractices();

    const overallScore = this.calculateOverallScore({
      complexity: complexityMetrics,
      maintainability: maintainabilityMetrics,
      testCoverage,
      dependencies,
      bestPractices
    });

    const grade = this.calculateGrade(overallScore);

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

  private getAllSourceFiles(): string[] {
    const files: string[] = [];
    const excludeDirs = ['node_modules', 'dist', '.git', '.scan-cache', 'coverage'];

    const walk = (dir: string) => {
      if (!fs.existsSync(dir)) return;
      
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          if (!excludeDirs.includes(entry.name)) {
            walk(fullPath);
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (['.ts', '.tsx', '.js', '.jsx', '.html', '.css'].includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    };

    walk(this.projectRoot);
    return files;
  }

  private analyzeFiles(filePaths: string[]): FileMetrics[] {
    return filePaths.map(filePath => this.analyzeFile(filePath));
  }

  private analyzeFile(filePath: string): FileMetrics {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const ext = path.extname(filePath);
    
    let codeLines = 0;
    let commentLines = 0;
    let blankLines = 0;
    let functions = 0;
    let classes = 0;
    const issues: string[] = [];

    // Count line types
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        blankLines++;
      } else if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
        commentLines++;
      } else {
        codeLines++;
      }
    }

    // Count functions and classes
    const functionRegex = /function\s+\w+|const\s+\w+\s*=\s*\(.*?\)\s*=>|async\s+\w+\s*\(/g;
    const classRegex = /class\s+\w+/g;
    
    functions = (content.match(functionRegex) || []).length;
    classes = (content.match(classRegex) || []).length;

    // Calculate basic complexity (cyclomatic complexity approximation)
    const complexityKeywords = /\bif\b|\belse\b|\bfor\b|\bwhile\b|\bcase\b|\bcatch\b|\b\&\&\b|\b\|\|\b/g;
    const complexity = (content.match(complexityKeywords) || []).length + 1;

    // Check for common issues
    if (codeLines > 500) {
      issues.push('File is too large (>500 lines)');
    }
    if (complexity > 20) {
      issues.push(`High complexity (${complexity})`);
    }
    if (functions > 30) {
      issues.push('Too many functions in one file');
    }
    if (content.includes('any')) {
      issues.push('Uses "any" type');
    }
    if (content.includes('console.log') && !filePath.includes('test')) {
      issues.push('Contains console.log statements');
    }

    return {
      filePath: path.relative(this.projectRoot, filePath),
      language: this.getLanguage(ext),
      lines: lines.length,
      codeLines,
      commentLines,
      complexity,
      functions,
      classes,
      issues
    };
  }

  private getLanguage(ext: string): string {
    const langMap: Record<string, string> = {
      '.ts': 'TypeScript',
      '.tsx': 'TypeScript JSX',
      '.js': 'JavaScript',
      '.jsx': 'JavaScript JSX',
      '.html': 'HTML',
      '.css': 'CSS'
    };
    return langMap[ext] || 'Unknown';
  }

  private calculateProjectMetrics(fileMetrics: FileMetrics[]): ProjectMetrics {
    const languages: Record<string, number> = {};
    let totalLines = 0;
    let totalCodeLines = 0;
    let totalCommentLines = 0;
    let totalBlankLines = 0;

    for (const file of fileMetrics) {
      languages[file.language] = (languages[file.language] || 0) + 1;
      totalLines += file.lines;
      totalCodeLines += file.codeLines;
      totalCommentLines += file.commentLines;
      totalBlankLines = totalLines - totalCodeLines - totalCommentLines;
    }

    const packageJson = path.join(this.projectRoot, 'package.json');
    let projectName = 'Unknown';
    if (fs.existsSync(packageJson)) {
      const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
      projectName = pkg.name || 'Unknown';
    }

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

  private calculateComplexityMetrics(fileMetrics: FileMetrics[]): ComplexityMetrics {
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

  private calculateMaintainability(fileMetrics: FileMetrics[]): MaintainabilityMetrics {
    const codeSmells: string[] = [];
    let longFunctions = 0;
    let deepNesting = 0;

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
      duplicateCode: 0, // Simplified
      longFunctions,
      deepNesting
    };
  }

  private analyzeTestCoverage(fileMetrics: FileMetrics[]): TestCoverageMetrics {
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

  private analyzeDependencies(): DependencyMetrics {
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
      outdated: 0, // Would need npm outdated check
      security: [] // Would need npm audit
    };
  }

  private checkBestPractices(): BestPracticesMetrics {
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

  private calculateOverallScore(metrics: {
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
    const practices = metrics.bestPractices;
    let practiceScore = 0;
    if (practices.hasReadme) practiceScore += 5;
    if (practices.hasLicense) practiceScore += 3;
    if (practices.hasGitignore) practiceScore += 3;
    if (practices.hasTypeScript) practiceScore += 6;
    if (practices.hasLinting) practiceScore += 5;
    if (practices.hasTesting) practiceScore += 5;
    if (practices.hasCI) practiceScore += 3;
    score += practiceScore;

    return Math.round(score);
  }

  private calculateGrade(score: number): string {
    if (score >= 90) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 80) return 'A-';
    if (score >= 75) return 'B+';
    if (score >= 70) return 'B';
    if (score >= 65) return 'B-';
    if (score >= 60) return 'C+';
    if (score >= 55) return 'C';
    if (score >= 50) return 'C-';
    if (score >= 45) return 'D';
    return 'F';
  }
}

export function generateCodeQualityReport(metrics: CodeQualityMetrics): string {
  let report = '\n';
  report += '╔══════════════════════════════════════════════════════════════╗\n';
  report += '║            📊 CODE QUALITY ANALYSIS REPORT                   ║\n';
  report += '╚══════════════════════════════════════════════════════════════╝\n\n';

  // Overall Score
  report += `🎯 OVERALL QUALITY SCORE: ${metrics.overallScore}/100 (Grade: ${metrics.grade})\n`;
  report += getScoreBar(metrics.overallScore) + '\n\n';

  // Project Overview
  report += '📁 PROJECT OVERVIEW:\n';
  report += `   Name:              ${metrics.project.name}\n`;
  report += `   Total Files:       ${metrics.project.totalFiles}\n`;
  report += `   Total Lines:       ${metrics.project.totalLines.toLocaleString()}\n`;
  report += `   Code Lines:        ${metrics.project.totalCodeLines.toLocaleString()}\n`;
  report += `   Comment Lines:     ${metrics.project.totalCommentLines} (${Math.round((metrics.project.totalCommentLines/metrics.project.totalLines)*100)}%)\n`;
  report += `   Languages:         ${Object.entries(metrics.project.languages).map(([lang, count]) => `${lang} (${count})`).join(', ')}\n\n`;

  // Code Complexity
  report += '🧩 CODE COMPLEXITY:\n';
  report += `   Average Complexity:     ${metrics.codeComplexity.averageComplexity} ${getComplexityEmoji(metrics.codeComplexity.averageComplexity)}\n`;
  report += `   Max Complexity:         ${metrics.codeComplexity.maxComplexity}\n`;
  report += `   Files Over Threshold:   ${metrics.codeComplexity.filesOverThreshold}\n`;
  if (metrics.codeComplexity.complexFiles.length > 0) {
    report += `   Most Complex Files:\n`;
    metrics.codeComplexity.complexFiles.forEach(f => {
      report += `      - ${f.file} (${f.complexity})\n`;
    });
  }
  report += '\n';

  // Maintainability
  report += '🔧 MAINTAINABILITY:\n';
  report += `   Maintainability Score:  ${metrics.maintainability.score}/100 ${getScoreEmoji(metrics.maintainability.score)}\n`;
  if (metrics.maintainability.codeSmells.length > 0) {
    report += `   Code Smells Found:\n`;
    metrics.maintainability.codeSmells.forEach(smell => {
      report += `      ⚠️  ${smell}\n`;
    });
  }
  report += '\n';

  // Test Coverage
  report += '🧪 TEST COVERAGE:\n';
  report += `   Has Tests:              ${metrics.testCoverage.hasTests ? '✅ Yes' : '❌ No'}\n`;
  report += `   Test Files:             ${metrics.testCoverage.testFiles}\n`;
  report += `   Test-to-Code Ratio:     ${metrics.testCoverage.testToCodeRatio}\n`;
  report += `   Estimated Coverage:     ${metrics.testCoverage.estimatedCoverage}% ${getCoverageEmoji(metrics.testCoverage.estimatedCoverage)}\n\n`;

  // Dependencies
  report += '📦 DEPENDENCIES:\n';
  report += `   Total Dependencies:     ${metrics.dependencies.total}\n`;
  report += `   Production:             ${metrics.dependencies.production}\n`;
  report += `   Development:            ${metrics.dependencies.development}\n\n`;

  // Best Practices
  report += '✨ BEST PRACTICES:\n';
  report += `   README:                 ${metrics.bestPractices.hasReadme ? '✅' : '❌'}\n`;
  report += `   License:                ${metrics.bestPractices.hasLicense ? '✅' : '❌'}\n`;
  report += `   .gitignore:             ${metrics.bestPractices.hasGitignore ? '✅' : '❌'}\n`;
  report += `   TypeScript:             ${metrics.bestPractices.hasTypeScript ? '✅' : '❌'}\n`;
  report += `   Linting:                ${metrics.bestPractices.hasLinting ? '✅' : '❌'}\n`;
  report += `   Testing Framework:      ${metrics.bestPractices.hasTesting ? '✅' : '❌'}\n`;
  report += `   CI/CD:                  ${metrics.bestPractices.hasCI ? '✅' : '❌'}\n`;
  report += `   Documentation:          ${metrics.bestPractices.hasDocs ? '✅' : '❌'}\n\n`;

  // Recommendations
  report += '💡 RECOMMENDATIONS:\n';
  const recommendations = generateRecommendations(metrics);
  recommendations.forEach((rec, i) => {
    report += `   ${i + 1}. ${rec}\n`;
  });

  report += '\n╚══════════════════════════════════════════════════════════════╝\n';

  return report;
}

function getScoreBar(score: number): string {
  const filled = Math.round(score / 5);
  const empty = 20 - filled;
  return '[' + '█'.repeat(filled) + '░'.repeat(empty) + ']';
}

function getComplexityEmoji(complexity: number): string {
  if (complexity < 10) return '✅';
  if (complexity < 15) return '⚠️';
  return '🔴';
}

function getScoreEmoji(score: number): string {
  if (score >= 80) return '✅';
  if (score >= 60) return '⚠️';
  return '🔴';
}

function getCoverageEmoji(coverage: number): string {
  if (coverage >= 80) return '✅';
  if (coverage >= 50) return '⚠️';
  return '🔴';
}

function generateRecommendations(metrics: CodeQualityMetrics): string[] {
  const recommendations: string[] = [];

  if (metrics.codeComplexity.averageComplexity > 15) {
    recommendations.push('Reduce code complexity by breaking down complex functions');
  }

  if (metrics.testCoverage.estimatedCoverage < 70) {
    recommendations.push('Increase test coverage to at least 70%');
  }

  if (!metrics.bestPractices.hasLinting) {
    recommendations.push('Add ESLint for code quality checks');
  }

  if (!metrics.bestPractices.hasCI) {
    recommendations.push('Set up CI/CD pipeline for automated testing');
  }

  if (!metrics.bestPractices.hasDocs) {
    recommendations.push('Add comprehensive documentation');
  }

  if (metrics.maintainability.score < 70) {
    recommendations.push('Refactor code to improve maintainability');
  }

  if (metrics.maintainability.codeSmells.length > 5) {
    recommendations.push('Address code smells to improve code quality');
  }

  if (recommendations.length === 0) {
    recommendations.push('Great job! Keep maintaining these high standards!');
  }

  return recommendations;
}

export function generateCodeQualityHTML(metrics: CodeQualityMetrics): string {
  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return '#4caf50';
    if (grade.startsWith('B')) return '#8bc34a';
    if (grade.startsWith('C')) return '#ff9800';
    if (grade.startsWith('D')) return '#ff5722';
    return '#f44336';
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Code Quality Report - ${metrics.project.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 20px;
      min-height: 100vh;
    }
    .container { max-width: 1400px; margin: 0 auto; }
    .header {
      background: white;
      padding: 50px;
      border-radius: 20px;
      margin-bottom: 30px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      text-align: center;
    }
    .grade-circle {
      width: 150px;
      height: 150px;
      border-radius: 50%;
      background: ${getGradeColor(metrics.grade)};
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 60px;
      font-weight: bold;
      margin: 0 auto 20px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.3);
    }
    .score {
      font-size: 24px;
      color: #666;
      margin-top: 10px;
    }
    h1 { font-size: 36px; color: #333; margin-bottom: 10px; }
    .section {
      background: white;
      padding: 30px;
      border-radius: 20px;
      margin-bottom: 30px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    }
    .section h2 {
      font-size: 24px;
      color: #333;
      margin-bottom: 20px;
      border-bottom: 3px solid #667eea;
      padding-bottom: 10px;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    .metric-box {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 12px;
      border-left: 4px solid #667eea;
    }
    .metric-label {
      font-size: 14px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }
    .metric-value {
      font-size: 32px;
      font-weight: bold;
      color: #333;
    }
    .progress-bar {
      width: 100%;
      height: 30px;
      background: #e0e0e0;
      border-radius: 15px;
      overflow: hidden;
      margin: 10px 0;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      transition: width 0.5s ease;
    }
    .file-list {
      max-height: 300px;
      overflow-y: auto;
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
    }
    .file-item {
      padding: 10px;
      border-bottom: 1px solid #e0e0e0;
      font-family: monospace;
      font-size: 13px;
    }
    .recommendations {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 20px;
      border-radius: 8px;
      margin-top: 20px;
    }
    .recommendations li {
      margin: 10px 0;
      padding-left: 10px;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
      margin: 0 5px;
    }
    .badge-success { background: #4caf50; color: white; }
    .badge-warning { background: #ff9800; color: white; }
    .badge-danger { background: #f44336; color: white; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e0e0e0;
    }
    th {
      background: #f8f9fa;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="grade-circle">${metrics.grade}</div>
      <h1>Code Quality Report</h1>
      <div class="score">${metrics.overallScore}/100 Points</div>
      <p style="color: #666; margin-top: 10px;">${metrics.project.name}</p>
      <p style="color: #999; font-size: 14px;">Generated on ${new Date().toLocaleString()}</p>
    </div>

    <div class="section">
      <h2>📊 Project Overview</h2>
      <div class="metrics-grid">
        <div class="metric-box">
          <div class="metric-label">Total Files</div>
          <div class="metric-value">${metrics.project.totalFiles}</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Lines of Code</div>
          <div class="metric-value">${metrics.project.totalCodeLines.toLocaleString()}</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Comment Lines</div>
          <div class="metric-value">${metrics.project.totalCommentLines}</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Languages</div>
          <div class="metric-value">${Object.keys(metrics.project.languages).length}</div>
        </div>
      </div>
      
      <h3 style="margin-top: 30px; margin-bottom: 15px;">Language Distribution</h3>
      ${Object.entries(metrics.project.languages).map(([lang, count]) => `
        <div style="margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>${lang}</span>
            <span>${count} files</span>
          </div>
          <div class="progress-bar" style="height: 20px;">
            <div class="progress-fill" style="width: ${(count/metrics.project.totalFiles)*100}%"></div>
          </div>
        </div>
      `).join('')}
    </div>

    <div class="section">
      <h2>🧩 Code Complexity</h2>
      <div class="metrics-grid">
        <div class="metric-box">
          <div class="metric-label">Average Complexity</div>
          <div class="metric-value">${metrics.codeComplexity.averageComplexity}</div>
          <span class="badge ${metrics.codeComplexity.averageComplexity < 10 ? 'badge-success' : metrics.codeComplexity.averageComplexity < 15 ? 'badge-warning' : 'badge-danger'}">
            ${metrics.codeComplexity.averageComplexity < 10 ? 'Excellent' : metrics.codeComplexity.averageComplexity < 15 ? 'Good' : 'Needs Work'}
          </span>
        </div>
        <div class="metric-box">
          <div class="metric-label">Max Complexity</div>
          <div class="metric-value">${metrics.codeComplexity.maxComplexity}</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Files Over Threshold</div>
          <div class="metric-value">${metrics.codeComplexity.filesOverThreshold}</div>
        </div>
      </div>

      ${metrics.codeComplexity.complexFiles.length > 0 ? `
      <h3 style="margin-top: 30px; margin-bottom: 15px;">Most Complex Files</h3>
      <table>
        <thead>
          <tr>
            <th>File</th>
            <th>Complexity</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${metrics.codeComplexity.complexFiles.map(f => `
            <tr>
              <td style="font-family: monospace; font-size: 12px;">${f.file}</td>
              <td><strong>${f.complexity}</strong></td>
              <td><span class="badge badge-warning">Review</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ` : ''}
    </div>

    <div class="section">
      <h2>🔧 Maintainability</h2>
      <div style="margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="font-size: 18px; font-weight: 600;">Maintainability Score</span>
          <span style="font-size: 24px; font-weight: bold; color: ${metrics.maintainability.score >= 80 ? '#4caf50' : metrics.maintainability.score >= 60 ? '#ff9800' : '#f44336'}">
            ${metrics.maintainability.score}/100
          </span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${metrics.maintainability.score}%; background: ${metrics.maintainability.score >= 80 ? '#4caf50' : metrics.maintainability.score >= 60 ? '#ff9800' : '#f44336'}">
            ${metrics.maintainability.score}%
          </div>
        </div>
      </div>

      ${metrics.maintainability.codeSmells.length > 0 ? `
      <h3 style="margin-top: 30px; margin-bottom: 15px;">⚠️ Code Smells Detected</h3>
      <ul style="list-style: none; padding: 0;">
        ${metrics.maintainability.codeSmells.map(smell => `
          <li style="padding: 10px; background: #fff3cd; border-left: 4px solid #ffc107; margin-bottom: 8px; border-radius: 4px;">
            ${smell}
          </li>
        `).join('')}
      </ul>
      ` : '<p style="color: #4caf50; padding: 15px; background: #e8f5e9; border-radius: 8px; margin-top: 15px;">✅ No code smells detected!</p>'}
    </div>

    <div class="section">
      <h2>🧪 Test Coverage</h2>
      <div class="metrics-grid">
        <div class="metric-box">
          <div class="metric-label">Test Files</div>
          <div class="metric-value">${metrics.testCoverage.testFiles}</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Test-to-Code Ratio</div>
          <div class="metric-value">${metrics.testCoverage.testToCodeRatio}</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Estimated Coverage</div>
          <div class="metric-value">${metrics.testCoverage.estimatedCoverage}%</div>
          <span class="badge ${metrics.testCoverage.estimatedCoverage >= 80 ? 'badge-success' : metrics.testCoverage.estimatedCoverage >= 50 ? 'badge-warning' : 'badge-danger'}">
            ${metrics.testCoverage.estimatedCoverage >= 80 ? 'Excellent' : metrics.testCoverage.estimatedCoverage >= 50 ? 'Good' : 'Low'}
          </span>
        </div>
      </div>
      <div style="margin-top: 20px;">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${metrics.testCoverage.estimatedCoverage}%; background: ${metrics.testCoverage.estimatedCoverage >= 80 ? '#4caf50' : '#ff9800'}">
            ${metrics.testCoverage.estimatedCoverage}%
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>📦 Dependencies</h2>
      <div class="metrics-grid">
        <div class="metric-box">
          <div class="metric-label">Total Dependencies</div>
          <div class="metric-value">${metrics.dependencies.total}</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Production</div>
          <div class="metric-value">${metrics.dependencies.production}</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Development</div>
          <div class="metric-value">${metrics.dependencies.development}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>✨ Best Practices</h2>
      <table>
        <thead>
          <tr>
            <th>Practice</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>README Documentation</td>
            <td>${metrics.bestPractices.hasReadme ? '✅ Yes' : '❌ No'}</td>
          </tr>
          <tr>
            <td>License File</td>
            <td>${metrics.bestPractices.hasLicense ? '✅ Yes' : '❌ No'}</td>
          </tr>
          <tr>
            <td>.gitignore</td>
            <td>${metrics.bestPractices.hasGitignore ? '✅ Yes' : '❌ No'}</td>
          </tr>
          <tr>
            <td>TypeScript</td>
            <td>${metrics.bestPractices.hasTypeScript ? '✅ Yes' : '❌ No'}</td>
          </tr>
          <tr>
            <td>Code Linting</td>
            <td>${metrics.bestPractices.hasLinting ? '✅ Yes' : '❌ No'}</td>
          </tr>
          <tr>
            <td>Testing Framework</td>
            <td>${metrics.bestPractices.hasTesting ? '✅ Yes' : '❌ No'}</td>
          </tr>
          <tr>
            <td>CI/CD Pipeline</td>
            <td>${metrics.bestPractices.hasCI ? '✅ Yes' : '❌ No'}</td>
          </tr>
          <tr>
            <td>Documentation</td>
            <td>${metrics.bestPractices.hasDocs ? '✅ Yes' : '❌ No'}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="section">
      <h2>💡 Recommendations</h2>
      <div class="recommendations">
        <ul>
          ${generateRecommendations(metrics).map(rec => `<li>📌 ${rec}</li>`).join('')}
        </ul>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}
