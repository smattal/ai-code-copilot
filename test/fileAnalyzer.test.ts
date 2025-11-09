import { FileAnalyzer } from '../src/utils/fileAnalyzer';
import * as path from 'path';

describe('FileAnalyzer', () => {
  let analyzer: FileAnalyzer;
  const testRoot = path.resolve(__dirname, '..');

  beforeEach(() => {
    analyzer = new FileAnalyzer(testRoot);
  });

  describe('getAllSourceFiles', () => {
    it('should find TypeScript files', () => {
      const files = analyzer.getAllSourceFiles();
      const tsFiles = files.filter(f => f.endsWith('.ts'));
      expect(tsFiles.length).toBeGreaterThan(0);
    });

    it('should exclude node_modules', () => {
      const files = analyzer.getAllSourceFiles();
      const nodeModuleFiles = files.filter(f => f.includes('node_modules'));
      expect(nodeModuleFiles.length).toBe(0);
    });

    it('should exclude dist directory', () => {
      const files = analyzer.getAllSourceFiles();
      const distFiles = files.filter(f => f.includes('dist'));
      expect(distFiles.length).toBe(0);
    });

    it('should include supported file types', () => {
      const files = analyzer.getAllSourceFiles();
      const validExtensions = ['.ts', '.tsx', '.js', '.jsx', '.html', '.css'];
      
      for (const file of files) {
        const ext = path.extname(file);
        expect(validExtensions).toContain(ext);
      }
    });
  });

  describe('analyzeFiles', () => {
    it('should analyze multiple files', () => {
      const testFiles = [
        path.join(testRoot, 'src', 'cli.ts'),
        path.join(testRoot, 'src', 'index.ts')
      ].filter(require('fs').existsSync);

      if (testFiles.length > 0) {
        const metrics = analyzer.analyzeFiles(testFiles);
        expect(metrics.length).toBeGreaterThan(0);
        expect(metrics[0]).toHaveProperty('filePath');
        expect(metrics[0]).toHaveProperty('lines');
        expect(metrics[0]).toHaveProperty('complexity');
      }
    });

    it('should calculate file metrics', () => {
      const files = analyzer.getAllSourceFiles();
      if (files.length > 0) {
        const metrics = analyzer.analyzeFiles([files[0]]);
        expect(metrics[0].lines).toBeGreaterThan(0);
        expect(metrics[0].complexity).toBeGreaterThanOrEqual(1);
      }
    });
  });
});
