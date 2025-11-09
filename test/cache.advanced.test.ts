import { ScanCache } from '../src/utils/cache';
import * as fs from 'fs';
import * as path from 'path';

describe('ScanCache - Advanced', () => {
  let cache: ScanCache;
  const cacheDir = path.join(__dirname, '.test-cache-advanced');

  beforeEach(() => {
    cache = new ScanCache(5000, 10, 10000, cacheDir); // Short TTLs for testing
  });

  afterEach(() => {
    if (fs.existsSync(cacheDir)) {
      fs.rmSync(cacheDir, { recursive: true, force: true });
    }
  });

  describe('Memory cache behavior', () => {
    it('should prioritize memory cache over disk', async () => {
      const content = 'const x = 1;';
      const result1 = {
        fileName: 'test.ts',
        fileType: 'TS',
        isValid: true,
        issues: [],
        aiSuggestedPatches: [],
        rationale: 'memory'
      };

      await cache.set(content, result1);
      
      const retrieved = await cache.get(content);
      expect(retrieved?.rationale).toBe('memory');
    });

    it('should handle memory cache eviction', async () => {
      const smallCache = new ScanCache(5000, 3, 10000, cacheDir); // Max 3 entries

      // Add more entries than the limit
      for (let i = 0; i < 5; i++) {
        await smallCache.set(`content${i}`, {
          fileName: `file${i}.ts`,
          fileType: 'TS',
          isValid: true,
          issues: [],
          aiSuggestedPatches: [],
          rationale: `test${i}`
        });
      }

      // All entries should still be accessible (from disk if not in memory)
      const result = await smallCache.get('content4');
      expect(result).toBeDefined();
    });

    it('should track access count', async () => {
      const content = 'const x = 1;';
      const result = {
        fileName: 'test.ts',
        fileType: 'TS',
        isValid: true,
        issues: [],
        aiSuggestedPatches: [],
        rationale: 'test'
      };

      await cache.set(content, result);
      
      // Access multiple times
      await cache.get(content);
      await cache.get(content);
      await cache.get(content);

      const metadata = cache.getMetadata();
      expect(metadata.hits).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Disk cache behavior', () => {
    it('should persist to disk', async () => {
      const content = 'const y = 2;';
      const result = {
        fileName: 'test2.ts',
        fileType: 'TS',
        isValid: true,
        issues: [],
        aiSuggestedPatches: [],
        rationale: 'disk'
      };

      await cache.set(content, result);

      // Create new cache instance to test disk persistence
      const newCache = new ScanCache(5000, 10, 10000, cacheDir);
      const retrieved = await newCache.get(content);

      expect(retrieved).toBeDefined();
      expect(retrieved?.fileName).toBe('test2.ts');
    });

    it('should create cache directory if missing', async () => {
      const newDir = path.join(__dirname, '.test-cache-new');
      
      if (fs.existsSync(newDir)) {
        fs.rmSync(newDir, { recursive: true, force: true });
      }

      const newCache = new ScanCache(5000, 10, 10000, newDir);
      
      await newCache.set('test', {
        fileName: 'test.ts',
        fileType: 'TS',
        isValid: true,
        issues: [],
        aiSuggestedPatches: [],
        rationale: 'test'
      });

      expect(fs.existsSync(newDir)).toBe(true);

      if (fs.existsSync(newDir)) {
        fs.rmSync(newDir, { recursive: true, force: true });
      }
    });

    it('should handle disk cache cleanup', async () => {
      const content = 'const z = 3;';
      const result = {
        fileName: 'test3.ts',
        fileType: 'TS',
        isValid: true,
        issues: [],
        aiSuggestedPatches: [],
        rationale: 'cleanup'
      };

      await cache.set(content, result);
      
      // Clear cache
      cache.clear();

      // Should not find the entry
      const retrieved = await cache.get(content);
      expect(retrieved).toBeUndefined();
    });
  });

  describe('Cache statistics', () => {
    it('should track hits and misses', async () => {
      const content1 = 'const a = 1;';
      const content2 = 'const b = 2;';

      await cache.set(content1, {
        fileName: 'a.ts',
        fileType: 'TS',
        isValid: true,
        issues: [],
        aiSuggestedPatches: [],
        rationale: 'test'
      });

      // Hit
      await cache.get(content1);
      
      // Miss
      await cache.get(content2);

      const metadata = cache.getMetadata();
      expect(metadata.hits).toBeGreaterThanOrEqual(1);
      expect(metadata.misses).toBeGreaterThanOrEqual(1);
    });

    it('should track saved time', async () => {
      const content = 'const x = 1;';
      
      await cache.set(content, {
        fileName: 'test.ts',
        fileType: 'TS',
        isValid: true,
        issues: [],
        aiSuggestedPatches: [],
        rationale: 'test'
      });

      await cache.get(content);

      const metadata = cache.getMetadata();
      expect(metadata.saved_time_ms).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Hash consistency', () => {
    it('should use same hash for identical content', async () => {
      const content = 'const x = 1;';
      
      await cache.set(content, {
        fileName: 'test1.ts',
        fileType: 'TS',
        isValid: true,
        issues: [],
        aiSuggestedPatches: [],
        rationale: 'first'
      });

      // Set again with different metadata
      await cache.set(content, {
        fileName: 'test2.ts',
        fileType: 'TS',
        isValid: true,
        issues: [],
        aiSuggestedPatches: [],
        rationale: 'second'
      });

      const result = await cache.get(content);
      expect(result?.rationale).toBe('second');
    });

    it('should use different hash for different content', async () => {
      await cache.set('const x = 1;', {
        fileName: 'test1.ts',
        fileType: 'TS',
        isValid: true,
        issues: [],
        aiSuggestedPatches: [],
        rationale: 'first'
      });

      await cache.set('const y = 2;', {
        fileName: 'test2.ts',
        fileType: 'TS',
        isValid: true,
        issues: [],
        aiSuggestedPatches: [],
        rationale: 'second'
      });

      const result1 = await cache.get('const x = 1;');
      const result2 = await cache.get('const y = 2;');

      expect(result1?.rationale).toBe('first');
      expect(result2?.rationale).toBe('second');
    });
  });

  describe('Edge cases', () => {
    it('should handle very large content', async () => {
      const largeContent = 'x'.repeat(100000);
      
      await cache.set(largeContent, {
        fileName: 'large.ts',
        fileType: 'TS',
        isValid: true,
        issues: [],
        aiSuggestedPatches: [],
        rationale: 'large'
      });

      const result = await cache.get(largeContent);
      expect(result).toBeDefined();
    });

    it('should handle special characters in content', async () => {
      const specialContent = '中文\n\t\r\0特殊字符';
      
      await cache.set(specialContent, {
        fileName: 'special.ts',
        fileType: 'TS',
        isValid: true,
        issues: [],
        aiSuggestedPatches: [],
        rationale: 'special'
      });

      const result = await cache.get(specialContent);
      expect(result).toBeDefined();
    });

    it('should handle empty content', async () => {
      await cache.set('', {
        fileName: 'empty.ts',
        fileType: 'TS',
        isValid: true,
        issues: [],
        aiSuggestedPatches: [],
        rationale: 'empty'
      });

      const result = await cache.get('');
      expect(result).toBeDefined();
    });
  });
});
