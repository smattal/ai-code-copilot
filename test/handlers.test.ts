import { handleScan, handlePreviewFix, handleApplyFix, handleVerify, handleQuality } from '../src/cli/handlers';
import * as fs from 'fs';
import * as path from 'path';

// Mock the dependencies
jest.mock('../src/scanner/index');
jest.mock('../src/patcher/patchGenerator');
jest.mock('../src/utils/prompts');
jest.mock('../src/utils/redact');
jest.mock('../src/utils/htmlReportGenerator');
jest.mock('../src/utils/verificationLoop');
jest.mock('../src/utils/codeQualityAnalyzer');
jest.mock('../src/utils/qualityReporter');

describe('CLI Handlers', () => {
  const testRoot = path.join(__dirname, 'fixtures', 'cli-handlers');

  beforeAll(() => {
    if (!fs.existsSync(testRoot)) {
      fs.mkdirSync(testRoot, { recursive: true });
    }
  });

  afterAll(() => {
    const fixturesDir = path.join(__dirname, 'fixtures');
    if (fs.existsSync(fixturesDir)) {
      fs.rmSync(fixturesDir, { recursive: true, force: true });
    }
  });

  describe('handleScan', () => {
    it('should scan files and generate output', async () => {
      const { scanAndReport } = require('../src/scanner/index');
      const { redactSecretsInObject } = require('../src/utils/redact');
      
      scanAndReport.mockResolvedValue([]);
      redactSecretsInObject.mockReturnValue([]);

      await handleScan({ path: testRoot, open: false });

      expect(scanAndReport).toHaveBeenCalledWith(testRoot);
    });

    it('should write JSON output when specified', async () => {
      const { scanAndReport } = require('../src/scanner/index');
      const { redactSecretsInObject } = require('../src/utils/redact');
      
      const mockResults = [{ fileName: 'test.html', issues: [] }];
      scanAndReport.mockResolvedValue(mockResults);
      redactSecretsInObject.mockReturnValue(mockResults);

      const outFile = path.join(testRoot, 'output.json');
      await handleScan({ path: testRoot, out: outFile, open: false });

      expect(fs.existsSync(outFile)).toBe(true);
      if (fs.existsSync(outFile)) {
        fs.unlinkSync(outFile);
      }
    });

    it('should generate HTML report when specified', async () => {
      const { scanAndReport } = require('../src/scanner/index');
      const { redactSecretsInObject } = require('../src/utils/redact');
      const { generateHTMLReport } = require('../src/utils/htmlReportGenerator');
      
      scanAndReport.mockResolvedValue([]);
      redactSecretsInObject.mockReturnValue([]);

      await handleScan({ path: testRoot, html: 'report.html', open: false });

      expect(generateHTMLReport).toHaveBeenCalled();
    });
  });

  describe('handlePreviewFix', () => {
    it('should preview fix for file', async () => {
      const { previewFixForFile } = require('../src/patcher/patchGenerator');
      const { InteractivePrompts } = require('../src/utils/prompts');
      
      const mockPrompts = {
        gatherRequiredContext: jest.fn(),
        promptForViewport: jest.fn(),
        clearContext: jest.fn()
      };
      
      InteractivePrompts.getInstance = jest.fn().mockReturnValue(mockPrompts);
      previewFixForFile.mockResolvedValue('patch content');

      await handlePreviewFix({
        file: 'test.html',
        interactive: false,
        viewport: 'desktop'
      });

      expect(previewFixForFile).toHaveBeenCalledWith('test.html');
    });
  });

  describe('handleApplyFix', () => {
    it('should apply fix to file', async () => {
      const { applyFixForFile } = require('../src/patcher/patchGenerator');
      
      applyFixForFile.mockResolvedValue('test.html.patch');

      await handleApplyFix({ file: 'test.html' });

      expect(applyFixForFile).toHaveBeenCalledWith('test.html');
    });
  });

  describe('handleVerify', () => {
    it('should verify improvements', async () => {
      const { calculateMetrics, compareMetrics } = require('../src/utils/verificationLoop');
      
      const mockMetrics = {
        totalIssues: 10,
        highSeverity: 5,
        mediumSeverity: 3,
        lowSeverity: 2,
        categories: {}
      };
      
      calculateMetrics.mockReturnValue(mockMetrics);
      compareMetrics.mockReturnValue({
        before: mockMetrics,
        after: mockMetrics,
        improvement: {}
      });

      // Create mock before/after files
      const beforeFile = path.join(testRoot, 'before.json');
      const afterFile = path.join(testRoot, 'after.json');
      
      fs.writeFileSync(beforeFile, JSON.stringify([]));
      fs.writeFileSync(afterFile, JSON.stringify([]));

      await handleVerify({
        path: testRoot,
        before: beforeFile,
        after: afterFile,
        open: false
      });

      expect(calculateMetrics).toHaveBeenCalled();
    });
  });

  describe('handleQuality', () => {
    it('should analyze code quality', async () => {
      const { CodeQualityAnalyzer } = require('../src/utils/codeQualityAnalyzer');
      const { generateCodeQualityReport } = require('../src/utils/qualityReporter');
      
      const mockMetrics = {
        project: { totalFiles: 10 },
        overallScore: 85,
        grade: 'A'
      };
      
      const mockAnalyzer = {
        analyze: jest.fn().mockResolvedValue(mockMetrics)
      };
      
      CodeQualityAnalyzer.mockImplementation(() => mockAnalyzer);
      generateCodeQualityReport.mockReturnValue('Quality Report');

      await handleQuality({ path: testRoot, open: false });

      expect(mockAnalyzer.analyze).toHaveBeenCalled();
      expect(generateCodeQualityReport).toHaveBeenCalledWith(mockMetrics);
    });

    it('should save JSON metrics when specified', async () => {
      const { CodeQualityAnalyzer } = require('../src/utils/codeQualityAnalyzer');
      
      const mockMetrics = {
        project: { totalFiles: 10 },
        overallScore: 85,
        grade: 'A'
      };
      
      const mockAnalyzer = {
        analyze: jest.fn().mockResolvedValue(mockMetrics)
      };
      
      CodeQualityAnalyzer.mockImplementation(() => mockAnalyzer);

      const jsonFile = path.join(testRoot, 'metrics.json');
      await handleQuality({ path: testRoot, json: jsonFile, open: false });

      expect(fs.existsSync(jsonFile)).toBe(true);
      if (fs.existsSync(jsonFile)) {
        const content = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
        expect(content.overallScore).toBe(85);
      }
    });
  });
});
