import { MockModel } from '../src/model/mockModel';

describe('MockModel', () => {
  let model: MockModel;

  beforeEach(() => {
    model = new MockModel();
  });

  describe('generateSuggestion', () => {
    it('should suggest alt text for images', async () => {
      const code = '<img src="profile.jpg">';
      const fix = await model.generateSuggestion(code);

      expect(fix.suggestion).toContain('alt');
      expect(fix.confidence).toBeGreaterThan(0);
      expect(fix.confidence).toBeLessThanOrEqual(1);
    });

    it('should suggest rel attributes for target="_blank" links', async () => {
      const code = '<a href="https://example.com" target="_blank">Link</a>';
      const fix = await model.generateSuggestion(code);

      expect(fix.suggestion).toContain('rel');
    });

    it('should suggest lang attribute for html tags', async () => {
      const code = '<html><head></head></html>';
      const fix = await model.generateSuggestion(code);

      expect(fix.suggestion).toContain('lang');
    });

    it('should return suggestion for unmatched patterns', async () => {
      const code = '<div>Valid content</div>';
      const fix = await model.generateSuggestion(code);

      expect(fix.suggestion).toBeDefined();
      expect(fix.confidence).toBeGreaterThan(0);
    });

    it('should handle empty code', async () => {
      const fix = await model.generateSuggestion('');

      expect(fix.suggestion).toBeDefined();
      expect(fix.confidence).toBeGreaterThan(0);
    });
  });
});
