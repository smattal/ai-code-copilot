/**
 * File analysis utilities for code quality metrics
 */

import * as fs from 'fs';
import * as path from 'path';
import { FileMetrics } from './qualityMetricsTypes';

export class FileAnalyzer {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  getAllSourceFiles(): string[] {
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

  analyzeFiles(filePaths: string[]): FileMetrics[] {
    return filePaths.map(filePath => this.analyzeFile(filePath));
  }

  private analyzeFile(filePath: string): FileMetrics {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const ext = path.extname(filePath);
    
    const lineCounts = this.countLineTypes(lines);
    const codeCounts = this.countCodeElements(content);
    const complexity = this.calculateComplexity(content);
    const issues = this.detectIssues(content, filePath, lineCounts.code, complexity, codeCounts.functions);

    return {
      filePath: path.relative(this.projectRoot, filePath),
      language: this.getLanguage(ext),
      lines: lines.length,
      codeLines: lineCounts.code,
      commentLines: lineCounts.comment,
      complexity,
      functions: codeCounts.functions,
      classes: codeCounts.classes,
      issues
    };
  }

  private countLineTypes(lines: string[]): { code: number; comment: number; blank: number } {
    let code = 0;
    let comment = 0;
    let blank = 0;
    let inBlockComment = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        blank++;
      } else if (trimmed.startsWith('//')) {
        comment++;
      } else if (trimmed.startsWith('/*')) {
        comment++;
        inBlockComment = true;
        if (trimmed.endsWith('*/') && trimmed.length > 4) {
          inBlockComment = false;
        }
      } else if (inBlockComment) {
        comment++;
        if (trimmed.endsWith('*/')) {
          inBlockComment = false;
        }
      } else {
        code++;
      }
    }

    return { code, comment, blank };
  }

  private countCodeElements(content: string): { functions: number; classes: number } {
    const functionRegex = /function\s+\w+|const\s+\w+\s*=\s*\(.*?\)\s*=>|async\s+\w+\s*\(/g;
    const classRegex = /class\s+\w+/g;
    
    const functions = (content.match(functionRegex) || []).length;
    const classes = (content.match(classRegex) || []).length;

    return { functions, classes };
  }

  private calculateComplexity(content: string): number {
    const complexityKeywords = /\bif\b|\belse\b|\bfor\b|\bwhile\b|\bdo\b|\bswitch\b|\bcase\b|\bcatch\b|\b&&\b|\b\|\|\b|\?/g;
    const matches = content.match(complexityKeywords) || [];
    return matches.length + 1;
  }

  private detectIssues(
    content: string, 
    filePath: string, 
    codeLines: number, 
    complexity: number, 
    functions: number
  ): string[] {
    const issues: string[] = [];

    if (codeLines > 500) {
      issues.push('File is too large (>500 lines)');
    }
    if (complexity > 20) {
      issues.push(`High complexity (${complexity})`);
    }
    if (functions > 30) {
      issues.push('Too many functions in one file');
    }
    
    if (this.hasAnyTypeAnnotation(content, filePath)) {
      issues.push('Uses "any" type');
    }
    
    if (content.includes('console.log') && !filePath.includes('test') && !filePath.includes('logger.ts') && !filePath.includes('fileAnalyzer.ts')) {
      issues.push('Contains console.log statements');
    }

    return issues;
  }

  private hasAnyTypeAnnotation(content: string, filePath: string): boolean {
    if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) {
      return false;
    }
    
    const anyTypePattern = /:\s*any\b|<any>|any\[\]|Array<any>|\(\s*any\s*\)|as\s+any\b/;
    return anyTypePattern.test(content);
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
}
