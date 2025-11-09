import fs from 'fs';
import path from 'path';
import { scanFile as scanHtmlFile } from './htmlScanner';
import { scanFile as scanTsxFile } from './tsxScanner';
import { scanFile as scanCssFile } from './cssScanner';
import { modelRouter } from '../modelService';
import { ScanCache } from '../utils/cache';

export type ConsolidatedIssue = { category: string; description: string; severity: 'low'|'medium'|'high' };
export type AiPatch = { diff: string; rationale: string };
export type ConsolidatedResult = {
  fileName: string;
  fileType: string;
  isValid: boolean;
  issues: ConsolidatedIssue[];
  aiSuggestedPatches: AiPatch[];
  rationale?: string;
};

function toSeverity(s: 'info'|'warning'|'error') {
  if (s === 'error') return 'high';
  if (s === 'warning') return 'medium';
  return 'low';
}

function mapIssues(_file: string, _type: string, issues: Array<any>) {
  const mapped: ConsolidatedIssue[] = issues.map((i: any) => ({
    category: i.rule?.startsWith('img') ? 'accessibility' : i.rule?.startsWith('seo') ? 'seo' : i.rule?.startsWith('design') ? 'design' : 'structure',
    description: i.message || i.description || i.rule || 'Issue detected',
    severity: toSeverity(i.severity || 'warning'),
  }));
  return mapped;
}

// Create a singleton cache instance
const scanCache = new ScanCache();

// Specific folders to scan within sample_input
const SAMPLE_FOLDERS = [
  'react_components',
  'stylesheets',
  'web_components'
];

function getFilesFromSampleFolders(basePath: string): string[] {
  const files: string[] = [];
  const sampleInputPath = path.join(basePath, 'sample_input');
  
  // Check if sample_input directory exists
  if (!fs.existsSync(sampleInputPath)) {
    console.warn(`sample_input directory not found at ${sampleInputPath}`);
    return files;
  }
  
  for (const folder of SAMPLE_FOLDERS) {
    const folderPath = path.join(sampleInputPath, folder);
    
    if (fs.existsSync(folderPath)) {
      const folderFiles = fs.readdirSync(folderPath);
      
      for (const file of folderFiles) {
        const fullPath = path.join(folderPath, file);
        
        // Check if it's a file (not a directory) and has a supported extension
        if (fs.statSync(fullPath).isFile()) {
          if (fullPath.endsWith('.html') || fullPath.endsWith('.htm') || 
              fullPath.endsWith('.tsx') || fullPath.endsWith('.jsx') || 
              fullPath.endsWith('.css') || fullPath.endsWith('.ts') || 
              fullPath.endsWith('.js')) {
            files.push(fullPath);
          }
        }
      }
    } else {
      console.warn(`Folder not found: ${folderPath}`);
    }
  }
  
  return files;
}

export async function scanAndReport(rootDir: string): Promise<ConsolidatedResult[]> {
  const results: ConsolidatedResult[] = [];
  
  // Use the new function to get files from specific sample_input folders
  const files = getFilesFromSampleFolders(rootDir);
  
  for (const f of files) {
    const rel = path.relative(rootDir, f).replace(/\\/g, '/');
    try {
      // Read file content
      const content = fs.readFileSync(f, 'utf8');
      
      // Try to get cached result
      const cachedResult = await scanCache.get(content);
      if (cachedResult) {
        // Update file name in cached result
        const result = { ...cachedResult, fileName: rel };
        results.push(result);
        continue;
      }

      let result: ConsolidatedResult;
      
      if (f.endsWith('.html') || f.endsWith('.htm')) {
        const issues = scanHtmlFile(f);
        const mapped = mapIssues(rel, 'HTML', issues);
        const patches: AiPatch[] = issues.map((iss: any) => ({ diff: `Suggested fix: ${iss.rule}`, rationale: iss.suggestion || 'Auto-suggested improvement.' }));
        result = { fileName: rel, fileType: 'HTML', isValid: mapped.every(m=>m.severity!=='high'), issues: mapped, aiSuggestedPatches: patches, rationale: 'Automatically generated test case for evaluator pipelines.' };
      } else if (f.endsWith('.tsx') || f.endsWith('.jsx') || f.endsWith('.ts') || f.endsWith('.js')) {
        const issues = scanTsxFile(f);
        const mapped = mapIssues(rel, 'TSX', issues);
        const patches: AiPatch[] = issues.map((iss: any) => ({ diff: iss.fix || `Suggested fix: ${iss.rule}`, rationale: iss.rationale || 'Auto-suggested improvement.' }));
        result = { fileName: rel, fileType: 'TSX', isValid: mapped.every(m=>m.severity!=='high'), issues: mapped, aiSuggestedPatches: patches, rationale: 'Automatically generated React component test case.' };
      } else if (f.endsWith('.css')) {
        const issues = scanCssFile(f);
        const mapped = mapIssues(rel, 'CSS', issues);
        const patches: AiPatch[] = issues.map((iss: any) => ({ diff: iss.fix || `Suggested fix: ${iss.rule}`, rationale: iss.rationale || 'Auto-suggested improvement.' }));
        result = { fileName: rel, fileType: 'CSS', isValid: mapped.every(m=>m.severity!=='high'), issues: mapped, aiSuggestedPatches: patches, rationale: 'Automatically generated CSS test case.' };
      } else {
        continue;
      }

      // Cache the result
      scanCache.set(content, result);
      results.push(result);
    } catch (err) {
      // skip unreadable files
    }
  }

  // Log cache statistics
  const stats = scanCache.getMetadata();
  console.log(`Cache stats - Hits: ${stats.hits}, Misses: ${stats.misses}, Time saved: ${Math.round(stats.saved_time_ms / 1000)}s`);
  
  return results;
}

function walkDir(dir: string) {
  const out: string[] = [];
  const entries = fs.readdirSync(dir);
  for (const e of entries) {
    const full = path.join(dir, e);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      out.push(...walkDir(full));
    } else {
      if (full.endsWith('.html') || full.endsWith('.htm') || full.endsWith('.tsx') || full.endsWith('.jsx') || full.endsWith('.css') || full.endsWith('.ts') || full.endsWith('.js')) {
        out.push(full);
      }
    }
  }
  return out;
}