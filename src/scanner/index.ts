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
  
  for (const f of files) {
    const rel = path.relative(rootDir, f).replace(/\\/g, '/');
    
    try {
      const content = fs.readFileSync(f, 'utf8');
      
      // Try to get cached result
      const cachedResult = await scanCache.get(content);
      if (cachedResult) {
        results.push({ ...cachedResult, fileName: rel });
        continue;
      }

      // Process the file
      const result = processFile(f, rel);
      if (result) {
        scanCache.set(content, result);
        results.push(result);
      }
    } catch (err) {
      // Skip unreadable files
    }
  }

  // Log cache statistics
  const stats = scanCache.getMetadata();
  logger.debug(`Cache stats - Hits: ${stats.hits}, Misses: ${stats.misses}, Time saved: ${Math.round(stats.saved_time_ms / 1000)}s`);
  
  return results;
}