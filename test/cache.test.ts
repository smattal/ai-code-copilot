import { ScanCache } from '../src/utils/cache';
import * as fs from 'fs';
import * as path from 'path';

describe('ScanCache', () => {
  let cache: ScanCache;
  const cacheDir = path.join(__dirname, '.test-cache');

  beforeEach(() => {
    cache = new ScanCache(30 * 60 * 1000, 1000, 24 * 60 * 60 * 1000, cacheDir);
  });

  afterEach(() => {
    if (fs.existsSync(cacheDir)) {
      fs.rmSync(cacheDir, { recursive: true, force: true });
    }
  });

  describe('get', () => {
    it('should return undefined for missing entries', async () => {
      const result = await cache.get('nonexistent content');
      expect(result).toBeUndefined();
    });

    it('should return cached result if valid', async () => {
      const content = 'const x = 1;';
      const mockResult = { 
        fileName: 'test.ts', 
        fileType: 'TS', 
        isValid: true, 
        issues: [], 
        aiSuggestedPatches: [], 
        rationale: 'test' 
      };
      
      await cache.set(content, mockResult);
      const result = await cache.get(content);

      expect(result).toBeDefined();
      expect(result?.fileName).toBe('test.ts');
    });
  });

  describe('set', () => {
    it('should store result in cache', async () => {
      const content = 'const x = 1;';
      const mockResult = { 
        fileName: 'test.ts', 
        fileType: 'TS', 
        isValid: true, 
        issues: [], 
        aiSuggestedPatches: [], 
        rationale: 'test' 
      };
      
      await cache.set(content, mockResult);
      const result = await cache.get(content);
      
      expect(result).toBeDefined();
    });
  });

  describe('clear', () => {
    it('should remove all cached entries', async () => {
      const content = 'const x = 1;';
      const mockResult = { 
        fileName: 'test.ts', 
        fileType: 'TS', 
        isValid: true, 
        issues: [], 
        aiSuggestedPatches: [], 
        rationale: 'test' 
      };
      
      await cache.set(content, mockResult);
      cache.clear();

      const result = await cache.get(content);
      expect(result).toBeUndefined();
    });
  });

  describe('getMetadata', () => {
    it('should return cache statistics', () => {
      const metadata = cache.getMetadata();

      expect(metadata).toHaveProperty('hits');
      expect(metadata).toHaveProperty('misses');
      expect(metadata.hits).toBeGreaterThanOrEqual(0);
      expect(metadata.misses).toBeGreaterThanOrEqual(0);
    });
  });
});
