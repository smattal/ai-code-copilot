import { ConsolidatedResult } from '../scanner';

export interface ComparisonMetrics {
  before: ScanMetrics;
  after: ScanMetrics;
  improvements: ImprovementMetrics;
}

export interface ScanMetrics {
  totalFiles: number;
  totalIssues: number;
  highSeverity: number;
  mediumSeverity: number;
  lowSeverity: number;
  issuesByCategory: Record<string, number>;
  filesWithIssues: number;
}

export interface ImprovementMetrics {
  totalIssuesReduced: number;
  totalIssuesReductionPercent: number;
  highSeverityReduced: number;
  highSeverityReductionPercent: number;
  mediumSeverityReduced: number;
  mediumSeverityReductionPercent: number;
  lowSeverityReduced: number;
  lowSeverityReductionPercent: number;
  categoryImprovements: Record<string, { reduced: number; percent: number }>;
  filesFixed: number;
  filesFixedPercent: number;
}

export function calculateMetrics(results: ConsolidatedResult[]): ScanMetrics {
  const metrics: ScanMetrics = {
    totalFiles: results.length,
    totalIssues: 0,
    highSeverity: 0,
    mediumSeverity: 0,
    lowSeverity: 0,
    issuesByCategory: {},
    filesWithIssues: 0
  };

  for (const result of results) {
    if (result.issues.length > 0) {
      metrics.filesWithIssues++;
    }

    metrics.totalIssues += result.issues.length;

    for (const issue of result.issues) {
      // Count by severity
      if (issue.severity === 'high') metrics.highSeverity++;
      else if (issue.severity === 'medium') metrics.mediumSeverity++;
      else if (issue.severity === 'low') metrics.lowSeverity++;

      // Count by category
      metrics.issuesByCategory[issue.category] = 
        (metrics.issuesByCategory[issue.category] || 0) + 1;
    }
  }

  return metrics;
}

export function compareMetrics(before: ScanMetrics, after: ScanMetrics): ComparisonMetrics {
  const calculateReduction = (beforeVal: number, afterVal: number) => {
    const reduced = beforeVal - afterVal;
    const percent = beforeVal > 0 ? Math.round((reduced / beforeVal) * 100) : 0;
    return { reduced, percent };
  };

  const totalReduction = calculateReduction(before.totalIssues, after.totalIssues);
  const highReduction = calculateReduction(before.highSeverity, after.highSeverity);
  const mediumReduction = calculateReduction(before.mediumSeverity, after.mediumSeverity);
  const lowReduction = calculateReduction(before.lowSeverity, after.lowSeverity);
  const filesReduction = calculateReduction(before.filesWithIssues, after.filesWithIssues);

  // Calculate category improvements
  const categoryImprovements: Record<string, { reduced: number; percent: number }> = {};
  const allCategories = new Set([
    ...Object.keys(before.issuesByCategory),
    ...Object.keys(after.issuesByCategory)
  ]);

  for (const category of allCategories) {
    const beforeCount = before.issuesByCategory[category] || 0;
    const afterCount = after.issuesByCategory[category] || 0;
    const { reduced, percent } = calculateReduction(beforeCount, afterCount);
    categoryImprovements[category] = { reduced, percent };
  }

  return {
    before,
    after,
    improvements: {
      totalIssuesReduced: totalReduction.reduced,
      totalIssuesReductionPercent: totalReduction.percent,
      highSeverityReduced: highReduction.reduced,
      highSeverityReductionPercent: highReduction.percent,
      mediumSeverityReduced: mediumReduction.reduced,
      mediumSeverityReductionPercent: mediumReduction.percent,
      lowSeverityReduced: lowReduction.reduced,
      lowSeverityReductionPercent: lowReduction.percent,
      categoryImprovements,
      filesFixed: filesReduction.reduced,
      filesFixedPercent: filesReduction.percent
    }
  };
}

