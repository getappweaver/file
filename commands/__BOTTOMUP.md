---
direct_hash: aae5a71db7cd42382ef749f87ca847684d9d4a517cc8235f53ea31bd492c3577
subtree_hash: 40d9d942c79f9eaa6b42179cf1d0f0fe2e23b133e8d4bfe9cb0a1d826c21fa47
files:
children:
  bottomup: c3058dcbf4671a932195d5445eb0a066f15153c52c0a90b3dccd34149b09a787
  bottomup_context: d03fc7198caa796e0dec214bc64ab3f88d348e8b82bfa53b6fa02685dbeef38a
  diff: 891a3e58da04e117898779619f8b1e2947a6ea2b5039e3879a6408fb7f211929
  download: c2129fd68a2207394531a92326bde4ecbf2e34969b4e8f06890f89a5dfdf9bc7
  help: a13ce5e043ef15a7c213779a6ff00ca6532ab78214967dc7dab733c12583ca32
  shared: e89b708c5b92dfa47ba50ce8f2399fcd0604a7d6dc6ae25fddbfe10bd34e67ae
  summarize: 2b5d1be9b4516012dbae2ab5999ea6ee28caedb12f96c291ad17d8245d0090c7
  tree: fb5af23bc4d9507dc11ffc7322cd7f0b3f5cdbcebf8685ec14d669ea2724b362
  upload: 69ad2deaab9cb5ff3b6cd8f3d1b1cc8dbe720c2a06119bebf42681f6b2b67800
  view: a9ede02056a982519fb50f21754231249fa20a7e946869257e94d358df65afc2
---
# commands

## Purpose
Per-subcommand implementations for the dm-bot file plugin. This directory contains the command surfaces behind `!file`, with each subdirectory handling one file-oriented operation such as tree browsing, viewing, diffing, sharing, downloading, or AI-assisted documentation.

## Notes
- This is the main routing layer for the file plugin’s subcommands; the top-level plugin delegates into these command modules
- Most commands follow the same pattern: command definition + adapter + core handler, with some also providing Web UI renderers
- The command set spans both immediate workspace/file operations (`tree`, `view`, `diff`, `upload`, `download`) and documentation-oriented AI tools (`bottomup`, `bottomup_context`, `summarize`)
- Shared parsing and storage helpers live in `shared/`

## Subdirectories
- `bottomup/` - Generates `__BOTTOMUP.md` files depth-first for folder subtrees, with optional two-pass AI enrichment using broader subtree context
- `bottomup_context/` - CLI adapter for the `bottomup_context` tool, which reads existing documentation context around a target directory
- `diff/` - Git diff previews with color formatting for tracked and untracked files
- `download/` - Downloads and decrypts shared files by naddr via Blossom and NIP-44 AES-GCM
- `help/` - Help command formatting utilities for file-plugin subcommands
- `shared/` - Shared CLI option parsing coercions, workspace resolution helpers, and Blossom file-storage functions
- `summarize/` - Reads bottom-up documentation files and returns a flat summary with stale-file warnings
- `tree/` - Workspace file tree display with text/tree formats, git status decoration, and Web UI support
- `upload/` - Encrypts and shares workspace files via Blossom storage and NIP-17
- `view/` - File viewer with binary detection, truncation, and `WebNodeRoot` output
