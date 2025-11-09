import { generateHTMLReport } from '../src/utils/htmlReportGenerator';
import { ScanResult } from '../src/scanner';
import * as fs from 'fs';
import * as path from 'path';

describe('HTML Report Generator', () => {
  const testDir = path.join(__dirname, 'fixtures', 'reports');
  const outputPath = path.join(testDir, 'report.html');

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

  const mockResults: ScanResult[] = [
    {
      fileName: 'test.html',
      fileType: 'HTML',
      isValid: false,
      issues: [
        { file: 'test.html', rule: 'alt-text', message: 'Missing alt attribute', severity: 'error' },
        { file: 'test.html', rule: 'lang', message: 'Missing lang attribute', severity: 'warning' }
      ],
      aiSuggestedPatches: [
        { original: '<img src="test.jpg">', fixed: '<img src="test.jpg" alt="Test image">' }
      ],
      rationale: 'Accessibility improvements needed'
    },
    {
      fileName: 'test.tsx',
      fileType: 'TSX',
      isValid: true,
      issues: [],
      aiSuggestedPatches: [],
      rationale: 'No issues found'
    }
  ];

  describe('generateHTMLReport', () => {
    it('should generate HTML report file', () => {
      generateHTMLReport(mockResults, outputPath);

      expect(fs.existsSync(outputPath)).toBe(true);
    });

    it('should create valid HTML structure', () => {
      generateHTMLReport(mockResults, outputPath);

      const content = fs.readFileSync(outputPath, 'utf-8');
      
      expect(content).toContain('<!DOCTYPE html>');
      expect(content).toContain('<html');
      expect(content).toContain('</html>');
      expect(content).toContain('<body');
      expect(content).toContain('</body>');
    });

    it('should include scan results', () => {
      generateHTMLReport(mockResults, outputPath);

      const content = fs.readFileSync(outputPath, 'utf-8');
      
      expect(content).toContain('test.html');
      expect(content).toContain('test.tsx');
    });

    it('should display issues', () => {
      generateHTMLReport(mockResults, outputPath);

      const content = fs.readFileSync(outputPath, 'utf-8');
      
      expect(content).toContain('Missing alt attribute');
      expect(content).toContain('Missing lang attribute');
    });

    it('should include AI suggested patches', () => {
      generateHTMLReport(mockResults, outputPath);

      const content = fs.readFileSync(outputPath, 'utf-8');
      
      expect(content).toContain('suggested');
    });

    it('should handle empty results array', () => {
      const emptyPath = path.join(testDir, 'empty-report.html');
      
      expect(() => generateHTMLReport([], emptyPath)).not.toThrow();
      expect(fs.existsSync(emptyPath)).toBe(true);
    });

    it('should create directory if it does not exist', () => {
      const newDir = path.join(testDir, 'nested', 'deep');
      const newPath = path.join(newDir, 'report.html');

      generateHTMLReport(mockResults, newPath);

      expect(fs.existsSync(newPath)).toBe(true);
    });

    it('should overwrite existing report', () => {
      const overwritePath = path.join(testDir, 'overwrite-report.html');
      
      fs.writeFileSync(overwritePath, 'old content');
      generateHTMLReport(mockResults, overwritePath);

      const content = fs.readFileSync(overwritePath, 'utf-8');
      expect(content).not.toBe('old content');
      expect(content).toContain('<!DOCTYPE html>');
    });

    it('should include CSS styling', () => {
      generateHTMLReport(mockResults, outputPath);

      const content = fs.readFileSync(outputPath, 'utf-8');
      
      expect(content).toContain('<style>');
      expect(content).toContain('</style>');
    });

    it('should show file count statistics', () => {
      generateHTMLReport(mockResults, outputPath);

      const content = fs.readFileSync(outputPath, 'utf-8');
      
      expect(content).toContain('2'); // Number of files
    });
  });
});
