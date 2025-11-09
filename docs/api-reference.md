# API Reference

This document provides detailed API reference for the core modules.

## CLI Commands

### scan

Scan files for issues and optionally generate reports.

```bash
node dist/cli.js scan [options]
```

**Options:**
- `--path <dir>` - Directory to scan (default: ".")
- `--out <file>` - Write consolidated JSON to file
- `--html <file>` - Generate HTML report at path
- `--open` - Automatically open HTML report in browser

**Example:**
```bash
node dist/cli.js scan --path ./src --html report.html --open
```

### preview-fix

Preview suggested fixes for a file without applying them.

```bash
node dist/cli.js preview-fix [options]
```

**Options:**
- `--file <path>` - File to preview fixes for (required)

**Example:**
```bash
node dist/cli.js preview-fix --file src/index.html
```

### apply-fix

Apply suggested fixes to a file.

```bash
node dist/cli.js apply-fix [options]
```

**Options:**
- `--file <path>` - File to apply fixes to (required)

**Example:**
```bash
node dist/cli.js apply-fix --file src/index.html
```

### verify

Compare before and after scan results to verify improvements.

```bash
node dist/cli.js verify [options]
```

**Options:**
- `--path <dir>` - Project directory (default: ".")
- `--before <file>` - Before scan JSON file
- `--after <file>` - After scan JSON file
- `--html <file>` - Generate HTML comparison report
- `--open` - Automatically open HTML report

**Example:**
```bash
node dist/cli.js verify --path . --before scan-before.json --after scan-after.json --html verification.html --open
```

### quality

Generate comprehensive code quality report.

```bash
node dist/cli.js quality [options]
```

**Options:**
- `--path <dir>` - Project root directory (default: ".")
- `--html <file>` - Generate HTML report at path
- `--json <file>` - Save metrics as JSON
- `--open` - Automatically open HTML report

**Example:**
```bash
node dist/cli.js quality --path . --html quality.html --json metrics.json --open
```

## Core Modules

### Scanner

Main scanning interface for detecting issues in files.

```typescript
import { scanAndReport } from './scanner/index';

interface ScanResult {
  filePath: string;
  fileType: string;
  issues: Issue[];
  suggestedFixes?: Fix[];
}

interface Issue {
  type: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  line?: number;
  column?: number;
  snippet?: string;
}

async function scanAndReport(
  dirPath: string,
  options?: ScanOptions
): Promise<ScanResult[]>
```

**Example:**
```typescript
const results = await scanAndReport('./src', {
  includeHtml: true,
  includeTsx: true,
  includeCss: true
});
```

### Patcher

Generate and apply patches to fix issues.

```typescript
import { previewFixForFile, applyFixForFile } from './patcher/patchGenerator';

interface PatchResult {
  filePath: string;
  originalContent: string;
  patchedContent: string;
  diff: string;
  applied: boolean;
}

async function previewFixForFile(filePath: string): Promise<PatchResult>

async function applyFixForFile(filePath: string): Promise<PatchResult>
```

**Example:**
```typescript
// Preview
const preview = await previewFixForFile('./src/index.html');
console.log(preview.diff);

// Apply
const result = await applyFixForFile('./src/index.html');
console.log(`Applied: ${result.applied}`);
```

### Code Quality Analyzer

Analyze project code quality and generate metrics.

```typescript
import { CodeQualityAnalyzer, CodeQualityMetrics } from './utils/codeQualityAnalyzer';

class CodeQualityAnalyzer {
  constructor(projectRoot: string)
  
  async analyze(): Promise<CodeQualityMetrics>
}

interface CodeQualityMetrics {
  project: ProjectMetrics;
  files: FileMetrics[];
  codeComplexity: ComplexityMetrics;
  maintainability: MaintainabilityMetrics;
  testCoverage: TestCoverageMetrics;
  dependencies: DependencyMetrics;
  bestPractices: BestPracticesMetrics;
  overallScore: number;
  grade: string;
}
```

**Example:**
```typescript
const analyzer = new CodeQualityAnalyzer('./');
const metrics = await analyzer.analyze();
console.log(`Score: ${metrics.overallScore}/100`);
console.log(`Grade: ${metrics.grade}`);
```

### Report Generators

Generate text and HTML reports from metrics.

```typescript
import { generateCodeQualityReport, generateCodeQualityHTML } from './utils/qualityReporter';

function generateCodeQualityReport(metrics: CodeQualityMetrics): string

function generateCodeQualityHTML(metrics: CodeQualityMetrics): string
```

**Example:**
```typescript
const textReport = generateCodeQualityReport(metrics);
console.log(textReport);

const htmlReport = generateCodeQualityHTML(metrics);
fs.writeFileSync('report.html', htmlReport);
```

### Verification Loop

Compare before and after metrics.

```typescript
import { calculateMetrics, compareMetrics, formatComparisonSummary } from './utils/verificationLoop';

interface MetricsDiff {
  before: ScanMetrics;
  after: ScanMetrics;
  improvements: MetricChange[];
  regressions: MetricChange[];
  unchanged: MetricChange[];
}

async function calculateMetrics(results: ScanResult[]): Promise<ScanMetrics>

function compareMetrics(before: ScanMetrics, after: ScanMetrics): MetricsDiff

function formatComparisonSummary(diff: MetricsDiff): string
```

**Example:**
```typescript
const beforeMetrics = await calculateMetrics(beforeResults);
const afterMetrics = await calculateMetrics(afterResults);
const diff = compareMetrics(beforeMetrics, afterMetrics);
const summary = formatComparisonSummary(diff);
console.log(summary);
```

## Utilities

### Logger

Structured logging with levels.

```typescript
import { logger } from './utils/logger';

logger.info('Information message');
logger.success('Success message');
logger.warn('Warning message');
logger.error('Error message');
logger.debug('Debug message');
```

### Cache

File-based caching for scan results.

```typescript
import { getCache, setCache, clearCache } from './utils/cache';

// Get cached result
const cached = getCache('key');

// Set cache
setCache('key', data, { ttl: 3600 });

// Clear cache
clearCache();
```

### Secret Redaction

Automatic redaction of sensitive data.

```typescript
import { redactSecretsInObject } from './utils/redact';

const redacted = redactSecretsInObject(data);
```

## Type Definitions

All types are exported from respective modules. Key types:

```typescript
// Scanner types
export interface Issue { /* ... */ }
export interface Fix { /* ... */ }
export interface ScanResult { /* ... */ }

// Quality metrics types
export interface CodeQualityMetrics { /* ... */ }
export interface FileMetrics { /* ... */ }
export interface ComplexityMetrics { /* ... */ }

// Verification types
export interface ScanMetrics { /* ... */ }
export interface MetricsDiff { /* ... */ }
```

See individual module files for complete type definitions.

## Error Handling

All async functions throw typed errors:

```typescript
try {
  const results = await scanAndReport('./src');
} catch (error) {
  if (error instanceof ValidationError) {
    logger.error('Validation failed:', error.message);
  } else {
    logger.error('Unexpected error:', error);
  }
}
```

## Next Steps

- Review [Architecture](./architecture.md)
- Read [Development Guide](./development-guide.md)
- See [Getting Started](./getting-started.md)
