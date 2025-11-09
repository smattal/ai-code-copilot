import { previewFixForFile, applyFixForFile } from '../src/patcher/patchGenerator';
import * as fs from 'fs';
import * as path from 'path';

describe('Patch Generator', () => {
  const testDir = path.join(__dirname, 'fixtures', 'patcher');

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

  describe('previewFixForFile', () => {
    it('should generate preview for HTML files', async () => {
      const htmlFile = path.join(testDir, 'preview.html');
      fs.writeFileSync(htmlFile, '<html><body><img src="test.jpg"></body></html>');

      const preview = await previewFixForFile(htmlFile);

      expect(preview).toBeDefined();
      expect(typeof preview).toBe('string');
      expect(preview.length).toBeGreaterThan(0);
    });

    it('should generate preview for TSX files', async () => {
      const tsxFile = path.join(testDir, 'preview.tsx');
      fs.writeFileSync(tsxFile, 'export const Component = () => <img src="test.jpg" />');

      const preview = await previewFixForFile(tsxFile);

      expect(preview).toBeDefined();
      expect(typeof preview).toBe('string');
    });

    it('should handle files with no issues', async () => {
      const htmlFile = path.join(testDir, 'valid.html');
      fs.writeFileSync(htmlFile, '<html lang="en"><body><img src="test.jpg" alt="Test"></body></html>');

      const preview = await previewFixForFile(htmlFile);

      expect(preview).toBeDefined();
    });

    it('should handle CSS files', async () => {
      const cssFile = path.join(testDir, 'test.css');
      fs.writeFileSync(cssFile, '.button { background: #3498db; }');

      const preview = await previewFixForFile(cssFile);

      expect(preview).toBeDefined();
    });

    it('should handle non-existent files gracefully', async () => {
      const nonExistent = path.join(testDir, 'nonexistent.html');

      await expect(previewFixForFile(nonExistent)).resolves.toBeDefined();
    });
  });

  describe('applyFixForFile', () => {
    it('should create patch file for HTML', async () => {
      const htmlFile = path.join(testDir, 'apply.html');
      fs.writeFileSync(htmlFile, '<html><body><img src="test.jpg"></body></html>');

      await applyFixForFile(htmlFile);

      const patchFile = htmlFile + '.patch';
      expect(fs.existsSync(patchFile)).toBe(true);
    });

    it('should create patch file for TSX', async () => {
      const tsxFile = path.join(testDir, 'apply.tsx');
      fs.writeFileSync(tsxFile, 'export const Component = () => <img src="test.jpg" />');

      await applyFixForFile(tsxFile);

      const patchFile = tsxFile + '.patch';
      expect(fs.existsSync(patchFile)).toBe(true);
    });

    it('should handle CSS files', async () => {
      const cssFile = path.join(testDir, 'apply.css');
      fs.writeFileSync(cssFile, '.text { color: #aaa; background: #fff; }');

      await applyFixForFile(cssFile);

      const patchFile = cssFile + '.patch';
      expect(fs.existsSync(patchFile)).toBe(true);
    });

    it('should overwrite existing patch files', async () => {
      const htmlFile = path.join(testDir, 'overwrite.html');
      const patchFile = htmlFile + '.patch';
      
      fs.writeFileSync(htmlFile, '<html><body><img src="test.jpg"></body></html>');
      fs.writeFileSync(patchFile, 'old patch content');

      await applyFixForFile(htmlFile);

      expect(fs.existsSync(patchFile)).toBe(true);
      const content = fs.readFileSync(patchFile, 'utf-8');
      expect(content).not.toBe('old patch content');
    });
  });
});
