import { scanFile } from '../src/scanner/htmlScanner';
import { writeFileSync, unlinkSync } from 'fs';

const sample = `<!doctype html><html><body><img src="images/photo.jpg"></body></html>`;
const tmp = 'test-sample.html';

describe('htmlScanner', () => {
  beforeAll(() => writeFileSync(tmp, sample, 'utf8'));
  afterAll(() => { try { unlinkSync(tmp) } catch {} });
  test('detects missing alt', () => {
    const issues = scanFile(tmp);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].rule).toBe('img-alt-missing');
  });
});
