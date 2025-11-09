import { generateHtmlAstPatch, generateTsxAstPatch } from '../src/patcher/astPatcher';

describe('AST Patcher', () => {
  describe('generateHtmlAstPatch', () => {
    it('should add lang attribute to html tag', () => {
      const html = '<html><head></head><body></body></html>';
      const result = generateHtmlAstPatch('test.html', html);

      expect(result.modified).toContain('lang=');
      expect(result.rationale).toContain('lang');
    });

    it('should add alt attributes to images', () => {
      const html = '<html><body><img src="test.jpg"></body></html>';
      const result = generateHtmlAstPatch('test.html', html);

      expect(result.modified).toContain('alt=');
      expect(result.rationale).toBeDefined();
    });

    it('should add JSON-LD snippet when missing', () => {
      const html = '<html><head></head><body></body></html>';
      const result = generateHtmlAstPatch('test.html', html);

      expect(result.modified).toContain('application/ld+json');
      expect(result.aiContent).toBeDefined();
    });

    it('should not modify valid HTML', () => {
      const html = '<html lang="en"><head><script type="application/ld+json">{}</script></head><body><img src="test.jpg" alt="Test"></body></html>';
      const result = generateHtmlAstPatch('test.html', html);

      expect(result.rationale).toContain('No AST-based changes');
    });

    it('should handle malformed HTML gracefully', () => {
      const html = '<html><body><img src="test.jpg"';
      
      expect(() => generateHtmlAstPatch('test.html', html)).not.toThrow();
    });

    it('should handle empty HTML', () => {
      const result = generateHtmlAstPatch('test.html', '');

      expect(result).toBeDefined();
      expect(result.modified).toBeDefined();
    });
  });

  describe('generateTsxAstPatch', () => {
    it('should add alt attributes to img elements', () => {
      const tsx = 'export const Component = () => <img src="test.jpg" />';
      const result = generateTsxAstPatch('test.tsx', tsx);

      expect(result.modified).toContain('alt=');
      expect(result.rationale).toBeDefined();
    });

    it('should handle multiple images', () => {
      const tsx = 'export const Gallery = () => <div><img src="1.jpg" /><img src="2.jpg" /></div>';
      const result = generateTsxAstPatch('test.tsx', tsx);

      const altCount = (result.modified.match(/alt=/g) || []).length;
      expect(altCount).toBeGreaterThanOrEqual(2);
    });

    it('should not modify images with alt', () => {
      const tsx = 'export const Component = () => <img src="test.jpg" alt="Test" />';
      const result = generateTsxAstPatch('test.tsx', tsx);

      expect(result.rationale).toContain('No AST-based changes');
    });

    it('should handle JSX fragments', () => {
      const tsx = 'export const Component = () => <><div>Test</div></>';
      
      expect(() => generateTsxAstPatch('test.tsx', tsx)).not.toThrow();
    });

    it('should handle complex JSX structures', () => {
      const tsx = `
        export const Component = () => (
          <div>
            <header><img src="logo.jpg" /></header>
            <main><img src="hero.jpg" /></main>
          </div>
        )
      `;
      const result = generateTsxAstPatch('test.tsx', tsx);

      expect(result.modified).toContain('alt=');
    });

    it('should handle empty TSX', () => {
      const result = generateTsxAstPatch('test.tsx', '');

      expect(result).toBeDefined();
    });

    it('should handle malformed TSX gracefully', () => {
      const tsx = 'export const Component = () => <img src="test.jpg"';
      
      expect(() => generateTsxAstPatch('test.tsx', tsx)).not.toThrow();
    });
  });
});