export function formatComparisonSummary(comparison: ComparisonMetrics): string {
  const { before, after, improvements } = comparison;
  
  let summary = '\n';
  summary += '═══════════════════════════════════════════════════════════════\n';
  summary += '              🎯 BEFORE/AFTER VERIFICATION SUMMARY\n';
  summary += '═══════════════════════════════════════════════════════════════\n\n';

  // Overall Summary
  summary += '📊 OVERALL RESULTS:\n';
  summary += `   Total Issues:        ${before.totalIssues} → ${after.totalIssues} `;
  summary += `(${improvements.totalIssuesReduced > 0 ? '✅' : '⚠️'} ${improvements.totalIssuesReductionPercent}% reduction)\n`;
  summary += `   Files with Issues:   ${before.filesWithIssues} → ${after.filesWithIssues} `;
  summary += `(${improvements.filesFixed} files fixed)\n\n`;

  // Severity Breakdown
  summary += '🔴 SEVERITY BREAKDOWN:\n';
  summary += `   High:    ${before.highSeverity} → ${after.highSeverity} `;
  summary += `(${improvements.highSeverityReductionPercent}% ${improvements.highSeverityReduced > 0 ? 'reduced ✅' : 'no change'})\n`;
  summary += `   Medium:  ${before.mediumSeverity} → ${after.mediumSeverity} `;
  summary += `(${improvements.mediumSeverityReductionPercent}% ${improvements.mediumSeverityReduced > 0 ? 'reduced ✅' : 'no change'})\n`;
  summary += `   Low:     ${before.lowSeverity} → ${after.lowSeverity} `;
  summary += `(${improvements.lowSeverityReductionPercent}% ${improvements.lowSeverityReduced > 0 ? 'reduced ✅' : 'no change'})\n\n`;

  // Category Improvements
  const categoryEntries = Object.entries(improvements.categoryImprovements)
    .filter(([, imp]) => imp.reduced > 0)
    .sort(([, a], [, b]) => b.reduced - a.reduced);

  if (categoryEntries.length > 0) {
    summary += '📁 IMPROVEMENTS BY CATEGORY:\n';
    for (const [category, imp] of categoryEntries) {
      summary += `   ${category.padEnd(20)} ${imp.reduced} issues fixed (${imp.percent}% improvement) ✅\n`;
    }
    summary += '\n';
  }

  // Success Message
  if (improvements.totalIssuesReductionPercent > 0) {
    summary += '✨ SUCCESS! Code quality improved by ';
    summary += `${improvements.totalIssuesReductionPercent}%\n`;
  } else if (after.totalIssues === 0) {
    summary += '🎉 PERFECT! No issues found!\n';
  } else {
    summary += '⚠️  No improvement detected. Consider reviewing the patches.\n';
  }

  summary += '═══════════════════════════════════════════════════════════════\n';

  return summary;
}

