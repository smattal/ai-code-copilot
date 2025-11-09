#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { handleScan, handlePreviewFix, handleApplyFix, handleVerify, handleQuality } from './cli/handlers';

const argv = yargs(hideBin(process.argv))
  .command('scan', 'Scan a path for issues and optionally write consolidated JSON', (y) => {
    return y.option('path', { type: 'string', default: '.', describe: 'Directory to scan' })
      .option('out', { type: 'string', describe: 'Write consolidated JSON to this file' })
      .option('html', { type: 'string', describe: 'Generate HTML report at this path' })
      .option('open', { type: 'boolean', default: false, describe: 'Automatically open HTML report in browser' });
  }, async (args) => {
    await handleScan({
      path: String(args.path),
      out: args.out ? String(args.out) : undefined,
      html: args.html ? String(args.html) : undefined,
      open: Boolean(args.open)
    });
  })
  .command('preview-fix', 'Show a suggested patch for a file', (y) => {
    return y.option('file', { type: 'string', demandOption: true })
            .option('interactive', { type: 'boolean', default: true, description: 'Enable interactive prompts for context' })
            .option('viewport', { type: 'string', choices: ['desktop', 'tablet', 'mobile', 'responsive'] })
            .option('locale', { type: 'string' })
            .option('colorScheme', { type: 'string', choices: ['light', 'dark', 'both'] })
            .option('a11yLevel', { type: 'string', choices: ['A', 'AA', 'AAA'] });
  }, async (args) => {
    await handlePreviewFix({
      file: String(args.file),
      interactive: Boolean(args.interactive),
      viewport: args.viewport ? String(args.viewport) : undefined,
      locale: args.locale ? String(args.locale) : undefined,
      colorScheme: args.colorScheme ? String(args.colorScheme) : undefined,
      a11yLevel: args.a11yLevel ? String(args.a11yLevel) : undefined
    });
  })
  .command('apply-fix', 'Apply suggested fix to a file (writes .patch file)', (y) => {
    return y.option('file', { type: 'string', demandOption: true });
  }, async (args) => {
    await handleApplyFix({ file: String(args.file) });
  })
  .command('verify', 'Apply fixes and verify improvements with before/after comparison', (y) => {
    return y.option('path', { type: 'string', default: '.', describe: 'Directory to scan' })
      .option('before', { type: 'string', describe: 'Path to before scan results JSON' })
      .option('after', { type: 'string', describe: 'Path to after scan results JSON' })
      .option('html', { type: 'string', describe: 'Generate HTML comparison report' })
      .option('open', { type: 'boolean', default: false, describe: 'Automatically open HTML report' });
  }, async (args) => {
    await handleVerify({
      path: String(args.path),
      before: args.before ? String(args.before) : undefined,
      after: args.after ? String(args.after) : undefined,
      html: args.html ? String(args.html) : undefined,
      open: Boolean(args.open)
    });
  })
  .command('quality', 'Generate comprehensive code quality report', (y) => {
    return y.option('path', { type: 'string', default: '.', describe: 'Project root directory' })
      .option('html', { type: 'string', describe: 'Generate HTML report at this path' })
      .option('json', { type: 'string', describe: 'Save metrics as JSON' })
      .option('open', { type: 'boolean', default: false, describe: 'Automatically open HTML report' });
  }, async (args) => {
    await handleQuality({
      path: String(args.path),
      html: args.html ? String(args.html) : undefined,
      json: args.json ? String(args.json) : undefined,
      open: Boolean(args.open)
    });
  })
  .demandCommand(1)
  .help()
  .argv;
