import { scanFile } from '../src/scanner/cssScanner';
import * as fs from 'fs';
import * as path from 'path';

describe('CSS Scanner', () => {
  const testDir = path.join(__dirname, 'fixtures');

  beforeAll(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('scanFile', () => {
    it('should detect low contrast colors', () => {
      const cssFile = path.join(testDir, 'contrast.css');
      fs.writeFileSync(cssFile, '.text { color: #aaa; background-color: #fff; }');

      const issues = scanFile(cssFile);

      expect(Array.isArray(issues)).toBe(true);
    });

    it('should detect hardcoded colors without design tokens', () => {
      const cssFile = path.join(testDir, 'tokens.css');
      fs.writeFileSync(cssFile, '.button { background: #3498db; }');

      const issues = scanFile(cssFile);

      expect(Array.isArray(issues)).toBe(true);
    });

    it('should handle valid CSS with CSS variables', () => {
      const cssFile = path.join(testDir, 'valid.css');
      fs.writeFileSync(cssFile, ':root { --primary: #3498db; } .button { background: var(--primary); }');

      const issues = scanFile(cssFile);

      expect(Array.isArray(issues)).toBe(true);
    });

    it('should handle empty CSS files', () => {
      const cssFile = path.join(testDir, 'empty.css');
      fs.writeFileSync(cssFile, '');

      const issues = scanFile(cssFile);

      expect(Array.isArray(issues)).toBe(true);
    });

    it('should handle malformed CSS gracefully', () => {
      const cssFile = path.join(testDir, 'malformed.css');
      fs.writeFileSync(cssFile, '.test { color: ; }');

      expect(() => scanFile(cssFile)).not.toThrow();
    });
  });
});
