---
direct_hash: 8f20ef71e41a11ce5526afdd76a48aad7a5431a0aa4010404612e3d438bac7ad
subtree_hash: 79999ab7455722f7f3123c2582b915492cf088a15d6f69724a1eaafe0e9dce20
files:
  adapter.ts: ef66d4ad91c27457726fe0301f8051697f8fe0fe112f0cc9672a7f38467f91a2
  cli.ts: 7e40d5096b421b0ff9b5164d261b0c73b6fad18adbf8a94cd8daf424d2189043
  definition.ts: 3fad7f3d09e5b7dd8f10fa5b6b16968d0c2583d7f89c37c5d409b5a2beb54ef9
  git-status.ts: b5e81a52a8a29a3ee7e6f43310003d5631ea484f9dc1ff7a13f2e9947aefbf62
  handler.ts: a5eb32657108cc7fe02028db2170d5a752bf686802b824dca3cb9949d9597826
  workspace-tree.ts: 4aa067ba658ec7225d433563ce7c6548b14d8f917572a9351eb4678f3229c66c
children:
  renderers: f8cfa5cbc0f7f5ca8856ccfebab995216ac6adf1c1b4406b3077b9ce37f1f38b
---

# commands/tree

## Purpose
Tree command implementation for workspace file tree display. It is the primary navigation surface for the file plugin, serving both standalone CLI usage and bot/web file-browsing flows with text tree output, git status decoration, and the underlying directory data that the interactive tree/view/diff web flow builds on.

## Files
- `adapter.ts` - Bot command adapter: parses tree tokens from parsed CLI invocation and delegates to handler for workspace tree output
- `cli.ts` - Standalone CLI entrypoint supporting --dm-bot-workspace flag and -h/--help; parses args and prints tree to stdout
- `definition.ts` - Subcommand definition for tree: describes arguments (maxDepth, targetDir), --ext option, and webHeaderWidget config
- `git-status.ts` - Git status collector: parses git status --porcelain=v1 -z output and returns Map of path → decoration (modified, added, deleted, renamed, untracked, conflicted)
- `handler.ts` - Command handler: resolves workspace root, parses CLI args, and returns tree output or error result
- `workspace-tree.ts` - Core tree logic: builds text tree, parses CLI args, lists directory entries with tree prefixes and git decorations; exports buildWorkspaceTree and listWorkspaceDirectoryEntries

## Notes
- Supports max depth, extension filtering, and optional dm-bot workspace root
- CLI entrypoint at `cli.ts`, bot adapter at `adapter.ts`
- Git status decorations are applied to files and propagated to parent directories
- This command is the main entry into the file plugin’s browsing experience: specialized web renderers turn its results into navigable UI and connect outward to the sibling `view` and `diff` commands
- Unlike the plugin’s documentation-generation commands, this is an immediate inspection/navigation surface rather than part of the `__BOTTOMUP.md` pipeline
- The standalone `plugins/file/tree` executable wraps this command for non-chat usage

## Subdirectories
- `renderers/` - Web UI renderers for file tree browser with git status badges, navigation controls, and clickable links