export function generateComparisonHTML(comparison: ComparisonMetrics): string {
  const { before, after, improvements } = comparison;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Before/After Comparison</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 20px;
      min-height: 100vh;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    .header {
      background: white;
      padding: 40px;
      border-radius: 16px;
      margin-bottom: 30px;
      box-shadow: 0 8px 16px rgba(0,0,0,0.1);
      text-align: center;
    }
    h1 { 
      font-size: 36px;
      color: #333;
      margin-bottom: 10px;
    }
    .subtitle {
      color: #666;
      font-size: 16px;
    }
    .comparison-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .metric-card {
      background: white;
      padding: 30px;
      border-radius: 16px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    .metric-label {
      font-size: 14px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 15px;
    }
    .metric-comparison {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 15px;
    }
    .metric-value {
      font-size: 48px;
      font-weight: bold;
    }
    .before { color: #f57c00; }
    .after { color: #4caf50; }
    .arrow {
      font-size: 32px;
      color: #999;
      margin: 0 15px;
    }
    .improvement {
      background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 18px;
      font-weight: bold;
      text-align: center;
    }
    .improvement.negative {
      background: linear-gradient(135deg, #f44336 0%, #e53935 100%);
    }
    .improvement.neutral {
      background: linear-gradient(135deg, #9e9e9e 0%, #757575 100%);
    }
    .severity-breakdown {
      background: white;
      padding: 30px;
      border-radius: 16px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      margin-bottom: 30px;
    }
    .severity-breakdown h2 {
      margin-bottom: 20px;
      color: #333;
    }
    .severity-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
      margin-bottom: 10px;
    }
    .severity-name {
      font-weight: 600;
      font-size: 16px;
    }
    .severity-high { border-left: 4px solid #d32f2f; }
    .severity-medium { border-left: 4px solid #f57c00; }
    .severity-low { border-left: 4px solid #388e3c; }
    .category-improvements {
      background: white;
      padding: 30px;
      border-radius: 16px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    .category-improvements h2 {
      margin-bottom: 20px;
      color: #333;
    }
    .category-item {
      display: flex;
      justify-content: space-between;
      padding: 12px;
      border-bottom: 1px solid #e0e0e0;
    }
    .category-item:last-child {
      border-bottom: none;
    }
    .success-banner {
      background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
      color: white;
      padding: 30px;
      border-radius: 16px;
      text-align: center;
      font-size: 24px;
      font-weight: bold;
      margin-top: 30px;
      box-shadow: 0 8px 16px rgba(76,175,80,0.3);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 Before/After Verification Report</h1>
      <div class="subtitle">Generated on ${new Date().toLocaleString()}</div>
    </div>

    <div class="comparison-grid">
      <div class="metric-card">
        <div class="metric-label">Total Issues</div>
        <div class="metric-comparison">
          <div class="metric-value before">${before.totalIssues}</div>
          <div class="arrow">→</div>
          <div class="metric-value after">${after.totalIssues}</div>
        </div>
        <div class="improvement ${improvements.totalIssuesReductionPercent > 0 ? '' : 'neutral'}">
          ${improvements.totalIssuesReductionPercent}% Reduction
          ${improvements.totalIssuesReductionPercent > 0 ? '✅' : ''}
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-label">Files with Issues</div>
        <div class="metric-comparison">
          <div class="metric-value before">${before.filesWithIssues}</div>
          <div class="arrow">→</div>
          <div class="metric-value after">${after.filesWithIssues}</div>
        </div>
        <div class="improvement ${improvements.filesFixed > 0 ? '' : 'neutral'}">
          ${improvements.filesFixed} Files Fixed
          ${improvements.filesFixed > 0 ? '✅' : ''}
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-label">High Severity</div>
        <div class="metric-comparison">
          <div class="metric-value before">${before.highSeverity}</div>
          <div class="arrow">→</div>
          <div class="metric-value after">${after.highSeverity}</div>
        </div>
        <div class="improvement ${improvements.highSeverityReductionPercent > 0 ? '' : 'neutral'}">
          ${improvements.highSeverityReductionPercent}% Reduction
          ${improvements.highSeverityReductionPercent > 0 ? '✅' : ''}
        </div>
      </div>
    </div>

    <div class="severity-breakdown">
      <h2>📊 Severity Breakdown</h2>
      <div class="severity-item severity-high">
        <span class="severity-name">High Severity</span>
        <span>${before.highSeverity} → ${after.highSeverity} (${improvements.highSeverityReductionPercent}% improvement)</span>
      </div>
      <div class="severity-item severity-medium">
        <span class="severity-name">Medium Severity</span>
        <span>${before.mediumSeverity} → ${after.mediumSeverity} (${improvements.mediumSeverityReductionPercent}% improvement)</span>
      </div>
      <div class="severity-item severity-low">
        <span class="severity-name">Low Severity</span>
        <span>${before.lowSeverity} → ${after.lowSeverity} (${improvements.lowSeverityReductionPercent}% improvement)</span>
      </div>
    </div>

    ${Object.keys(improvements.categoryImprovements).length > 0 ? `
    <div class="category-improvements">
      <h2>📁 Improvements by Category</h2>
      ${Object.entries(improvements.categoryImprovements)
        .filter(([, imp]) => imp.reduced > 0)
        .sort(([, a], [, b]) => b.reduced - a.reduced)
        .map(([category, imp]) => `
          <div class="category-item">
            <span><strong>${category}</strong></span>
            <span>${imp.reduced} issues fixed (${imp.percent}% improvement) ✅</span>
          </div>
        `).join('')}
    </div>
    ` : ''}

    ${improvements.totalIssuesReductionPercent > 0 || after.totalIssues === 0 ? `
    <div class="success-banner">
      ${after.totalIssues === 0 
        ? '🎉 PERFECT! No issues found!' 
        : `✨ Code Quality Improved by ${improvements.totalIssuesReductionPercent}%!`}
    </div>
    ` : ''}
  </div>
</body>
</html>
  `;
}
