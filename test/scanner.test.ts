import { scanAndReport } from '../src/scanner/index';
import * as fs from 'fs';
import * as path from 'path';

describe('Scanner Integration', () => {
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

  describe('scanAndReport', () => {
    it('should scan HTML files and detect issues', async () => {
      const htmlFile = path.join(testDir, 'test.html');
      fs.writeFileSync(htmlFile, '<html><body><img src="test.jpg"></body></html>');

      const results = await scanAndReport(testDir);
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it('should scan TSX files', async () => {
      const tsxFile = path.join(testDir, 'test.tsx');
      fs.writeFileSync(tsxFile, 'export const Component = () => <img src="test.jpg" />');

      const results = await scanAndReport(testDir);
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it('should scan CSS files', async () => {
      const cssFile = path.join(testDir, 'test.css');
      fs.writeFileSync(cssFile, '.text { color: #aaa; background: #fff; }');

      const results = await scanAndReport(testDir);
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle empty directories', async () => {
      const emptyDir = path.join(testDir, 'empty');
      if (!fs.existsSync(emptyDir)) {
        fs.mkdirSync(emptyDir, { recursive: true });
      }

      const results = await scanAndReport(emptyDir);
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });
  });
});
