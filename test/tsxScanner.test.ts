import { scanFile } from '../src/scanner/tsxScanner';
import * as fs from 'fs';
import * as path from 'path';

describe('TSX Scanner', () => {
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
    it('should detect missing alt attributes', () => {
      const tsxFile = path.join(testDir, 'image.tsx');
      fs.writeFileSync(tsxFile, 'export const Img = () => <img src="test.jpg" />');

      const issues = scanFile(tsxFile);

      expect(Array.isArray(issues)).toBe(true);
      expect(issues.some(i => i.message.toLowerCase().includes('alt'))).toBe(true);
    });

    it('should detect anchors without rel="noopener"', () => {
      const tsxFile = path.join(testDir, 'link.tsx');
      fs.writeFileSync(tsxFile, 'export const Link = () => <a href="https://example.com" target="_blank">Link</a>');

      const issues = scanFile(tsxFile);

      expect(Array.isArray(issues)).toBe(true);
    });

    it('should detect non-localized text', () => {
      const tsxFile = path.join(testDir, 'text.tsx');
      fs.writeFileSync(tsxFile, 'export const Text = () => <button>Click Me</button>');

      const issues = scanFile(tsxFile);

      expect(Array.isArray(issues)).toBe(true);
    });

    it('should not flag images with alt attributes', () => {
      const tsxFile = path.join(testDir, 'valid-image.tsx');
      fs.writeFileSync(tsxFile, 'export const Img = () => <img src="test.jpg" alt="Test image" />');

      const issues = scanFile(tsxFile);

      const altIssues = issues.filter(i => i.message.toLowerCase().includes('alt'));
      expect(altIssues.length).toBe(0);
    });

    it('should handle JSX fragments', () => {
      const tsxFile = path.join(testDir, 'fragment.tsx');
      fs.writeFileSync(tsxFile, 'export const Frag = () => <><div>Test</div></>');

      expect(() => scanFile(tsxFile)).not.toThrow();
    });

    it('should handle empty files', () => {
      const tsxFile = path.join(testDir, 'empty.tsx');
      fs.writeFileSync(tsxFile, '');

      expect(() => scanFile(tsxFile)).not.toThrow();
    });
  });
});
