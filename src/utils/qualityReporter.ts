/**
 * Code Quality Report Formatters
 * Generate text and HTML reports from quality metrics
 */

import { CodeQualityMetrics } from './qualityMetricsTypes';

// Helper functions to determine status icons and classes
function getComplexityIcon(value: number, threshold: number): string {
  return value > threshold ? '🔴' : '✅';
}

function getScoreIcon(score: number): string {
  if (score < 50) return '🔴';
  if (score < 70) return '⚠️';
  return '✅';
}

function getBooleanIcon(value: boolean): string {
  return value ? '✅' : '🔴';
}

export function generateCodeQualityReport(metrics: CodeQualityMetrics): string {
  const lines: string[] = [];
  
  lines.push('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('         CODE QUALITY REPORT         ');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Overall Score
  lines.push(`Overall Score: ${metrics.overallScore}/100 (Grade: ${metrics.grade})\n`);

  // Project Overview
  lines.push('📊 Project Overview:');
  lines.push(`  • Total Files: ${metrics.project.totalFiles}`);
  lines.push(`  • Total Lines: ${metrics.project.totalLines.toLocaleString()}`);
  lines.push(`  • Code Lines: ${metrics.project.totalCodeLines.toLocaleString()}`);
  lines.push(`  • Comment Lines: ${metrics.project.totalCommentLines.toLocaleString()}\n`);

  // Complexity
  const complexityIcon = getComplexityIcon(metrics.codeComplexity.averageComplexity, 15);
  const maxComplexityIcon = getComplexityIcon(metrics.codeComplexity.maxComplexity, 30);
  lines.push('🔧 Code Complexity:');
  lines.push(`  • Average: ${metrics.codeComplexity.averageComplexity} ${complexityIcon}`);
  lines.push(`  • Maximum: ${metrics.codeComplexity.maxComplexity} ${maxComplexityIcon}`);
  lines.push(`  • Files Over Threshold: ${metrics.codeComplexity.filesOverThreshold}\n`);

  // Maintainability
  const maintIcon = getScoreIcon(metrics.maintainability.score);
  lines.push('🔨 Maintainability:');
  lines.push(`  • Score: ${metrics.maintainability.score}/100 ${maintIcon}\n`);

  // Test Coverage
  const testIcon = getScoreIcon(metrics.testCoverage.estimatedCoverage);
  lines.push('🧪 Test Coverage:');
  lines.push(`  • Has Tests: ${metrics.testCoverage.hasTests ? 'Yes ✅' : 'No 🔴'}`);
  lines.push(`  • Test Files: ${metrics.testCoverage.testFiles}`);
  lines.push(`  • Estimated Coverage: ${metrics.testCoverage.estimatedCoverage}% ${testIcon}\n`);

  // Dependencies
  lines.push('📦 Dependencies:');
  lines.push(`  • Total: ${metrics.dependencies.total}`);
  lines.push(`  • Production: ${metrics.dependencies.production}`);
  lines.push(`  • Development: ${metrics.dependencies.development}\n`);

  // Best Practices
  const bestPracticeTotal = Object.values(metrics.bestPractices).filter(v => typeof v === 'boolean').length;
  const practiceCount = Object.values(metrics.bestPractices).filter(Boolean).length;
  lines.push('✨ Best Practices:');
  lines.push(`  • Score: ${practiceCount}/${bestPracticeTotal}`);
  lines.push(`  • README: ${getBooleanIcon(metrics.bestPractices.hasReadme)}`);
  lines.push(`  • License: ${getBooleanIcon(metrics.bestPractices.hasLicense)}`);
  lines.push(`  • TypeScript: ${getBooleanIcon(metrics.bestPractices.hasTypeScript)}`);
  lines.push(`  • Linting: ${getBooleanIcon(metrics.bestPractices.hasLinting)}`);
  lines.push(`  • Testing: ${getBooleanIcon(metrics.bestPractices.hasTesting)}`);
  lines.push(`  • CI/CD: ${getBooleanIcon(metrics.bestPractices.hasCI)}`);
  lines.push(`  • Documentation: ${getBooleanIcon(metrics.bestPractices.hasDocs)}\n`);

  // Code Smells
  if (metrics.maintainability.codeSmells.length > 0) {
    lines.push('⚠️  Code Smells Detected:');
    metrics.maintainability.codeSmells.forEach(smell => {
      lines.push(`  • ${smell}`);
    });
    lines.push('');
  }

  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  return lines.join('\n');
}

// HTML generation helpers
function getStatusClass(value: number, goodThreshold: number, warnThreshold: number): string {
  if (value >= goodThreshold) return 'status-good';
  if (value >= warnThreshold) return 'status-warn';
  return 'status-bad';
}

function getComplexityStatusClass(value: number, threshold: number): string {
  return value > threshold ? 'status-bad' : 'status-good';
}

function getBooleanStatusClass(value: boolean): string {
  return value ? 'status-good' : 'status-bad';
}

function getGradeColor(score: number): string {
  if (score >= 70) return '#4caf50';
  if (score >= 50) return '#ff9800';
  return '#f44336';
}

function generateHTMLStyles(gradeColor: string): string {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      min-height: 100vh;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    .score-badge {
      display: inline-block;
      background: ${gradeColor};
      color: white;
      font-size: 48px;
      font-weight: bold;
      padding: 20px 40px;
      border-radius: 50px;
      margin: 20px 0;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    }
    .content { padding: 40px; }
    .metric-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .metric-card {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
      border-left: 4px solid #667eea;
    }
    .metric-card h3 {
      color: #333;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .metric-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e0e0e0;
    }
    .metric-row:last-child { border-bottom: none; }
    .metric-label { color: #666; }
    .metric-value { 
      font-weight: 600;
      color: #333;
    }
    .status-good { color: #4caf50; }
    .status-warn { color: #ff9800; }
    .status-bad { color: #f44336; }
    .smells-list {
      background: #fff3cd;
      border-left: 4px solid #ff9800;
      padding: 20px;
      border-radius: 8px;
      margin-top: 20px;
    }
    .smells-list h3 { margin-bottom: 15px; color: #856404; }
    .smells-list ul { margin-left: 20px; }
    .smells-list li { margin: 8px 0; color: #856404; }
    .footer {
      text-align: center;
      padding: 20px;
      color: #666;
      font-size: 14px;
    }`;
}

function generateProjectOverviewCard(project: CodeQualityMetrics['project']): string {
  return `
        <div class="metric-card">
          <h3>📊 Project Overview</h3>
          <div class="metric-row">
            <span class="metric-label">Total Files</span>
            <span class="metric-value">${project.totalFiles}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Total Lines</span>
            <span class="metric-value">${project.totalLines.toLocaleString()}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Code Lines</span>
            <span class="metric-value">${project.totalCodeLines.toLocaleString()}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Comment Lines</span>
            <span class="metric-value">${project.totalCommentLines.toLocaleString()}</span>
          </div>
        </div>`;
}

function generateComplexityCard(complexity: CodeQualityMetrics['codeComplexity']): string {
  const avgClass = getComplexityStatusClass(complexity.averageComplexity, 15);
  const maxClass = getComplexityStatusClass(complexity.maxComplexity, 30);
  const thresholdClass = complexity.filesOverThreshold > 0 ? 'status-warn' : 'status-good';
  
  return `
        <div class="metric-card">
          <h3>🔧 Code Complexity</h3>
          <div class="metric-row">
            <span class="metric-label">Average</span>
            <span class="metric-value ${avgClass}">
              ${complexity.averageComplexity}
            </span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Maximum</span>
            <span class="metric-value ${maxClass}">
              ${complexity.maxComplexity}
            </span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Files Over Threshold</span>
            <span class="metric-value ${thresholdClass}">
              ${complexity.filesOverThreshold}
            </span>
          </div>
        </div>`;
}

function generateMaintainabilityCard(maintainability: CodeQualityMetrics['maintainability']): string {
  const scoreClass = getStatusClass(maintainability.score, 70, 50);
  const smellsClass = maintainability.codeSmells.length > 0 ? 'status-warn' : 'status-good';
  
  return `
        <div class="metric-card">
          <h3>🔨 Maintainability</h3>
          <div class="metric-row">
            <span class="metric-label">Score</span>
            <span class="metric-value ${scoreClass}">
              ${maintainability.score}/100
            </span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Code Smells</span>
            <span class="metric-value ${smellsClass}">
              ${maintainability.codeSmells.length}
            </span>
          </div>
        </div>`;
}

function generateTestCoverageCard(testCoverage: CodeQualityMetrics['testCoverage']): string {
  const hasTestsClass = getBooleanStatusClass(testCoverage.hasTests);
  const coverageClass = getStatusClass(testCoverage.estimatedCoverage, 70, 50);
  
  return `
        <div class="metric-card">
          <h3>🧪 Test Coverage</h3>
          <div class="metric-row">
            <span class="metric-label">Has Tests</span>
            <span class="metric-value ${hasTestsClass}">
              ${testCoverage.hasTests ? 'Yes' : 'No'}
            </span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Test Files</span>
            <span class="metric-value">${testCoverage.testFiles}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Estimated Coverage</span>
            <span class="metric-value ${coverageClass}">
              ${testCoverage.estimatedCoverage}%
            </span>
          </div>
        </div>`;
}

function generateDependenciesCard(dependencies: CodeQualityMetrics['dependencies']): string {
  return `
        <div class="metric-card">
          <h3>📦 Dependencies</h3>
          <div class="metric-row">
            <span class="metric-label">Total</span>
            <span class="metric-value">${dependencies.total}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Production</span>
            <span class="metric-value">${dependencies.production}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Development</span>
            <span class="metric-value">${dependencies.development}</span>
          </div>
        </div>`;
}
function generateBestPracticesCard(bestPractices: CodeQualityMetrics['bestPractices']): string {
  return `
        <div class="metric-card">
          <h3>✨ Best Practices</h3>
          <div class="metric-row">
            <span class="metric-label">README</span>
            <span class="metric-value ${getBooleanStatusClass(bestPractices.hasReadme)}">
              ${bestPractices.hasReadme ? '✅' : '❌'}
            </span>
          </div>
          <div class="metric-row">
            <span class="metric-label">License</span>
            <span class="metric-value ${getBooleanStatusClass(bestPractices.hasLicense)}">
              ${bestPractices.hasLicense ? '✅' : '❌'}
            </span>
          </div>
          <div class="metric-row">
            <span class="metric-label">TypeScript</span>
            <span class="metric-value ${getBooleanStatusClass(bestPractices.hasTypeScript)}">
              ${bestPractices.hasTypeScript ? '✅' : '❌'}
            </span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Linting</span>
            <span class="metric-value ${getBooleanStatusClass(bestPractices.hasLinting)}">
              ${bestPractices.hasLinting ? '✅' : '❌'}
            </span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Testing</span>
            <span class="metric-value ${getBooleanStatusClass(bestPractices.hasTesting)}">
              ${bestPractices.hasTesting ? '✅' : '❌'}
            </span>
          </div>
          <div class="metric-row">
            <span class="metric-label">CI/CD</span>
            <span class="metric-value ${getBooleanStatusClass(bestPractices.hasCI)}">
              ${bestPractices.hasCI ? '✅' : '❌'}
            </span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Documentation</span>
            <span class="metric-value ${getBooleanStatusClass(bestPractices.hasDocs)}">
              ${bestPractices.hasDocs ? '✅' : '❌'}
            </span>
          </div>
        </div>`;
}

function generateCodeSmellsSection(codeSmells: string[]): string {
  if (codeSmells.length === 0) return '';
  
  const smellItems = codeSmells.map(smell => `<li>${smell}</li>`).join('\n          ');
  
  return `
      <div class="smells-list">
        <h3>⚠️ Code Smells Detected</h3>
        <ul>
          ${smellItems}
        </ul>
      </div>`;
}

export function generateCodeQualityHTML(metrics: CodeQualityMetrics): string {
  const gradeColor = getGradeColor(metrics.overallScore);
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Code Quality Report</title>
  <style>${generateHTMLStyles(gradeColor)}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Code Quality Report</h1>
      <div class="score-badge">${metrics.overallScore}/100</div>
      <h2>Grade: ${metrics.grade}</h2>
    </div>
    
    <div class="content">
      <div class="metric-grid">${generateProjectOverviewCard(metrics.project)}${generateComplexityCard(metrics.codeComplexity)}${generateMaintainabilityCard(metrics.maintainability)}${generateTestCoverageCard(metrics.testCoverage)}${generateDependenciesCard(metrics.dependencies)}${generateBestPracticesCard(metrics.bestPractices)}
      </div>${generateCodeSmellsSection(metrics.maintainability.codeSmells)}
    </div>

    <div class="footer">
      Generated on ${new Date().toLocaleString()}
    </div>
  </div>
</body>
</html>`;
}
