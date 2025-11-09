# Architecture

This document describes the high-level architecture of AI Code Copilot.

## Overview

AI Code Copilot is built as a modular CLI tool with clear separation of concerns:

```
┌─────────────┐
│     CLI     │  Command-line interface (yargs)
└──────┬──────┘
       │
┌──────▼──────────────────────────────────┐
│           Handlers Layer                │  Orchestration
│  • scan  • preview-fix  • apply-fix     │
│  • verify  • quality                    │
└──────┬──────────────────────────────────┘
       │
┌──────▼──────────┬──────────┬────────────┐
│    Scanner      │  Patcher │  Analyzer  │  Core modules
│  • HTML         │  • AST   │  • Quality │
│  • TSX/JSX      │  • Diff  │  • Metrics │
│  • CSS          │  • Patch │  • Report  │
└─────────────────┴──────────┴────────────┘
       │
┌──────▼──────────────────────────────────┐
│           Utilities Layer               │  Support functions
│  • Logger  • Cache  • Formatters        │
│  • Redact  • Prompts  • File I/O        │
└─────────────────────────────────────────┘
```

## Core Components

### 1. CLI Layer (`src/cli.ts`)

Entry point for the application. Uses yargs to parse commands and route to appropriate handlers.

**Commands:**
- `scan` - Scan files for issues
- `preview-fix` - Preview suggested fixes
- `apply-fix` - Apply fixes to files
- `verify` - Compare before/after metrics
- `quality` - Generate code quality reports

### 2. Handlers (`src/cli/handlers.ts`)

Orchestrates the core modules to fulfill CLI commands. Each handler:
- Validates input
- Calls appropriate core modules
- Formats and outputs results
- Handles errors gracefully

### 3. Scanner Module (`src/scanner/`)

Scans files for issues across multiple dimensions:

**Scanners:**
- **HTML Scanner** - Accessibility, SEO, semantic HTML
- **TSX/JSX Scanner** - React/TypeScript component analysis
- **CSS Scanner** - Performance, best practices

**Features:**
- Multi-threaded scanning
- Caching for performance
- Incremental updates
- Progress tracking

### 4. Patcher Module (`src/patcher/`)

Generates and applies patches to fix detected issues:

**Components:**
- **AST Patcher** - Safe AST-based modifications
- **Patch Generator** - Creates unified diffs
- **Diff Engine** - Compares before/after states

**Safety Features:**
- Backup creation
- Dry-run mode
- Rollback capability
- Validation checks

### 5. Analyzer Module (`src/utils/`)

Analyzes code quality and generates metrics:

**Analyzers:**
- **Code Quality Analyzer** - Overall project quality
- **File Analyzer** - Per-file metrics
- **Metrics Calculator** - Score computation
- **Report Generator** - HTML/text reports

**Metrics:**
- Complexity analysis
- Maintainability scores
- Test coverage estimation
- Dependency analysis
- Best practices checks

### 6. Model Service (`src/modelService.ts`)

Abstraction layer for AI model integration:

- **Mock Model** - Development and testing
- **Router** - Routes to appropriate model
- **Interface** - Standardized model API

## Data Flow

### Scan Flow

```
User Input → CLI → Handler → Scanner → Model → Results → Report
                                ↓
                              Cache ← Files
```

### Fix Flow

```
Scan Results → Patcher → AST Manipulation → Diff → Apply → Verification
                            ↓
                        Backup Files
```

### Quality Flow

```
Project Files → Analyzer → File Metrics → Calculator → Scores → Report
                              ↓
                         Complexity, Coverage, Dependencies
```

## Design Principles

### Modularity

Each component has a single responsibility and clear interfaces.

### Extensibility

New scanners, fixers, and models can be added without modifying core logic.

### Safety

All destructive operations create backups and support dry-run mode.

### Performance

Caching, parallel processing, and incremental updates for large codebases.

### Testability

Dependency injection, mocking support, and comprehensive test coverage.

## File Structure

```
src/
├── cli.ts                  # Entry point
├── cli/
│   └── handlers.ts         # Command handlers
├── scanner/
│   ├── index.ts           # Main scanner
│   ├── htmlScanner.ts     # HTML-specific
│   ├── tsxScanner.ts      # TSX/JSX-specific
│   └── cssScanner.ts      # CSS-specific
├── patcher/
│   ├── astPatcher.ts      # AST manipulation
│   ├── patchGenerator.ts  # Patch creation
│   └── __init__.ts        # Module exports
├── model/
│   ├── mockModel.ts       # Mock implementation
│   └── modelRouter.ts     # Model routing
├── utils/
│   ├── codeQualityAnalyzer.ts
│   ├── fileAnalyzer.ts
│   ├── metricsCalculator.ts
│   ├── qualityReporter.ts
│   ├── logger.ts
│   ├── cache.ts
│   └── ...
└── types.ts               # Type definitions
```

## Extension Points

### Adding a New Scanner

1. Create scanner in `src/scanner/`
2. Implement scanner interface
3. Register in main scanner
4. Add tests in `test/`

### Adding a New Model

1. Create model in `src/model/`
2. Implement model interface
3. Register in model router
4. Configure in `modelService.ts`

### Adding a New Metric

1. Add type to `qualityMetricsTypes.ts`
2. Implement calculation in `metricsCalculator.ts`
3. Update reporter in `qualityReporter.ts`
4. Add tests

## Performance Considerations

- **Caching**: Results cached in `.scan-cache/`
- **Parallel Processing**: Multi-file scanning uses worker threads
- **Incremental Updates**: Only scan changed files
- **Memory Management**: Stream processing for large files

## Security

- **Secret Redaction**: Automatic redaction of sensitive data
- **Input Validation**: All user input validated
- **Safe File Operations**: Backup and validation before writes
- **No External Calls**: Mock model for POC

## Next Steps

- Review [API Reference](./api-reference.md)
- Read [Development Guide](./development-guide.md)
- See [Contributing](./contributing.md)
