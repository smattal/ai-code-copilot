# AI Code Copilot (proof-of-concept)

A local, modular CLI that scans web project files (HTML/JSX/TSX/CSS) for accessibility, SEO, security, and performance issues and generates minimal patch suggestions.

This repo contains a focused proof-of-concept implementation that:
- Scans HTML files for missing `alt` attributes on `<img>` tags.
- Generates a unified diff patch to add suggested alt text (using a mock model).

Quickstart (Windows PowerShell):

```powershell
cd "c:\Users\joshi\OneDrive\Documents\AI\ai-code-copilot"
npm install
npm run build
# Run scanner on a directory (prints JSON report)
node dist/cli.js scan --path .
# Preview a suggested fix for a file
node dist/cli.js preview-fix --file sample/site/index.html
# Apply suggested fixes (creates a local patch file)
node dist/cli.js apply-fix --file sample/site/index.html
```

Notes:
- LLM integration is mocked. Instructions for plugging a real model are in `docs/` (not yet implemented).
- Designed for local execution and medium-sized projects (<= 200 files).

License: MIT

npm run build; $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"; node dist/cli.js scan --path sample_input --out "consolidated_results_$timestamp.json"
