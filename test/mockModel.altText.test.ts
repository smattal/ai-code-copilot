import { suggestAltTextContextual } from '../src/model/mockModel';

describe('Mock Model - Alt Text Generation', () => {
  describe('suggestAltTextContextual', () => {
    it('should generate alt text from filename', async () => {
      const result = await suggestAltTextContextual('profile-picture.jpg');
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should clean up filename', async () => {
      const result = await suggestAltTextContextual('user-profile-123.png');
      
      expect(result).not.toContain('123');
      expect(result).not.toContain('-');
    });

    it('should handle paths', async () => {
      const result = await suggestAltTextContextual('/images/users/avatar-photo.jpg');
      
      expect(result).toBeDefined();
      expect(result).toContain('avatar');
    });

    it('should remove file extensions', async () => {
      const result = await suggestAltTextContextual('logo.png');
      
      expect(result).not.toContain('.png');
    });

    it('should handle empty strings', async () => {
      const result = await suggestAltTextContextual('');
      
      expect(result).toBe('Image');
    });

    it('should handle URLs', async () => {
      const result = await suggestAltTextContextual('https://example.com/images/hero-banner.jpg');
      
      expect(result).toBeDefined();
      expect(result).toContain('hero');
    });

    it('should handle underscores', async () => {
      const result = await suggestAltTextContextual('product_image_large.jpg');
      
      expect(result).not.toContain('_');
      expect(result).toContain('product');
    });

    it('should handle multiple dashes', async () => {
      const result = await suggestAltTextContextual('user-profile-avatar-image.jpg');
      
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle numbers in middle of filename', async () => {
      const result = await suggestAltTextContextual('product2023image.jpg');
      
      expect(result).toBeDefined();
    });

    it('should handle all uppercase', async () => {
      const result = await suggestAltTextContextual('LOGO.PNG');
      
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle special characters', async () => {
      const result = await suggestAltTextContextual('image@2x.png');
      
      expect(result).toBeDefined();
    });

    it('should return default for invalid input', async () => {
      const result = await suggestAltTextContextual('...');
      
      expect(result).toBe('Image');
    });
  });
});
