---
direct_hash: aae5a71db7cd42382ef749f87ca847684d9d4a517cc8235f53ea31bd492c3577
subtree_hash: 933d69e93bdc78bd8c1b8cf6044d83990c455a5b6913f722512a98543d0296da
files:
children:
  bottomup: 9a76ff456efae4764acf6717fb3b6333fd8dc945ad1ec65883b27a2c83a1fadb
  bottomup_context: d03fc7198caa796e0dec214bc64ab3f88d348e8b82bfa53b6fa02685dbeef38a
  diff: 891a3e58da04e117898779619f8b1e2947a6ea2b5039e3879a6408fb7f211929
  download: c2129fd68a2207394531a92326bde4ecbf2e34969b4e8f06890f89a5dfdf9bc7
  help: a13ce5e043ef15a7c213779a6ff00ca6532ab78214967dc7dab733c12583ca32
  shared: e89b708c5b92dfa47ba50ce8f2399fcd0604a7d6dc6ae25fddbfe10bd34e67ae
  summarize: c058b980815da1587afa7e1c9dc5bd66ec441d3f765c00600235952325f7ee94
  tree: 8e27e0723b104e52f1feccd145465c614ccdc3c20c1ec4a5c71c923030e7c4ac
  upload: 69ad2deaab9cb5ff3b6cd8f3d1b1cc8dbe720c2a06119bebf42681f6b2b67800
  view: a9ede02056a982519fb50f21754231249fa20a7e946869257e94d358df65afc2
---

# commands

## Purpose
CLI command implementations for dm-bot. Each subdirectory exports a plugin with a command definition and handler for a specific subcommand (tree, upload, download, diff, view, etc.).

## Notes
- Entry point for plugins is the plugin object exporting command definition and handler
- All commands follow the same pattern: CLI adapter + command definition + core handler

## Subdirectories
- `bottomup/` - Generates __BOTTOMUP.md files depth-first for folder subtrees with optional two-pass AI enrichment mode
- `bottomup_context/` - CLI adapter for bottomup_context tool execution
- `diff/` - Git diff previews with color formatting for tracked and untracked files
- `download/` - Downloads and decrypts shared files by naddr via Blossom/NIP-44 AES-GCM
- `help/` - Help command formatting utilities for CLI subcommands
- `shared/` - Shared CLI option parsing coercions and Blossom file storage functions
- `summarize/` - Reads .md bottomup files and returns flat text summary with stale file warnings
- `tree/` - Workspace file tree display with text/tree formats and git status decoration
- `upload/` - Encrypts and shares workspace files via Blossom storage and NIP-17
- `view/` - File viewer with binary detection, truncation, and WebNodeRoot output
