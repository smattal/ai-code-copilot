# Development Guide

This guide provides information for developers who want to contribute to or extend AI Code Copilot.

## Development Setup

### Prerequisites

- Node.js 14 or higher
- npm or yarn
- Git
- TypeScript knowledge
- Familiarity with AST manipulation (for patcher development)

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/smattal/ai-code-copilot.git
cd ai-code-copilot

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

## Project Structure

```
ai-code-copilot/
├── src/                  # Source code
│   ├── cli.ts           # CLI entry point
│   ├── cli/             # Command handlers
│   ├── scanner/         # File scanners
│   ├── patcher/         # Patch generation
│   ├── model/           # Model integration
│   ├── utils/           # Utilities
│   └── types.ts         # Type definitions
├── test/                # Test files
├── sample_input/        # Sample files for testing
├── docs/                # Documentation
├── coverage/            # Test coverage reports
├── dist/                # Compiled output
└── .scan-cache/         # Scanner cache
```

## Building

### Development Build

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` directory.

### Watch Mode

For continuous development:

```bash
npx tsc --watch
```

## Testing

### Run All Tests

```bash
npm test
```

### Run Specific Test

```bash
npm test -- test/scanner.test.ts
```

### Run with Coverage

```bash
npm test -- --coverage
```

Coverage reports are generated in `coverage/`.

### Test Structure

Tests follow this naming convention:
- `*.test.ts` - Unit tests
- `*.integration.test.ts` - Integration tests
- `*.e2e.test.ts` - End-to-end tests

### Writing Tests

```typescript
import { scanAndReport } from '../src/scanner/index';

describe('Scanner', () => {
  it('should detect missing alt attributes', async () => {
    const results = await scanAndReport('./sample_input');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].issues).toContainEqual(
      expect.objectContaining({
        type: 'accessibility',
        message: expect.stringContaining('alt')
      })
    );
  });
});
```

## Code Style

### TypeScript

- Use TypeScript strict mode
- Prefer interfaces over types
- Use explicit return types for public APIs
- Document public interfaces with JSDoc

### Formatting

- Use 2 spaces for indentation
- Use single quotes for strings
- Add trailing commas in multiline structures
- Max line length: 120 characters

### Naming Conventions

- **Files**: camelCase (e.g., `htmlScanner.ts`)
- **Classes**: PascalCase (e.g., `CodeQualityAnalyzer`)
- **Functions**: camelCase (e.g., `scanAndReport`)
- **Interfaces**: PascalCase (e.g., `ScanResult`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_COMPLEXITY`)

## Adding New Features

### Adding a New Scanner

1. **Create the scanner file** in `src/scanner/`:

```typescript
// src/scanner/newScanner.ts
export interface NewScanResult {
  issues: Issue[];
}

export function scanNew(content: string, filePath: string): NewScanResult {
  const issues: Issue[] = [];
  // Implement scanning logic
  return { issues };
}
```

2. **Integrate into main scanner** in `src/scanner/index.ts`:

```typescript
import { scanNew } from './newScanner';

// Add to scanFile function
if (fileType === 'new') {
  const result = scanNew(content, filePath);
  issues.push(...result.issues);
}
```

3. **Write tests** in `test/newScanner.test.ts`:

```typescript
import { scanNew } from '../src/scanner/newScanner';

describe('newScanner', () => {
  it('should detect issues', () => {
    const result = scanNew('<content>', 'test.new');
    expect(result.issues.length).toBeGreaterThan(0);
  });
});
```

### Adding a New Metric

1. **Define the type** in `src/utils/qualityMetricsTypes.ts`:

```typescript
export interface NewMetrics {
  score: number;
  details: string[];
}
```

2. **Add to CodeQualityMetrics**:

```typescript
export interface CodeQualityMetrics {
  // ...existing metrics
  newMetrics: NewMetrics;
}
```

3. **Implement calculation** in `src/utils/metricsCalculator.ts`:

