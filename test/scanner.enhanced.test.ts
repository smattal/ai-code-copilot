import { scanFile as scanHtmlFile } from '../src/scanner/htmlScanner';
import { scanFile as scanTsxFile } from '../src/scanner/tsxScanner';
import * as fs from 'fs';
import * as path from 'path';

describe('Enhanced Scanner - Comprehensive Issue Detection', () => {
  const testHtmlPath = path.join(__dirname, '../sample_input/web_components/test-page.html');
  const testTsxPath = path.join(__dirname, '../sample_input/react_components/test-component.tsx');

  describe('HTML Scanner', () => {
    let issues: any[];

    beforeAll(() => {
      if (fs.existsSync(testHtmlPath)) {
        issues = scanHtmlFile(testHtmlPath);
      }
    });

    it('should detect structural issues', () => {
      const structuralIssues = issues.filter(i => 
        i.rule.startsWith('structural-') || i.rule.includes('duplicate-id') || i.rule.includes('broken-link')
      );
      expect(structuralIssues.length).toBeGreaterThan(0);
    });

    it('should detect accessibility issues (WCAG 2.2 AA)', () => {
      const accessibilityIssues = issues.filter(i => 
        i.rule.includes('alt-missing') || 
        i.rule.includes('lang-missing') || 
        i.rule.includes('contrast') ||
        i.rule.includes('form-label') ||
        i.rule.includes('button-label') ||
        i.rule.includes('keyboard-trap')
      );
      expect(accessibilityIssues.length).toBeGreaterThan(0);
    });

    it('should detect SEO issues', () => {
      const seoIssues = issues.filter(i => i.rule.startsWith('seo-'));
      expect(seoIssues.length).toBeGreaterThan(0);
    });

    it('should detect security issues', () => {
      const securityIssues = issues.filter(i => i.rule.startsWith('security-'));
      expect(securityIssues.length).toBeGreaterThan(0);
    });

    it('should detect performance issues', () => {
      const performanceIssues = issues.filter(i => i.rule.startsWith('perf-'));
      expect(performanceIssues.length).toBeGreaterThan(0);
    });

    it('should detect i18n issues', () => {
      const i18nIssues = issues.filter(i => i.rule.startsWith('i18n-'));
      expect(i18nIssues.length).toBeGreaterThan(0);
    });

    it('should detect duplicate IDs', () => {
      const duplicateIdIssues = issues.filter(i => i.rule === 'structural-duplicate-id');
      expect(duplicateIdIssues.length).toBeGreaterThan(0);
    });

    it('should detect invalid nesting', () => {
      const nestingIssues = issues.filter(i => i.rule.includes('invalid-nesting'));
      expect(nestingIssues.length).toBeGreaterThan(0);
    });

    it('should detect XSS vulnerabilities', () => {
      const xssIssues = issues.filter(i => 
        i.rule.includes('xss') || 
        i.rule === 'security-inline-script' ||
        i.rule === 'security-inline-event-handler'
      );
      expect(xssIssues.length).toBeGreaterThan(0);
    });

    it('should detect insecure HTTP usage', () => {
      const httpIssues = issues.filter(i => i.rule.includes('http'));
      expect(httpIssues.length).toBeGreaterThan(0);
    });
  });

  describe('TSX Scanner', () => {
    let issues: any[];

    beforeAll(() => {
      if (fs.existsSync(testTsxPath)) {
        issues = scanTsxFile(testTsxPath);
      }
    });

    it('should detect structural issues in TSX', () => {
      const structuralIssues = issues.filter(i => i.rule.startsWith('structural-'));
      expect(structuralIssues.length).toBeGreaterThan(0);
    });

    it('should detect accessibility issues in TSX', () => {
      const accessibilityIssues = issues.filter(i => 
        i.rule.includes('alt') || 
        i.rule.includes('lang') ||
        i.rule.includes('form-label') ||
        i.rule.includes('button-label')
      );
      expect(accessibilityIssues.length).toBeGreaterThan(0);
    });

    it('should detect SEO issues in TSX', () => {
      const seoIssues = issues.filter(i => i.rule.startsWith('seo-'));
      expect(seoIssues.length).toBeGreaterThan(0);
    });

    it('should detect security issues in TSX', () => {
      const securityIssues = issues.filter(i => 
        i.rule.startsWith('security-') || 
        i.rule.includes('xss')
      );
      expect(securityIssues.length).toBeGreaterThan(0);
    });

    it('should detect dangerouslySetInnerHTML usage', () => {
      const dangerousHtmlIssues = issues.filter(i => i.rule === 'security-xss-dangerous-html');
      expect(dangerousHtmlIssues.length).toBeGreaterThan(0);
    });

    it('should detect performance issues in TSX', () => {
      const perfIssues = issues.filter(i => i.rule.startsWith('perf-'));
      expect(perfIssues.length).toBeGreaterThan(0);
    });

    it('should detect i18n issues in TSX', () => {
      const i18nIssues = issues.filter(i => i.rule.startsWith('i18n-'));
      expect(i18nIssues.length).toBeGreaterThan(0);
    });
  });

  describe('Issue Categories', () => {
    it('should categorize all required issue types', () => {
      const htmlIssues = fs.existsSync(testHtmlPath) ? scanHtmlFile(testHtmlPath) : [];
      const tsxIssues = fs.existsSync(testTsxPath) ? scanTsxFile(testTsxPath) : [];
      const allIssues = [...htmlIssues, ...tsxIssues];

      const categories = new Set(allIssues.map(i => {
        if (i.rule.startsWith('structural-') || i.rule.includes('duplicate-id') || i.rule.includes('broken')) return 'structural';
        if (i.rule.includes('alt') || i.rule.includes('lang') || i.rule.includes('contrast') || 
            i.rule.includes('label') || i.rule.includes('keyboard') || i.rule.includes('role')) return 'accessibility';
        if (i.rule.startsWith('seo-')) return 'seo';
        if (i.rule.startsWith('security-') || i.rule.includes('xss') || i.rule.includes('http')) return 'security';
        if (i.rule.startsWith('perf-')) return 'performance';
        if (i.rule.startsWith('i18n-')) return 'i18n';
        return 'other';
      }));

      expect(categories.has('structural')).toBe(true);
      expect(categories.has('accessibility')).toBe(true);
      expect(categories.has('seo')).toBe(true);
      expect(categories.has('security')).toBe(true);
      expect(categories.has('performance')).toBe(true);
      expect(categories.has('i18n')).toBe(true);
    });
  });
});
