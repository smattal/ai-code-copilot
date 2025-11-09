import fs from 'fs';
import path from 'path';
import { scanFile as scanHtmlFile } from './htmlScanner';
import { scanFile as scanTsxFile } from './tsxScanner';
import { scanFile as scanCssFile } from './cssScanner';
import { ScanCache } from '../utils/cache';
import { logger } from '../utils/logger';
import { getFilesFromSampleFolders } from './fileUtils';
import { mapIssues, createPatches } from './issueMapper';
import { ConsolidatedResult } from './types';

export type { ConsolidatedIssue, AiPatch, ConsolidatedResult } from './types';

const scanCache = new ScanCache();

function processHtmlFile(filePath: string, relativePath: string): ConsolidatedResult {
  const issues = scanHtmlFile(filePath);
  const mapped = mapIssues(relativePath, 'HTML', issues);
  const patches = createPatches(issues);
  
  return {
    fileName: relativePath,
    fileType: 'HTML',
    isValid: mapped.every(m => m.severity !== 'high'),
    issues: mapped,
    aiSuggestedPatches: patches,
    rationale: 'Automatically generated test case for evaluator pipelines.'
  };
}

function processTsxFile(filePath: string, relativePath: string): ConsolidatedResult {
  const issues = scanTsxFile(filePath);
  const mapped = mapIssues(relativePath, 'TSX', issues);
  const patches = createPatches(issues);
  
  return {
    fileName: relativePath,
    fileType: 'TSX',
    isValid: mapped.every(m => m.severity !== 'high'),
    issues: mapped,
    aiSuggestedPatches: patches,
    rationale: 'Automatically generated React component test case.'
  };
}

function processCssFile(filePath: string, relativePath: string): ConsolidatedResult {
  const issues = scanCssFile(filePath);
  const mapped = mapIssues(relativePath, 'CSS', issues);
  const patches = createPatches(issues);
  
  return {
    fileName: relativePath,
    fileType: 'CSS',
    isValid: mapped.every(m => m.severity !== 'high'),
    issues: mapped,
    aiSuggestedPatches: patches,
    rationale: 'Automatically generated CSS test case.'
  };
}

function processFile(filePath: string, relativePath: string): ConsolidatedResult | null {
  if (filePath.endsWith('.html') || filePath.endsWith('.htm')) {
    return processHtmlFile(filePath, relativePath);
  } else if (filePath.endsWith('.tsx') || filePath.endsWith('.jsx') || 
             filePath.endsWith('.ts') || filePath.endsWith('.js')) {
    return processTsxFile(filePath, relativePath);
  } else if (filePath.endsWith('.css')) {
    return processCssFile(filePath, relativePath);
  }
  
  return null;
}

export async function scanAndReport(rootDir: string): Promise<ConsolidatedResult[]> {
  const results: ConsolidatedResult[] = [];
  const files = getFilesFromSampleFolders(rootDir);
  
  // Performance and progress tracking
  const totalFiles = files.length;
  logger.info(`📊 Found ${totalFiles} files to scan`);
  
  // Memory monitoring
  const startMemory = process.memoryUsage().heapUsed / 1024 / 1024;
  const MEMORY_WARNING_THRESHOLD_MB = 500;
  
  let processedCount = 0;
  let cachedCount = 0;
  
  // Process files in batches to optimize memory usage
  const BATCH_SIZE = 50;
  
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, Math.min(i + BATCH_SIZE, files.length));
    
    for (const f of batch) {
      const rel = path.relative(rootDir, f).replace(/\\/g, '/');
      
      try {
        const content = fs.readFileSync(f, 'utf8');
        
        // Try to get cached result
        const cachedResult = await scanCache.get(content);
        if (cachedResult) {
          results.push({ ...cachedResult, fileName: rel });
          cachedCount++;
          processedCount++;
          continue;
        }

        // Process the file
        const result = processFile(f, rel);
        if (result) {
          scanCache.set(content, result);
          results.push(result);
        }
        processedCount++;
      } catch (err) {
        // Skip unreadable files
        processedCount++;
      }
      
      // Show progress every 10 files or at the end
      if (processedCount % 10 === 0 || processedCount === totalFiles) {
        const percentage = Math.round((processedCount / totalFiles) * 100);
        process.stdout.write(`\r⏳ Progress: ${processedCount}/${totalFiles} (${percentage}%) - ${cachedCount} cached`);
      }
    }
    
    // Memory monitoring and cleanup between batches
    const currentMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    if (currentMemory > MEMORY_WARNING_THRESHOLD_MB) {
      process.stdout.write('\r' + ' '.repeat(80) + '\r');
      logger.warning(`⚠️  High memory usage: ${currentMemory.toFixed(2)}MB. Triggering cleanup...`);
      
      if (global.gc) {
        global.gc();
        const afterGC = process.memoryUsage().heapUsed / 1024 / 1024;
        logger.info(`✅ Memory after cleanup: ${afterGC.toFixed(2)}MB`);
      } else {
        logger.info('💡 Run with --expose-gc flag for better memory management');
      }
    }
    
    // Natural garbage collection opportunity between batches
    if (i + BATCH_SIZE < files.length) {
      await new Promise(resolve => setImmediate(resolve));
    }
  }
  
  // Clear progress line and show final stats
  if (totalFiles > 0) {
    process.stdout.write('\r' + ' '.repeat(80) + '\r');
    const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    const memoryDelta = (endMemory - startMemory).toFixed(2);
    logger.info(`📈 Memory used: ${memoryDelta}MB (start: ${startMemory.toFixed(2)}MB, end: ${endMemory.toFixed(2)}MB)`);
  }

  // Log cache statistics
  const stats = scanCache.getMetadata();
  logger.debug(`Cache stats - Hits: ${stats.hits}, Misses: ${stats.misses}, Time saved: ${Math.round(stats.saved_time_ms / 1000)}s`);
  
  return results;
}