```typescript
calculateNewMetrics(files: FileMetrics[]): NewMetrics {
  // Implementation
  return {
    score: 85,
    details: []
  };
}
```

4. **Update analyzer** in `src/utils/codeQualityAnalyzer.ts`:

```typescript
const newMetrics = this.metricsCalculator.calculateNewMetrics(fileMetrics);

return {
  // ...existing metrics
  newMetrics
};
```

5. **Update reports** in `src/utils/qualityReporter.ts`:

```typescript
// Add to text report
lines.push(`New Metrics: ${metrics.newMetrics.score}/100`);

// Add to HTML report
// Add new card generation function
```

### Adding a New Command

1. **Add command definition** in `src/cli.ts`:

```typescript
.command('newcommand', 'Description', (y) => {
  return y.option('option', { 
    type: 'string', 
    describe: 'Option description' 
  });
}, async (args) => {
  await handleNewCommand({
    option: String(args.option)
  });
})
```

2. **Create handler** in `src/cli/handlers.ts`:

```typescript
interface NewCommandArgs {
  option: string;
}

export async function handleNewCommand(args: NewCommandArgs): Promise<void> {
  logger.info('Running new command...');
  // Implementation
}
```

3. **Write tests** in `test/handlers.test.ts`

## Debugging

### VS Code Launch Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug CLI",
      "program": "${workspaceFolder}/dist/cli.js",
      "args": ["scan", "--path", "."],
      "preLaunchTask": "npm: build",
      "outFiles": ["${workspaceFolder}/dist/**/*.js"]
    }
  ]
}
```

### Logging

Use the logger for debugging:

```typescript
import { logger } from './utils/logger';

logger.debug('Debug information:', { data });
logger.info('Progress update');
logger.error('Error occurred:', error);
```

## Performance Optimization

### Caching

Use the cache utility for expensive operations:

```typescript
import { getCache, setCache } from './utils/cache';

const cacheKey = `scan:${filePath}:${fileHash}`;
const cached = getCache(cacheKey);

if (cached) {
  return cached;
}

const result = expensiveOperation();
setCache(cacheKey, result);
return result;
```

### Parallel Processing

For large-scale operations, use parallel processing:

```typescript
const results = await Promise.all(
  files.map(file => scanFile(file))
);
```

## Common Tasks

### Adding a Dependency

```bash
# Production dependency
npm install <package>

# Development dependency
npm install --save-dev <package>

# Update types if needed
npm install --save-dev @types/<package>
```

### Updating Documentation

After making changes:

1. Update relevant `.md` files in `docs/`
2. Update JSDoc comments in code
3. Update README.md if needed
4. Regenerate API docs if applicable

### Creating a Release

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Run full test suite
4. Build project
5. Create git tag
6. Push to repository

## Troubleshooting

### Build Errors

- Clear `dist/` and rebuild: `rm -rf dist && npm run build`
- Check TypeScript version: `npx tsc --version`
- Verify tsconfig.json settings

### Test Failures

- Clear cache: `rm -rf .scan-cache`
- Run single test: `npm test -- test/specific.test.ts`
- Check test fixtures in `test/fixtures/`

### Performance Issues

- Profile with Node.js: `node --prof dist/cli.js scan`
- Check cache hits/misses
- Review file I/O patterns
- Consider parallel processing

## Best Practices

1. **Always write tests** for new features
2. **Update documentation** alongside code changes
3. **Use TypeScript types** strictly
4. **Handle errors gracefully** with proper logging
5. **Cache expensive operations** appropriately
6. **Keep functions small** and focused
7. **Write clear commit messages**
8. **Review your own PRs** before requesting review

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [AST Explorer](https://astexplorer.net/)
- [Babel Documentation](https://babeljs.io/docs/)

## Getting Help

- Check existing issues on GitHub
- Review documentation in `docs/`
- Ask questions in discussions
- Contact maintainers

## Next Steps

- Review [Architecture](./architecture.md)
- Check [API Reference](./api-reference.md)
- Read [Contributing](./contributing.md)
