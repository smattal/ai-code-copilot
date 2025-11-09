# Getting Started

This guide will help you get started with AI Code Copilot.

## Installation

### Prerequisites

- Node.js 14 or higher
- npm or yarn package manager

### Install Dependencies

```bash
cd c:\ai-code-copilot
npm install
```

### Build the Project

```bash
npm run build
```

## Basic Usage

### Scanning Files

Scan a directory for issues:

```bash
node dist/cli.js scan --path ./your-project
```

Generate an HTML report:

```bash
node dist/cli.js scan --path ./your-project --html report.html --open
```

### Preview Fixes

Preview suggested fixes for a file:

```bash
node dist/cli.js preview-fix --file path/to/file.html
```

### Apply Fixes

Apply suggested fixes to a file:

```bash
node dist/cli.js apply-fix --file path/to/file.html
```

### Code Quality Analysis

Run comprehensive code quality analysis:

```bash
node dist/cli.js quality --path . --html quality-report.html --open
```

### Verification

Compare before and after metrics:

```bash
node dist/cli.js verify --path . --before scan-before.json --after scan-after.json --html verification.html --open
```

## Configuration

The tool works out of the box with sensible defaults. For advanced configuration, see the [Development Guide](./development-guide.md).

## Next Steps

- Learn about the [Architecture](./architecture.md)
- Review the [API Reference](./api-reference.md)
- Read the [Development Guide](./development-guide.md)
- Check out [Contributing](./contributing.md) if you want to contribute
