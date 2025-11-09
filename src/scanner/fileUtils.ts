import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

export const SUPPORTED_EXTENSIONS = ['.html', '.htm', '.tsx', '.jsx', '.css', '.ts', '.js'];

export const SAMPLE_FOLDERS = [
  'react_components',
  'stylesheets',
  'web_components'
];

export function isSupportedFile(filePath: string): boolean {
  return SUPPORTED_EXTENSIONS.some(ext => filePath.endsWith(ext));
}

export function getFilesFromSampleFolders(basePath: string): string[] {
  const files: string[] = [];
  const sampleInputPath = path.join(basePath, 'sample_input');
  
  if (!fs.existsSync(sampleInputPath)) {
    logger.warning(`sample_input directory not found at ${sampleInputPath}`);
    return files;
  }
  
  for (const folder of SAMPLE_FOLDERS) {
    const folderPath = path.join(sampleInputPath, folder);
    
    if (fs.existsSync(folderPath)) {
      const folderFiles = fs.readdirSync(folderPath);
      
      for (const file of folderFiles) {
        const fullPath = path.join(folderPath, file);
        
        if (fs.statSync(fullPath).isFile() && isSupportedFile(fullPath)) {
          files.push(fullPath);
        }
      }
    } else {
      logger.warning(`Folder not found: ${folderPath}`);
    }
  }
  
  return files;
}

export function walkDir(dir: string): string[] {
  const out: string[] = [];
  
  try {
    const entries = fs.readdirSync(dir);
    
    for (const e of entries) {
      const full = path.join(dir, e);
      const stat = fs.statSync(full);
      
      if (stat.isDirectory()) {
        out.push(...walkDir(full));
      } else if (isSupportedFile(full)) {
        out.push(full);
      }
    }
  } catch (err) {
    // Ignore directories that can't be read
  }
  
  return out;
}
