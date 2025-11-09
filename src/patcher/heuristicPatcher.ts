import { ContextConfig } from '../utils/prompts';
import { suggestAltFromSrc } from '../scanner/htmlScanner';

/**
 * Applies heuristic-based fixes to HTML/CSS content
 */
export class HeuristicPatcher {
  /**
   * Apply image alt text fixes
   */
  applyImageAltFixes(content: string, context: ContextConfig): string {
    const imgRegex = /<img\b([^>]*?)>/gi;
    return content.replace(imgRegex, (match, attrs) => {
      if (/\balt=/.test(attrs)) return match;
      
      const srcMatch = /src=["']?([^"'\s>]+)["']?/.exec(attrs);
      const suggestion = suggestAltFromSrc((srcMatch && srcMatch[1]) || '');
      const roleAttr = context.a11yLevel === 'AAA' ? ' role="img"' : '';
      return `<img ${attrs} alt="${suggestion}"${roleAttr}>`;
    });
  }

  /**
   * Add viewport meta tag if needed
   */
  applyViewportFix(content: string, context: ContextConfig): string {
    if (!context.viewport || /meta.*viewport/.test(content)) {
      return content;
    }

    const viewportContent = this.getViewportContent(context.viewport);
    return content.replace(/<head>/, `<head>\n  <meta name="viewport" content="${viewportContent}">`);
  }

  /**
   * Add language attribute to html tag
   */
  applyLocaleFix(content: string, context: ContextConfig): string {
    if (!context.locale) return content;
    if (!/<html[^>]*>/.test(content)) return content;
    if (/<html[^>]*lang=/.test(content)) return content;

    return content.replace(/<html/, `<html lang="${context.locale}"`);
  }

  /**
   * Add color scheme meta tag
   */
  applyColorSchemeFix(content: string, context: ContextConfig): string {
    if (context.colorScheme !== 'both') return content;
    if (/@media.*(prefers-color-scheme)/.test(content)) return content;

    return content.replace(/<\/head>/, `  <meta name="color-scheme" content="light dark">\n</head>`);
  }

  private getViewportContent(viewport: string): string {
    if (viewport === 'responsive') {
      return 'width=device-width, initial-scale=1.0';
    }
    const widths: Record<string, string> = {
      mobile: '420',
      tablet: '768',
      desktop: '1024'
    };
    return `width=${widths[viewport] || '1024'}`;
  }
}
