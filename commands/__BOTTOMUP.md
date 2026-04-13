---
direct_hash: aae5a71db7cd42382ef749f87ca847684d9d4a517cc8235f53ea31bd492c3577
subtree_hash: ee4cfda8c15f392da9b12d9a92cf76ad4f4759893ead787658f2b865641dcacc
files:
children:
  bottomup: 94e1918ef9ece90f18e9f828d5e546d5aa1735ea95814ff7a61ea26638010f70
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
CLI command implementations for dm-bot. Each subdirectory implements a specific subcommand (tree, upload, download, diff, summarize, etc.) with adapter, handler, and core logic.

## Notes
- All commands follow the same pattern: adapter.ts + handler.ts + definition.ts
- Mutating commands return drafts for user review before execution
- Entrypoints exposed via src/cli.ts plugin system

## Subdirectories
- `bottomup/` - CLI command implementation for generating depth-first `__BOTTOMUP.md` documentation files in folder subtrees. Exposes two entrypoints via adapter.ts and handler.ts.
- `bottomup_context/` - Command adapter for the bottomup_context subcommand. Adapts CLI arguments and options to execute the bottomup_context tool and return a message result.
- `diff/` - Implements the diff subcommand plugin for git diff previews. Provides CLI adapter, command definition, and core handler for generating color-formatted diff output. Handles both tracked and untracked files.
- `download/` - Implements the `/download` subcommand for downloading and decrypting shared files by naddr into the workspace. Handles Nostr event lookup, Blossom blob download, AES-GCM decryption via NIP-44, and writes files with conflict detection.
- `help/` - Help command adapter and formatting utilities for CLI subcommands.
- `shared/` - Shared utilities for dm-bot CLI commands. Provides CLI option parsing coercions and Nostr Blossom file storage functions.
- `summarize/` - Implements the 'summarize' CLI command that reads .md bottomup documentation files and returns them as a flat text summary. Warns about missing or stale .md files.
- `tree/` - Tree command implementation for workspace file tree display. Provides both CLI and bot subcommand interfaces with text/tree and git status decoration support.
- `upload/` - Implements the upload command for encrypting and sharing workspace files with other bots via Blossom storage and Nostr NIP-17. Includes CLI adapter, command definition, handler, and core sync logic.
- `view/` - File viewer subcommand. Reads files from workspace, detects binary content, handles truncation, returns either CLI text or WebNodeRoot output.
