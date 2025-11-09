import * as fs from 'fs';
import { logger } from './logger';

interface ScanResult {
  fileName: string;
  fileType: string;
  isValid: boolean;
  issues: Array<{
    category: string;
    description: string;
    severity: string;
  }>;
  aiSuggestedPatches: Array<{
    diff?: string;
    rationale: string;
  }>;
}

export function generateHTMLReport(results: ScanResult[], outputPath: string): void {
  const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
  const totalFixes = results.reduce((sum, r) => sum + r.aiSuggestedPatches.length, 0);
  const highSeverityIssues = results.flatMap(r => r.issues).filter(i => i.severity === 'high').length;
  const issuesByCategory = results.flatMap(r => r.issues).reduce((acc, issue) => {
    acc[issue.category] = (acc[issue.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Code Scan Report - ${new Date().toLocaleDateString()}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      min-height: 100vh;
    }
    .container { max-width: 1400px; margin: 0 auto; }
    .header { 
      background: white; 
      padding: 30px; 
      border-radius: 12px; 
      margin-bottom: 30px; 
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .header h1 { 
      color: #333; 
      margin-bottom: 10px;
      font-size: 32px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .header .subtitle {
      color: #666;
      font-size: 14px;
    }
    .summary { 
      background: white; 
      padding: 25px; 
      border-radius: 12px; 
      margin-bottom: 30px; 
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .summary h2 { 
      color: #333; 
      margin-bottom: 20px;
      font-size: 24px;
    }
    .summary-grid { 
      display: grid; 
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); 
      gap: 20px; 
      margin-bottom: 25px;
    }
    .stat-card { 
      text-align: center; 
      padding: 20px; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 10px;
      color: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .stat-value { 
      font-size: 42px; 
      font-weight: bold;
      margin-bottom: 8px;
    }
    .stat-label { 
      font-size: 14px;
      opacity: 0.9;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .category-breakdown {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      margin-top: 15px;
    }
    .category-breakdown h3 {
      font-size: 16px;
      margin-bottom: 12px;
      color: #555;
    }
    .category-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e0e0e0;
    }
    .category-item:last-child {
      border-bottom: none;
    }
    .filter-bar { 
      background: white; 
      padding: 20px; 
      border-radius: 12px; 
      margin-bottom: 20px; 
      display: flex; 
      gap: 10px; 
      flex-wrap: wrap;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .filter-btn { 
      padding: 10px 20px; 
      border: 2px solid #e0e0e0; 
      background: white; 
      border-radius: 8px; 
      cursor: pointer; 
      transition: all 0.3s;
      font-weight: 500;
      font-size: 14px;
    }
    .filter-btn:hover { 
      background: #f5f5f5;
      border-color: #667eea;
    }
    .filter-btn.active { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white; 
      border-color: #667eea;
    }
    .pagination { 
      background: white; 
      padding: 20px; 
      border-radius: 12px; 
      margin-bottom: 20px; 
      display: flex; 
      justify-content: center;
      align-items: center;
      gap: 10px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .pagination-btn {
      padding: 8px 16px;
      border: 2px solid #e0e0e0;
      background: white;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      font-size: 14px;
      transition: all 0.3s;
    }
    .pagination-btn:hover:not(:disabled) {
      background: #f5f5f5;
      border-color: #667eea;
    }
    .pagination-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .pagination-btn.active {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-color: #667eea;
    }
    .pagination-info {
      color: #666;
      font-size: 14px;
      font-weight: 500;
    }
    .file-card { 
      background: white; 
      padding: 25px; 
      border-radius: 12px; 
      margin-bottom: 20px; 
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      transition: transform 0.2s;
    }
    .file-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(0,0,0,0.15);
    }
    .file-header { 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      margin-bottom: 20px; 
      border-bottom: 2px solid #f0f0f0; 
      padding-bottom: 15px;
    }
    .file-name { 
      font-size: 18px; 
      font-weight: 600; 
      color: #333;
      font-family: 'Courier New', monospace;
      word-break: break-all;
    }
    .file-type { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white; 
      padding: 6px 14px; 
      border-radius: 20px; 
      font-size: 12px; 
      font-weight: 600;
    }
    .issues-section { margin-top: 20px; }
    .issues-section h3 { 
      color: #333; 
      margin-bottom: 15px;
      font-size: 18px;
    }
    .issue-item { 
      display: flex; 
      gap: 15px; 
      padding: 15px; 
      background: #fff8e1; 
      border-left: 4px solid #ff9800; 
      margin-bottom: 12px; 
      border-radius: 6px;
      transition: all 0.2s;
    }
    .issue-item:hover {
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .issue-item.high { background: #ffebee; border-left-color: #d32f2f; }
    .issue-item.medium { background: #fff3e0; border-left-color: #f57c00; }
    .issue-item.low { background: #e8f5e9; border-left-color: #388e3c; }
    .severity-badge { 
      padding: 6px 12px; 
      border-radius: 6px; 
      font-size: 11px; 
      font-weight: bold; 
      text-transform: uppercase; 
      align-self: flex-start;
      white-space: nowrap;
    }
    .severity-high { background: #d32f2f; color: white; }
    .severity-medium { background: #f57c00; color: white; }
    .severity-low { background: #388e3c; color: white; }
    .issue-content { flex: 1; }
    .issue-category { 
      font-size: 12px; 
      color: #666; 
      text-transform: uppercase; 
      letter-spacing: 0.5px; 
      margin-bottom: 6px;
      font-weight: 600;
    }
    .issue-description { 
      color: #333; 
      line-height: 1.6;
      font-size: 14px;
    }
    .patches-section { 
      margin-top: 25px;
      padding-top: 20px;
      border-top: 2px solid #f0f0f0;
    }
    .patches-section h3 { 
      color: #333; 
      margin-bottom: 15px;
      font-size: 18px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .patch-item { 
      background: #f5f5f5; 
      padding: 18px; 
      border-radius: 8px; 
      margin-bottom: 12px; 
      border-left: 4px solid #4caf50;
    }
    .patch-diff { 
      font-family: 'Courier New', monospace; 
      font-size: 13px; 
      background: #1e1e1e;
      color: #d4d4d4;
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 12px;
      overflow-x: auto;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .patch-diff .diff-add { color: #4ec9b0; }
    .patch-diff .diff-remove { color: #f48771; }
    .patch-rationale { 
      font-size: 14px; 
      color: #666; 
      font-style: italic;
      padding-left: 10px;
      border-left: 3px solid #4caf50;
    }
    .no-issues { 
      color: #4caf50; 
      font-weight: 600; 
      padding: 20px; 
      background: #e8f5e9; 
      border-radius: 8px; 
      text-align: center;
      font-size: 16px;
    }
    h2, h3 { color: #333; }
    @media (max-width: 768px) {
      .summary-grid { grid-template-columns: 1fr; }
      .filter-bar { justify-content: center; }
      .file-header { flex-direction: column; align-items: flex-start; gap: 10px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>
        <span>🔍</span>
        <span>Code Quality Scan Report</span>
      </h1>
      <div class="subtitle">Generated on ${new Date().toLocaleString()}</div>
    </div>
    
    <div class="summary">
      <h2>📊 Summary Statistics</h2>
      <div class="summary-grid">
        <div class="stat-card">
          <div class="stat-value">${results.length}</div>
          <div class="stat-label">Files Scanned</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${totalIssues}</div>
          <div class="stat-label">Total Issues</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${highSeverityIssues}</div>
          <div class="stat-label">High Severity</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${totalFixes}</div>
          <div class="stat-label">Suggested Fixes</div>
        </div>
      </div>

      ${Object.keys(issuesByCategory).length > 0 ? `
        <div class="category-breakdown">
          <h3>Issues by Category</h3>
          ${Object.entries(issuesByCategory).map(([category, count]) => `
            <div class="category-item">
              <span>${escapeHtml(category)}</span>
              <strong>${count}</strong>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>

    <div class="filter-bar">
      <button class="filter-btn active" onclick="filterFiles('all', event)">📁 All Files</button>
      <button class="filter-btn" onclick="filterFiles('issues', event)">⚠️ With Issues</button>
      <button class="filter-btn" onclick="filterFiles('high', event)">🔴 High Severity</button>
      <button class="filter-btn" onclick="filterFiles('tsx', event)">⚛️ TSX</button>
      <button class="filter-btn" onclick="filterFiles('css', event)">🎨 CSS</button>
      <button class="filter-btn" onclick="filterFiles('html', event)">🌐 HTML</button>
    </div>

    <div class="pagination" id="pagination">
      <button class="pagination-btn" onclick="changePage('first')" id="firstBtn">⏮️ First</button>
      <button class="pagination-btn" onclick="changePage('prev')" id="prevBtn">◀️ Prev</button>
      <span class="pagination-info" id="pageInfo">Page 1 of 1</span>
      <button class="pagination-btn" onclick="changePage('next')" id="nextBtn">Next ▶️</button>
      <button class="pagination-btn" onclick="changePage('last')" id="lastBtn">Last ⏭️</button>
    </div>

    <div id="fileCardsContainer">
    ${results.map(file => `
      <div class="file-card" data-type="${file.fileType.toLowerCase()}" data-has-issues="${file.issues.length > 0}" data-has-high="${file.issues.some(i => i.severity === 'high')}">
        <div class="file-header">
          <div class="file-name">${escapeHtml(file.fileName)}</div>
          <div class="file-type">${escapeHtml(file.fileType)}</div>
        </div>

        ${file.issues.length === 0 ? `
          <div class="no-issues">✅ No issues found - Great job!</div>
        ` : `
          <div class="issues-section">
            <h3>⚠️ Issues Found (${file.issues.length})</h3>
            ${file.issues.map(issue => `
              <div class="issue-item ${issue.severity}">
                <span class="severity-badge severity-${issue.severity}">${escapeHtml(issue.severity)}</span>
                <div class="issue-content">
                  <div class="issue-category">${escapeHtml(issue.category)}</div>
                  <div class="issue-description">${escapeHtml(issue.description)}</div>
                </div>
              </div>
            `).join('')}
          </div>

          ${file.aiSuggestedPatches.length > 0 ? `
            <div class="patches-section">
              <h3>💡 Suggested Fixes (${file.aiSuggestedPatches.length})</h3>
              ${file.aiSuggestedPatches.map(patch => `
                <div class="patch-item">
                  ${patch.diff ? `<pre class="patch-diff">${formatDiff(patch.diff)}</pre>` : ''}
                  <div class="patch-rationale">${escapeHtml(patch.rationale)}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}
        `}
      </div>
    `).join('')}
  </div>

  <script>
    let currentPage = 1;
    let itemsPerPage = 50; // Show 50 files per page
    let currentFilter = 'all';
    let currentFilterEvent = null;
    
    function filterFiles(type, event) {
      const cards = document.querySelectorAll('.file-card');
      const buttons = document.querySelectorAll('.filter-btn');
      const allIssues = document.querySelectorAll('.issue-item');
      
      buttons.forEach(btn => btn.classList.remove('active'));
      if (event && event.target) event.target.classList.add('active');

      currentFilter = type;
      currentFilterEvent = event;
      currentPage = 1; // Reset to first page when filter changes

      // Reset all issues to visible first
      allIssues.forEach(issue => {
        issue.style.display = 'flex';
      });

      let visibleCards = [];
      cards.forEach(card => {
        let show = false;
        if (type === 'all') {
          show = true;
        } else if (type === 'issues') {
          show = card.dataset.hasIssues === 'true';
        } else if (type === 'high') {
          show = card.dataset.hasHigh === 'true';
          // Hide non-high severity issues when filtering by high severity
          if (show) {
            const issuesInCard = card.querySelectorAll('.issue-item');
            issuesInCard.forEach(issue => {
              if (!issue.classList.contains('high')) {
                issue.style.display = 'none';
              }
            });
          }
        } else {
          show = card.dataset.type === type;
        }
        
        if (show) {
          visibleCards.push(card);
        }
      });
      
      // Apply pagination
      paginateCards(visibleCards);
    }
    
    function paginateCards(visibleCards) {
      const totalPages = Math.ceil(visibleCards.length / itemsPerPage);
      const start = (currentPage - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      
      // Hide all cards first
      document.querySelectorAll('.file-card').forEach(card => {
        card.style.display = 'none';
      });
      
      // Show only cards for current page
      visibleCards.forEach((card, index) => {
        if (index >= start && index < end) {
          card.style.display = 'block';
        }
      });
      
      // Update pagination controls
      updatePaginationControls(currentPage, totalPages, visibleCards.length);
      
      // Hide pagination if all cards fit on one page
      document.getElementById('pagination').style.display = 
        totalPages <= 1 ? 'none' : 'flex';
    }
    
    function updatePaginationControls(page, totalPages, totalItems) {
      document.getElementById('pageInfo').textContent = 
        totalItems > 0 ? \`Page \${page} of \${totalPages} (\${totalItems} files)\` : 'No files found';
      document.getElementById('firstBtn').disabled = page === 1;
      document.getElementById('prevBtn').disabled = page === 1;
      document.getElementById('nextBtn').disabled = page >= totalPages;
      document.getElementById('lastBtn').disabled = page >= totalPages;
    }
    
    function changePage(direction) {
      const cards = document.querySelectorAll('.file-card');
      let visibleCards = [];
      
      cards.forEach(card => {
        let show = false;
        if (currentFilter === 'all') {
          show = true;
        } else if (currentFilter === 'issues') {
          show = card.dataset.hasIssues === 'true';
        } else if (currentFilter === 'high') {
          show = card.dataset.hasHigh === 'true';
        } else {
          show = card.dataset.type === currentFilter;
        }
        if (show) visibleCards.push(card);
      });
      
      const totalPages = Math.ceil(visibleCards.length / itemsPerPage);
      
      if (direction === 'first') {
        currentPage = 1;
      } else if (direction === 'prev') {
        currentPage = Math.max(1, currentPage - 1);
      } else if (direction === 'next') {
        currentPage = Math.min(totalPages, currentPage + 1);
      } else if (direction === 'last') {
        currentPage = totalPages;
      }
      
      paginateCards(visibleCards);
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    // Initialize on page load
    window.onload = function() {
      filterFiles('all', { target: document.querySelector('.filter-btn.active') });
    };
  </script>
</body>
</html>
  `;

  fs.writeFileSync(outputPath, html, 'utf8');
  logger.success(`HTML report generated successfully at: ${outputPath}`);
}

function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDiff(diff: string): string {
  return escapeHtml(diff)
    .split('\n')
    .map(line => {
      if (line.startsWith('+')) {
        return `<span class="diff-add">${line}</span>`;
      } else if (line.startsWith('-')) {
        return `<span class="diff-remove">${line}</span>`;
      }
      return line;
    })
    .join('\n');
}