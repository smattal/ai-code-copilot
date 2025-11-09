import { ModelResponse } from '../types/model';

export async function suggestAltTextContextual(src: string): Promise<string> {
  // Mock: generate simple alt from filename
  if (!src) return 'Image';
  const parts = src.split('/');
  const name = parts[parts.length - 1] || 'image';
  const cleaned = name.replace(/[-_\d]+/g, ' ').replace(/\.[a-z0-9]+$/i, '');
  return cleaned ? cleaned.trim() : 'Image';
}

export class MockModel {
  private rules: Array<{
    pattern: RegExp;
    suggestion: string;
    confidence: number;
    reasoning: string;
  }>;

  constructor() {
    this.rules = [
      {
        pattern: /<img[^>]+(?!alt=)[^>]*>/i,
        suggestion: 'Add alt attribute to img tag',
        confidence: 0.9,
        reasoning: 'Images require alt text for accessibility'
      },
      {
        pattern: /<a[^>]+target="_blank"[^>]*(?!rel=)[^>]*>/i,
        suggestion: 'Add rel="noopener noreferrer" to _blank links',
        confidence: 0.95,
        reasoning: 'External links should have security attributes'
      },
      {
        pattern: /<html[^>]*(?!lang=)[^>]*>/i,
        suggestion: 'Add lang attribute to html tag',
        confidence: 0.9,
        reasoning: 'HTML documents should specify language'
      }
    ];
  }

  async generateSuggestion(input: string): Promise<ModelResponse> {
    // Check each rule
    for (const rule of this.rules) {
      if (rule.pattern.test(input)) {
        return {
          suggestion: rule.suggestion,
          confidence: rule.confidence,
          model: 'mock',
          reasoning: rule.reasoning
        };
      }
    }

    // No matching rules
    return {
      suggestion: 'No issues found',
      confidence: 0.5,
      model: 'mock',
      reasoning: 'No matching patterns in rule set'
    };
  }
}
