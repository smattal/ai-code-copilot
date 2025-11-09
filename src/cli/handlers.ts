import { scanAndReport } from '../scanner/index';
import { previewFixForFile, applyFixForFile } from '../patcher/patchGenerator';
import { InteractivePrompts } from '../utils/prompts';
import { redactSecretsInObject } from '../utils/redact';
import { generateHTMLReport } from '../utils/htmlReportGenerator';
import { calculateMetrics, compareMetrics, formatComparisonSummary, generateComparisonHTML } from '../utils/verificationLoop';
import { CodeQualityAnalyzer } from '../utils/codeQualityAnalyzer';
import { generateCodeQualityReport, generateCodeQualityHTML } from '../utils/qualityReporter';
import { logger } from '../utils/logger';
import { exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

interface ScanArgs {
  path: string;
  out?: string;
  html?: string;
  open: boolean;
}

interface PreviewFixArgs {
  file: string;
  interactive: boolean;
  viewport?: string;
  locale?: string;
  colorScheme?: string;
  a11yLevel?: string;
}

interface ApplyFixArgs {
  file: string;
}

interface VerifyArgs {
  path: string;
  before?: string;
  after?: string;
  html?: string;
  open: boolean;
}

interface QualityArgs {
  path: string;
  html?: string;
  json?: string;
  open: boolean;
}

function openInBrowser(filePath: string): void {
  const absolutePath = path.resolve(filePath);
  const command = process.platform === 'win32' ? 'start' : 
                 process.platform === 'darwin' ? 'open' : 'xdg-open';
  
  exec(`${command} "${absolutePath}"`, (error) => {
    if (error) {
      logger.error(`Could not open browser: ${error.message}`);
      logger.info(`Please manually open: ${absolutePath}`);
    } else {
      logger.success('Report opened in browser');
    }
  });
}

function saveScanResults(results: any, outputPath: string | undefined): void {
  if (outputPath) {
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf8');
    logger.success(`Consolidated report written to: ${outputPath}`);
  }
}

function generateAndOpenHTMLReport(results: any, htmlPath: string, shouldOpen: boolean): void {
  generateHTMLReport(results, htmlPath);
  
  if (shouldOpen) {
    openInBrowser(htmlPath);
  }
}

export async function handleScan(args: ScanArgs): Promise<void> {
  const results = await scanAndReport(args.path);
  const redactedResults = redactSecretsInObject(results);
  
  saveScanResults(redactedResults, args.out);
  
  if (args.html) {
    generateAndOpenHTMLReport(redactedResults, args.html, args.open);
  }
  
  if (!args.out && !args.html) {
    logger.json(redactedResults);
  }
}

export async function handlePreviewFix(args: PreviewFixArgs): Promise<void> {
  const prompts = InteractivePrompts.getInstance();
  
  if (!args.interactive && (args.viewport || args.locale || args.colorScheme || args.a11yLevel)) {
    await prompts.gatherRequiredContext([]);
    if (args.viewport) await prompts.promptForViewport(args.viewport);
    if (args.locale) await prompts.promptForLocale(args.locale);
    if (args.colorScheme) await prompts.promptForColorScheme();
    if (args.a11yLevel) await prompts.promptForA11yLevel();
  }
  
  const patch = await previewFixForFile(args.file);
  logger.info(patch);
  prompts.clearContext();
}

export async function handleApplyFix(args: ApplyFixArgs): Promise<void> {
  const out = await applyFixForFile(args.file);
  logger.success(`Patch written to: ${out}`);
}

async function loadScanResults(args: VerifyArgs): Promise<{ before: any; after: any } | null> {
  if (args.before && args.after) {
    logger.info('Loading scan results...');
    const before = JSON.parse(fs.readFileSync(args.before, 'utf8'));
    const after = JSON.parse(fs.readFileSync(args.after, 'utf8'));
    return { before, after };
  }
  
  logger.info('Running initial scan (BEFORE)...');
  const beforeResults = await scanAndReport(args.path);
  
  const beforePath = 'scan-before.json';
  fs.writeFileSync(beforePath, JSON.stringify(beforeResults, null, 2), 'utf8');
  logger.success(`Before scan saved to: ${beforePath}`);
  
  logger.warning('Please apply the suggested fixes to your files.');
  logger.info('   Then run: npm start verify -- --before scan-before.json --after <path-to-after-scan.json>');
  logger.info('   Or manually run another scan after applying fixes.\n');
  return null;
}

function generateAndSaveComparisonReport(comparison: any, htmlPath: string, shouldOpen: boolean): void {
  const htmlContent = generateComparisonHTML(comparison);
  fs.writeFileSync(htmlPath, htmlContent, 'utf8');
  logger.success(`HTML comparison report generated: ${htmlPath}`);

  if (shouldOpen) {
    openInBrowser(htmlPath);
  }
}

export async function handleVerify(args: VerifyArgs): Promise<void> {
  const results = await loadScanResults(args);
  if (!results) return;

  logger.info('Calculating improvements...');
  const beforeMetrics = calculateMetrics(results.before);
  const afterMetrics = calculateMetrics(results.after);
  const comparison = compareMetrics(beforeMetrics, afterMetrics);

  logger.info(formatComparisonSummary(comparison));

  if (args.html) {
    generateAndSaveComparisonReport(comparison, args.html, args.open);
  }
}

function saveQualityMetrics(metrics: any, jsonPath: string | undefined): void {
  const defaultJsonPath = jsonPath || 'code-quality-metrics.json';
  fs.writeFileSync(defaultJsonPath, JSON.stringify(metrics, null, 2), 'utf8');
  if (jsonPath) {
    logger.success(`Metrics saved to: ${jsonPath}`);
  }
}

function generateAndSaveQualityReport(metrics: any, htmlPath: string, shouldOpen: boolean): void {
  const htmlContent = generateCodeQualityHTML(metrics);
  fs.writeFileSync(htmlPath, htmlContent, 'utf8');
  logger.success(`HTML report generated: ${htmlPath}`);

  if (shouldOpen) {
    openInBrowser(htmlPath);
  }
}

export async function handleQuality(args: QualityArgs): Promise<void> {
  logger.info('Analyzing code quality...\n');
  
  const analyzer = new CodeQualityAnalyzer(args.path);
  const metrics = await analyzer.analyze();

  logger.info(generateCodeQualityReport(metrics));

  saveQualityMetrics(metrics, args.json);

  if (args.html) {
    generateAndSaveQualityReport(metrics, args.html, args.open);
  }
}
