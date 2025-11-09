# Contributing to AI Code Copilot

Thank you for your interest in contributing to AI Code Copilot! This document provides guidelines for contributing to the project.

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of background or experience level.

### Standards

- Use welcoming and inclusive language
- Be respectful of differing viewpoints
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards other contributors

## How to Contribute

### Reporting Bugs

Before creating a bug report:

1. **Check existing issues** to avoid duplicates
2. **Use the latest version** to ensure the bug still exists
3. **Collect information** about your environment

When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce** the issue
- **Expected vs actual behavior**
- **Environment details** (OS, Node.js version, etc.)
- **Screenshots or logs** if applicable

**Example bug report:**

```markdown
## Bug: Scanner fails on large HTML files

**Description:** Scanner crashes with "heap out of memory" on files > 10MB

**Steps to reproduce:**
1. Run `node dist/cli.js scan --path ./large-files`
2. Include HTML file larger than 10MB
3. Observe crash

**Environment:**
- OS: Windows 11
- Node.js: v20.x
- AI Code Copilot: v0.1.0

**Expected:** Scanner should handle large files
**Actual:** Process crashes with OOM error
```

### Suggesting Features

Feature requests are welcome! Please include:

- **Clear use case** - Why is this needed?
- **Proposed solution** - How should it work?
- **Alternatives considered** - What other approaches did you think about?
- **Additional context** - Any mockups, examples, or references

### Pull Requests

#### Before Starting

1. **Check existing PRs** to avoid duplicate work
2. **Open an issue first** for significant changes
3. **Discuss the approach** with maintainers
4. **Fork the repository** to your account

#### Development Process

1. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our coding standards

3. **Write/update tests**:
   ```bash
   npm test
   ```

4. **Build the project**:
   ```bash
   npm run build
   ```

5. **Run the linter**:
   ```bash
   npm run lint
   ```

6. **Commit your changes** with clear messages:
   ```bash
   git commit -m "feat: add new scanner for JSON files"
   ```

7. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

8. **Open a pull request** on GitHub

#### Pull Request Guidelines

- **One feature per PR** - Keep changes focused
- **Update documentation** - Include relevant docs updates
- **Write tests** - Ensure adequate test coverage
- **Pass CI checks** - All tests and lints must pass
- **Sign commits** - Use signed commits if possible
- **Reference issues** - Link to related issues

**PR Title Format:**

```
<type>: <description>

Examples:
feat: add CSS performance scanner
fix: resolve cache invalidation bug
docs: update API reference for quality analyzer
test: add integration tests for patcher
refactor: simplify file analyzer logic
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `test` - Adding/updating tests
- `refactor` - Code refactoring
- `perf` - Performance improvement
- `chore` - Maintenance tasks

#### PR Description Template

```markdown
## Description
Brief description of changes

## Motivation
Why is this change needed?

## Changes Made
- Change 1
- Change 2
- Change 3

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed

## Documentation
- [ ] Code comments updated
- [ ] API docs updated
- [ ] User guides updated

## Breaking Changes
List any breaking changes and migration notes

## Related Issues
Fixes #123
Relates to #456
```

## Development Guidelines

### Code Style

Follow the style guidelines in the [Development Guide](./development-guide.md):

- Use TypeScript strict mode
- 2 spaces for indentation
- Single quotes for strings
- Explicit return types for public APIs
- JSDoc comments for public interfaces

### Testing Requirements

- **Unit tests** for all new functions
- **Integration tests** for feature workflows
- **Maintain coverage** at 70%+ overall
- **Test edge cases** and error conditions

Example test structure:

```typescript
describe('NewFeature', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  describe('core functionality', () => {
    it('should handle normal case', () => {
      // Test
    });

    it('should handle edge case', () => {
      // Test
    });

    it('should handle errors gracefully', () => {
      // Test error handling
    });
  });
});
```

### Documentation Requirements

- **Code comments** for complex logic
- **JSDoc comments** for public APIs
- **Update user docs** in `docs/`
- **Update README** if needed
- **Include examples** where helpful

### Commit Message Guidelines

Follow conventional commits:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Example:**

```
feat(scanner): add JSON schema validation

Add ability to scan and validate JSON files against schemas.
Includes support for custom schema definitions and detailed
error reporting.

Closes #234
```

## Project Setup for Contributors

### Fork and Clone

```bash
# Fork on GitHub, then:
git clone https://github.com/YOUR_USERNAME/ai-code-copilot.git
cd ai-code-copilot

# Add upstream remote
git remote add upstream https://github.com/smattal/ai-code-copilot.git
```

### Stay Updated

```bash
# Fetch upstream changes
git fetch upstream

# Merge into your main branch
git checkout main
git merge upstream/main
```

### Development Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes, commit frequently
git add .
git commit -m "feat: add feature"

# Keep branch updated
git fetch upstream
git rebase upstream/main

# Push when ready
git push origin feature/my-feature
```

## Review Process

### What to Expect

1. **Initial review** within 2-3 days
2. **Feedback and discussion** on implementation
3. **Requested changes** if needed
4. **Approval** once requirements met
5. **Merge** by maintainer

### Addressing Feedback

- **Be responsive** to review comments
- **Ask questions** if unclear
- **Make requested changes** promptly
- **Discuss alternatives** if you disagree
- **Update the PR** as needed

## Recognition

Contributors are recognized in:

- GitHub contributors page
- Release notes for significant contributions
- Project README (for major features)

## Getting Help

### Resources

- [Getting Started Guide](./getting-started.md)
- [Architecture Documentation](./architecture.md)
- [API Reference](./api-reference.md)
- [Development Guide](./development-guide.md)

### Contact

- **GitHub Issues** - Technical questions
- **GitHub Discussions** - General questions
- **Pull Requests** - Code review questions

## First-Time Contributors

Welcome! Here are some good first issues:

- Documentation improvements
- Test coverage additions
- Bug fixes marked "good first issue"
- Code cleanup and refactoring

### Tips for First PRs

1. Start small - Pick a manageable issue
2. Ask questions - Don't hesitate to ask for help
3. Read existing code - Understand the patterns
4. Test thoroughly - Make sure it works
5. Be patient - Reviews take time

## Types of Contributions

### Code Contributions

- New features
- Bug fixes
- Performance improvements
- Refactoring
- Test improvements

### Non-Code Contributions

- Documentation improvements
- Bug reports
- Feature suggestions
- Code reviews
- Helping other contributors
- Creating examples and tutorials

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (see LICENSE file).

## Thank You!

Your contributions make this project better for everyone. We appreciate your time and effort!

---

Questions? Open an issue or discussion on GitHub.
