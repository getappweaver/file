---
direct_hash: 44d778b7d7de49a6686ff0aeed868bfcf729289f5a12f0ed85b356e47c1386b7
subtree_hash: 06a6c5f20a1bd75c3df628c415d97d02f15095482c4d37bb33624dd650c4f3ea
files:
  stylesheet.ts: bc29c0aa910c127fa60a41571309e81f31d1ef8e3d28f03ea4a1b3573d1a9ca8
  web.ts: 8217b73be5486e4f1a2c17c3107d44cf6e5fe9263007ee0063ff1ea77220573e
children:
---

# commands/diff/renderers

## Purpose
WebUI renderers for diff command plugin output. Defines styles and renders diff results as WebNodeRoot with color-coded lines for additions, deletions, and context.

## Files
- `stylesheet.ts` - WebStyleSheet with scoped CSS for diff blocks, line headers, hunk markers, and colored diff lines (green add/remove/red context)
- `web.ts` - renderFileDiffWeb function producing WebNodeRoot for FileDiffOk/err results, includes navigation action to parent directory

## Notes
- Styled with CSS variables supporting dark/light theme
- Handles errors, truncated, and binary file states
- Provides Back to folder navigation action
