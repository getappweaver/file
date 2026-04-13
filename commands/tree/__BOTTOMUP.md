---
direct_hash: 4a8f6d7cd29eb50e481eb22281035cf1d1d9605c44779b14ea457e0dd7c1a4c6
subtree_hash: 8e27e0723b104e52f1feccd145465c614ccdc3c20c1ec4a5c71c923030e7c4ac
files:
  adapter.ts: 9a9d8118e7aaa6c2db41591783df1061ab363082f249a99097398efce363ebb8
  cli.ts: 7e40d5096b421b0ff9b5164d261b0c73b6fad18adbf8a94cd8daf424d2189043
  definition.ts: ccdcc98afde0d70bfa8facd96fe1300353f6b9dcccd8109fe424ecb29c19fde4
  git-status.ts: 3483dd59a164a117bd4006b2b379cbe54c47f876337215a81418197cea6c82bf
  handler.ts: a5eb32657108cc7fe02028db2170d5a752bf686802b824dca3cb9949d9597826
  workspace-tree.ts: 3431d15c4b17841c9bf86721f5f9c6cc40c7d32c35f711d49c0d3f368b8c91e9
children:
  renderers: bec578bef9ded10cf9931fbe1e7740fced2e6142d40adef49f0faba614238300
---

# commands/tree

## Purpose
Tree command implementation for workspace file tree display. Provides both CLI and bot subcommand interfaces with text/tree and git status decoration support.

## Files
- `adapter.ts` - Bot command adapter: parses tree tokens from parsed CLI invocation and delegates to handler for workspace tree output
- `cli.ts` - Standalone CLI entrypoint supporting --dm-bot-workspace flag and -h/--help; parses args and prints tree to stdout
- `definition.ts` - Subcommand definition for tree: describes arguments (maxDepth, targetDir), --ext option, and webHeaderWidget config
- `git-status.ts` - Git status collector: parses git status --porcelain=v1 -z output and returns Map of path → decoration (modified, added, deleted, renamed, untracked, conflicted)
- `handler.ts` - Command handler: resolves workspace root, parses CLI args, and returns tree output or error result
- `workspace-tree.ts` - Core tree logic: builds text tree, parses CLI args, lists directory entries with tree prefixes and git decorations; exports buildWorkspaceTree and listWorkspaceDirectoryEntries

## Notes
- Supports max depth, extension filtering, and optional dm-bot workspace root
- CLI entrypoint at cli.ts, bot adapter at adapter.ts
- Git status decorations applied to files and parent directories

## Subdirectories
- `renderers/` - Web UI renderers for file tree browser with git status badges, navigation controls, and clickable links
