import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';
import { ConsolidatedResult } from '../scanner';

interface CacheEntry<T> {
  value: T;
  expiry: number;
  hash: string;
  lastAccessed: number;
  accessCount: number;
}

interface CacheMetadata {
  hits: number;
  misses: number;
  saved_time_ms: number;
}

export class ScanCache {
  private memoryCache: Map<string, CacheEntry<ConsolidatedResult>>;
  private diskCache: Map<string, string>; // Maps content hash to file path
  private metadata: CacheMetadata;
  private cacheDir: string;

  constructor(
    private memoryTtlMs = 30 * 60 * 1000, // 30 minutes memory cache
    private maxMemoryEntries = 1000,
    private diskTtlMs = 24 * 60 * 60 * 1000, // 24 hours disk cache
    cacheDir = '.scan-cache'
  ) {
    this.memoryCache = new Map();
    this.diskCache = new Map();
    this.cacheDir = path.resolve(process.cwd(), cacheDir);
    this.metadata = { hits: 0, misses: 0, saved_time_ms: 0 };
    this.initializeDiskCache();
  }

  private initializeDiskCache() {
    // Create cache directory if it doesn't exist
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }

    // Load existing disk cache entries
    const files = fs.readdirSync(this.cacheDir);
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(this.cacheDir, file);
        const stats = fs.statSync(filePath);
        
        // Clean up expired disk cache entries
        if (Date.now() - stats.mtimeMs > this.diskTtlMs) {
          fs.unlinkSync(filePath);
          continue;
        }

        const hash = file.replace('.json', '');
        this.diskCache.set(hash, filePath);
      }
    }
  }

  private computeHash(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  private warmupCache(content: string, result: ConsolidatedResult) {
    const hash = this.computeHash(content);
    
    // Store in memory cache
    this.memoryCache.set(hash, {
      value: result,
      expiry: Date.now() + this.memoryTtlMs,
      hash,
      lastAccessed: Date.now(),
      accessCount: 0
    });

    // Store in disk cache
    const cachePath = path.join(this.cacheDir, `${hash}.json`);
    fs.writeFileSync(cachePath, JSON.stringify(result), 'utf8');
    this.diskCache.set(hash, cachePath);

    // Prune memory cache if needed
    if (this.memoryCache.size > this.maxMemoryEntries) {
      this.pruneMemoryCache();
    }
  }

  private pruneMemoryCache() {
    // Sort entries by access count and last accessed time
    const entries = Array.from(this.memoryCache.entries())
      .sort(([, a], [, b]) => {
        if (a.accessCount !== b.accessCount) {
          return a.accessCount - b.accessCount;
        }
        return a.lastAccessed - b.lastAccessed;
      });

    // Remove least used entries until we're under the limit
    while (this.memoryCache.size > this.maxMemoryEntries) {
      const [key] = entries.shift()!;
      this.memoryCache.delete(key);
    }
  }

  async get(content: string): Promise<ConsolidatedResult | undefined> {
    const startTime = Date.now();
    const hash = this.computeHash(content);

    // Check memory cache first
    const memoryEntry = this.memoryCache.get(hash);
    if (memoryEntry && Date.now() < memoryEntry.expiry) {
      memoryEntry.lastAccessed = Date.now();
      memoryEntry.accessCount++;
      this.metadata.hits++;
      this.metadata.saved_time_ms += Date.now() - startTime;
      return memoryEntry.value;
    }

    // Check disk cache
    const diskPath = this.diskCache.get(hash);
    if (diskPath && fs.existsSync(diskPath)) {
      const stats = fs.statSync(diskPath);
      if (Date.now() - stats.mtimeMs <= this.diskTtlMs) {
        const result = JSON.parse(fs.readFileSync(diskPath, 'utf8'));
        // Warm up memory cache
        this.memoryCache.set(hash, {
          value: result,
          expiry: Date.now() + this.memoryTtlMs,
          hash,
          lastAccessed: Date.now(),
          accessCount: 1
        });
        this.metadata.hits++;
        this.metadata.saved_time_ms += Date.now() - startTime;
        return result;
      } else {
        // Clean up expired disk cache entry
        fs.unlinkSync(diskPath);
        this.diskCache.delete(hash);
      }
    }

    this.metadata.misses++;
    return undefined;
  }

  set(content: string, result: ConsolidatedResult): void {
    this.warmupCache(content, result);
  }

  getMetadata(): CacheMetadata {
    return { ...this.metadata };
  }

  clear(): void {
    this.memoryCache.clear();
    // Clear disk cache
    for (const [, filePath] of this.diskCache) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    this.diskCache.clear();
    this.metadata = { hits: 0, misses: 0, saved_time_ms: 0 };
  }
}
