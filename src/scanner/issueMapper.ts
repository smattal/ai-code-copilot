import { ConsolidatedIssue, AiPatch } from './types';

export function toSeverity(s: 'info' | 'warning' | 'error'): 'low' | 'medium' | 'high' {
  if (s === 'error') return 'high';
  if (s === 'warning') return 'medium';
  return 'low';
}

export function mapIssues(_file: string, _type: string, issues: Array<Record<string, unknown>>): ConsolidatedIssue[] {
  return issues.map((i) => ({
    category: determineCategory(i.rule as string),
    description: (i.message || i.description || i.rule || 'Issue detected') as string,
    severity: toSeverity((i.severity || 'warning') as 'info' | 'warning' | 'error'),
  }));
}

function determineCategory(rule?: string): string {
  if (!rule) return 'structure';
  if (
    rule.startsWith('img') ||
    rule.startsWith('alt') ||
    rule.startsWith('contrast') ||
    rule.startsWith('lang') ||
    rule.startsWith('keyboard')
  ) return 'accessibility';
  if (
    rule.startsWith('seo') ||
    rule.startsWith('jsonld') ||
    rule.startsWith('heading') ||
    rule.startsWith('meta') ||
    rule.startsWith('title')
  ) return 'seo';
  if (
    rule.startsWith('security') ||
    rule.startsWith('csp') ||
    rule.startsWith('xss')
  ) return 'security';
  if (
    rule.startsWith('perf') ||
    rule.startsWith('dom-depth') ||
    rule.startsWith('unused')
  ) return 'performance';
  if (
    rule.startsWith('i18n') ||
    rule.startsWith('locale')
  ) return 'i18n';
  if (
    rule.startsWith('duplicate-id') ||
    rule.startsWith('broken-link') ||
    rule.startsWith('invalid-nesting')
  ) return 'structure';
  if (rule.startsWith('design')) return 'design';
  return 'structure';
}

export function createPatches(issues: Array<Record<string, unknown>>): AiPatch[] {
  return issues.map((iss) => ({
    diff: (iss.fix as string) || `Suggested fix: ${iss.rule}`,
    rationale: (iss.rationale as string) || 'Auto-suggested improvement.'
  }));
}
