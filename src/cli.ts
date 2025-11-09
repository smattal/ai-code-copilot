#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { scanAndReport } from './scanner/index';
import { previewFixForFile, applyFixForFile } from './patcher/patchGenerator';
import { InteractivePrompts } from './utils/prompts';
import { redactSecretsInObject } from './utils/redact';
import { generateHTMLReport } from './utils/htmlReportGenerator';
import { calculateMetrics, compareMetrics, formatComparisonSummary, generateComparisonHTML } from './utils/verificationLoop';
import { CodeQualityAnalyzer, generateCodeQualityReport, generateCodeQualityHTML } from './utils/codeQualityReport';
import { exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

const argv = yargs(hideBin(process.argv))
  .command('scan', 'Scan a path for issues and optionally write consolidated JSON', (y) => {
    return y.option('path', { type: 'string', default: '.', describe: 'Directory to scan' })
      .option('out', { type: 'string', describe: 'Write consolidated JSON to this file' })
      .option('html', { type: 'string', describe: 'Generate HTML report at this path' })
      .option('open', { type: 'boolean', default: false, describe: 'Automatically open HTML report in browser' });
  }, async (args) => {
    const out = args.out ? String(args.out) : undefined;
    const html = args.html ? String(args.html) : undefined;
    const results = await scanAndReport(String(args.path));
    // Redact any sensitive information before output
    const redactedResults = redactSecretsInObject(results);
    
    if (out) {
      const fs = await import('fs');
      fs.writeFileSync(out, JSON.stringify(redactedResults, null, 2), 'utf8');
      console.log('Wrote consolidated report to', out);
    }
    
    if (html) {
      generateHTMLReport(redactedResults, html);
      
      // Automatically open in browser if --open flag is set
      if (args.open) {
        const absolutePath = path.resolve(html);
        const command = process.platform === 'win32' ? 'start' : 
                       process.platform === 'darwin' ? 'open' : 'xdg-open';
        exec(`${command} "${absolutePath}"`, (error) => {
          if (error) {
            console.error('Could not open browser:', error.message);
            console.log(`Please manually open: ${absolutePath}`);
          } else {
            console.log('✅ Report opened in browser');
          }
        });
      }
    }
    
    if (!out && !html) {
      console.log(JSON.stringify(redactedResults, null, 2));
    }
  })
  .command('preview-fix', 'Show a suggested patch for a file', (y) => {
    return y.option('file', { type: 'string', demandOption: true })
            .option('interactive', { type: 'boolean', default: true, description: 'Enable interactive prompts for context' })
            .option('viewport', { type: 'string', choices: ['desktop', 'tablet', 'mobile', 'responsive'] })
            .option('locale', { type: 'string' })
            .option('colorScheme', { type: 'string', choices: ['light', 'dark', 'both'] })
            .option('a11yLevel', { type: 'string', choices: ['A', 'AA', 'AAA'] });
  }, async (args) => {
    const prompts = InteractivePrompts.getInstance();
    // Use CLI arguments or interactive prompts based on mode
    if (!args.interactive && (args.viewport || args.locale || args.colorScheme || args.a11yLevel)) {
      const context = await prompts.gatherRequiredContext([]);
      if (args.viewport) await prompts.promptForViewport(String(args.viewport));
      if (args.locale) await prompts.promptForLocale(String(args.locale));
      if (args.colorScheme) await prompts.promptForColorScheme();
      if (args.a11yLevel) await prompts.promptForA11yLevel();
    }
    const patch = await previewFixForFile(String(args.file));
    console.log(patch);
    prompts.clearContext();
  })
  .command('apply-fix', 'Apply suggested fix to a file (writes .patch file)', (y) => {
    return y.option('file', { type: 'string', demandOption: true });
  }, async (args) => {
    const out = await applyFixForFile(String(args.file));
    console.log('Patch written to', out);
  })
  .command('verify', 'Apply fixes and verify improvements with before/after comparison', (y) => {
    return y.option('path', { type: 'string', default: '.', describe: 'Directory to scan' })
      .option('before', { type: 'string', describe: 'Path to before scan results JSON' })
      .option('after', { type: 'string', describe: 'Path to after scan results JSON' })
      .option('html', { type: 'string', describe: 'Generate HTML comparison report' })
      .option('open', { type: 'boolean', default: false, describe: 'Automatically open HTML report' });
  }, async (args) => {
    let beforeResults, afterResults;

    // If before/after files provided, use them
    if (args.before && args.after) {
      console.log('📊 Loading scan results...');
      beforeResults = JSON.parse(fs.readFileSync(String(args.before), 'utf8'));
      afterResults = JSON.parse(fs.readFileSync(String(args.after), 'utf8'));
    } else {
      // Run before scan
      console.log('🔍 Running initial scan (BEFORE)...');
      beforeResults = await scanAndReport(String(args.path));
      
      // Save before results
      const beforePath = 'scan-before.json';
      fs.writeFileSync(beforePath, JSON.stringify(beforeResults, null, 2), 'utf8');
      console.log(`✅ Before scan saved to: ${beforePath}`);
      
      // TODO: In a real implementation, you would:
      // 1. Apply patches automatically or prompt user to apply them
      // 2. Wait for user confirmation
      // For now, we'll just show instructions
      
      console.log('\n⚠️  Please apply the suggested fixes to your files.');
      console.log('   Then run: npm start verify -- --before scan-before.json --after <path-to-after-scan.json>');
      console.log('   Or manually run another scan after applying fixes.\n');
      return;
    }

    // Calculate metrics
    console.log('\n📈 Calculating improvements...');
    const beforeMetrics = calculateMetrics(beforeResults);
    const afterMetrics = calculateMetrics(afterResults);
    const comparison = compareMetrics(beforeMetrics, afterMetrics);

    // Display text summary
    console.log(formatComparisonSummary(comparison));

    // Generate HTML report if requested
    if (args.html) {
      const htmlContent = generateComparisonHTML(comparison);
      fs.writeFileSync(String(args.html), htmlContent, 'utf8');
      console.log(`\n✅ HTML comparison report generated: ${args.html}`);

      if (args.open) {
        const absolutePath = path.resolve(String(args.html));
        const command = process.platform === 'win32' ? 'start' : 
                       process.platform === 'darwin' ? 'open' : 'xdg-open';
        exec(`${command} "${absolutePath}"`, (error) => {
          if (error) {
            console.error('Could not open browser:', error.message);
            console.log(`Please manually open: ${absolutePath}`);
          } else {
            console.log('✅ Report opened in browser');
          }
        });
      }
    }
  })
  .command('quality', 'Generate comprehensive code quality report', (y) => {
    return y.option('path', { type: 'string', default: '.', describe: 'Project root directory' })
      .option('html', { type: 'string', describe: 'Generate HTML report at this path' })
      .option('json', { type: 'string', describe: 'Save metrics as JSON' })
      .option('open', { type: 'boolean', default: false, describe: 'Automatically open HTML report' });
  }, async (args) => {
    console.log('🔍 Analyzing code quality...\n');
    
    const analyzer = new CodeQualityAnalyzer(String(args.path));
    const metrics = await analyzer.analyze();

    // Display text report
    console.log(generateCodeQualityReport(metrics));

    // Save JSON if requested
    if (args.json) {
      fs.writeFileSync(String(args.json), JSON.stringify(metrics, null, 2), 'utf8');
      console.log(`\n✅ Metrics saved to: ${args.json}`);
    }

    // Generate HTML report if requested
    if (args.html) {
      const htmlContent = generateCodeQualityHTML(metrics);
      fs.writeFileSync(String(args.html), htmlContent, 'utf8');
      console.log(`\n✅ HTML report generated: ${args.html}`);

      if (args.open) {
        const absolutePath = path.resolve(String(args.html));
        const command = process.platform === 'win32' ? 'start' : 
                       process.platform === 'darwin' ? 'open' : 'xdg-open';
        exec(`${command} "${absolutePath}"`, (error) => {
          if (error) {
            console.error('Could not open browser:', error.message);
            console.log(`Please manually open: ${absolutePath}`);
          } else {
            console.log('✅ Report opened in browser');
          }
        });
      }
    }
  })
  .demandCommand(1)
  .help()
  .argv;
