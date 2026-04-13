---
direct_hash: a26015bb1201ab1348c4b602718527917683980f9837483bb6ecba0ec863f1e4
subtree_hash: 94e1918ef9ece90f18e9f828d5e546d5aa1735ea95814ff7a61ea26638010f70
files:
  adapter.ts: 272b56bd8d8f4eef1bf21f2dba753be4603328dacbaecc1eedcc8c6d4423cae7
  definition.ts: 47b080d086ab5adb54ec5eb48278db0a7651878381ed1977ddb2adea4b4b6c66
  handler.ts: b637194589cd5cd0fd3b5ca5e28f03cef5cf50fa8e65547c89d14f6341d3dc8a
children:
  handlers: 1900e0ea88f85eb2cb835d0628fd050cdf645b876cc8bcb4feb997e499fda3d7
---

# commands/bottomup

## Purpose
CLI command implementation for generating depth-first `__BOTTOMUP.md` documentation files in folder subtrees. Exposes two entrypoints via adapter.ts and handler.ts.

## Files
- `adapter.ts` - CLI adapter - parses args/options and delegates to executeBottomupTool, returns formatted message
- `definition.ts` - Command definition - declares arguments (workingDir), options (depth, scopeRoot, model, ignore, includeHidden, noGitignore), and examples
- `handler.ts` - Main handler - implements executeBottomupTool and executeBottomupContextTool for running the bottomup generation and status queries

## Notes
- Executed as: `dm-bot bottomup [workingDir]`
- Scoped to workspace with optional depth/ignore options
- Context subcommand shows parent/child status for a target directory

## Subdirectories
- `handlers/` - AI summarization, file system filtering, tree building, and doc rendering for bottomup generation
