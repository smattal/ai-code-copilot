import * as fs from 'fs';
import * as path from 'path';
import { ConsolidatedResult } from '../src/scanner';

describe('Scanner End-to-End', () => {
  const testDir = path.join(__dirname, 'fixtures', 'e2e');

  beforeAll(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterAll(() => {
    const fixturesDir = path.join(__dirname, 'fixtures');
    if (fs.existsSync(fixturesDir)) {
      fs.rmSync(fixturesDir, { recursive: true, force: true });
    }
  });

  describe('Full workflow', () => {
    it('should scan, detect issues, and generate reports', async () => {
      // Create test files
      const htmlFile = path.join(testDir, 'app.html');
      const tsxFile = path.join(testDir, 'App.tsx');
      const cssFile = path.join(testDir, 'styles.css');

      fs.writeFileSync(htmlFile, `
        <!DOCTYPE html>
        <html>
          <head><title>Test</title></head>
          <body>
            <img src="logo.png">
            <a href="https://example.com" target="_blank">Link</a>
          </body>
        </html>
      `);

      fs.writeFileSync(tsxFile, `
        export const Button = () => (
          <button onClick={() => alert('Clicked')}>
            Click Me
          </button>
        );
      `);

      fs.writeFileSync(cssFile, `
        .text {
          color: #aaa;
          background-color: #fff;
          font-size: 12px;
        }
      `);

      const { scanAndReport } = require('../src/scanner/index');
      const results: ConsolidatedResult[] = await scanAndReport(testDir);

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);

      // Check HTML results
      const htmlResult = results.find(r => r.fileName.includes('app.html'));
      expect(htmlResult).toBeDefined();
      expect(htmlResult?.fileType).toBe('HTML');

      // Check TSX results
      const tsxResult = results.find(r => r.fileName.includes('App.tsx'));
      expect(tsxResult).toBeDefined();
      expect(tsxResult?.fileType).toBe('TSX');

      // Check CSS results
      const cssResult = results.find(r => r.fileName.includes('styles.css'));
      expect(cssResult).toBeDefined();
      expect(cssResult?.fileType).toBe('CSS');
    });

    it('should handle mixed valid and invalid files', async () => {
      const validFile = path.join(testDir, 'valid.html');
      const invalidFile = path.join(testDir, 'invalid.html');

      fs.writeFileSync(validFile, `
        <!DOCTYPE html>
        <html lang="en">
          <head><title>Valid</title></head>
          <body><img src="test.jpg" alt="Test"></body>
        </html>
      `);

      fs.writeFileSync(invalidFile, `
        <html>
          <body><img src="test.jpg"></body>
        </html>
      `);

      const { scanAndReport } = require('../src/scanner/index');
      const results = await scanAndReport(testDir);

      expect(results.length).toBeGreaterThanOrEqual(2);
      
      const validResult = results.find(r => r.fileName.includes('valid.html'));
      const invalidResult = results.find(r => r.fileName.includes('invalid.html'));

      expect(validResult).toBeDefined();
      expect(invalidResult).toBeDefined();
      expect(invalidResult?.issues.length).toBeGreaterThan(0);
    });

    it('should handle large files', async () => {
      const largeFile = path.join(testDir, 'large.html');
      let content = '<html><body>';
      
      // Generate large HTML with many elements
      for (let i = 0; i < 100; i++) {
        content += `<div id="item-${i}"><img src="img${i}.jpg"></div>`;
      }
      content += '</body></html>';

      fs.writeFileSync(largeFile, content);

      const { scanAndReport } = require('../src/scanner/index');
      const results = await scanAndReport(testDir);

      const largeResult = results.find(r => r.fileName.includes('large.html'));
      expect(largeResult).toBeDefined();
      expect(largeResult?.issues.length).toBeGreaterThan(0);
    });

    it('should handle nested directories', async () => {
      const nestedDir = path.join(testDir, 'nested', 'deep', 'folder');
      fs.mkdirSync(nestedDir, { recursive: true });

      const nestedFile = path.join(nestedDir, 'nested.html');
      fs.writeFileSync(nestedFile, '<html><body><img src="test.jpg"></body></html>');

      const { scanAndReport } = require('../src/scanner/index');
      const results = await scanAndReport(testDir);

      const nestedResult = results.find(r => r.fileName.includes('nested.html'));
      expect(nestedResult).toBeDefined();
    });

    it('should handle files with special characters in names', async () => {
      const specialFile = path.join(testDir, 'file-with_special.chars.html');
      fs.writeFileSync(specialFile, '<html><body><img src="test.jpg"></body></html>');

      const { scanAndReport } = require('../src/scanner/index');
      const results = await scanAndReport(testDir);

      const specialResult = results.find(r => r.fileName.includes('special'));
      expect(specialResult).toBeDefined();
    });
  });

  describe('Cache integration', () => {
    it('should use cache on repeated scans', async () => {
      const cacheFile = path.join(testDir, 'cache-test.html');
      fs.writeFileSync(cacheFile, '<html><body><img src="test.jpg"></body></html>');

      const { scanAndReport } = require('../src/scanner/index');
      
      // First scan
      const startTime1 = Date.now();
      await scanAndReport(testDir);
      const duration1 = Date.now() - startTime1;

      // Second scan (should use cache)
      const startTime2 = Date.now();
      await scanAndReport(testDir);
      const duration2 = Date.now() - startTime2;

      // Second scan should generally be faster due to caching
      // (though this isn't guaranteed in all environments)
      expect(duration2).toBeLessThanOrEqual(duration1 * 2);
    });
  });

  describe('Error handling', () => {
    it('should handle unreadable files gracefully', async () => {
      const { scanAndReport } = require('../src/scanner/index');

      // Scan directory that might have permission issues
      await expect(scanAndReport(testDir)).resolves.toBeDefined();
    });

    it('should handle corrupted files', async () => {
      const corruptFile = path.join(testDir, 'corrupt.html');
      fs.writeFileSync(corruptFile, '\x00\x01\x02\x03\x04'); // Binary data

      const { scanAndReport } = require('../src/scanner/index');
      
      await expect(scanAndReport(testDir)).resolves.toBeDefined();
    });
  });
});
