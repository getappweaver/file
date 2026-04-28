---
direct_hash: aae5a71db7cd42382ef749f87ca847684d9d4a517cc8235f53ea31bd492c3577
subtree_hash: 8129728015280d89003fa5264b7dcbe6915d3ced509256b4631896386699d43e
enriched: true
enriched_summary_hash: 7de4cb4e9692c3afc7619ba8286bbe45f67197922e901eeb731fa5481b11d1ad
enriched_version: 1
files:
children:
  bottomup: 8300a8666fee7712e1d24625c989a3302e3f9c73220802031dbda69f9bd9c1a0
  bottomup_context: d03fc7198caa796e0dec214bc64ab3f88d348e8b82bfa53b6fa02685dbeef38a
  diff: 891a3e58da04e117898779619f8b1e2947a6ea2b5039e3879a6408fb7f211929
  download: c2129fd68a2207394531a92326bde4ecbf2e34969b4e8f06890f89a5dfdf9bc7
  help: a13ce5e043ef15a7c213779a6ff00ca6532ab78214967dc7dab733c12583ca32
  shared: e89b708c5b92dfa47ba50ce8f2399fcd0604a7d6dc6ae25fddbfe10bd34e67ae
  summarize: 6aa8814f93c43023a8543a45254ae7405943bfc236937514eb034a593393be5b
  topdown: 0f433f07b16704cbb8c179f7cc3eba5b45208555f8b3c0af4fd85ae3426ab4b5
  tree: fb5af23bc4d9507dc11ffc7322cd7f0b3f5cdbcebf8685ec14d669ea2724b362
  upload: 69ad2deaab9cb5ff3b6cd8f3d1b1cc8dbe720c2a06119bebf42681f6b2b67800
  view: a9ede02056a982519fb50f21754231249fa20a7e946869257e94d358df65afc2
---
# commands

## Purpose
This directory contains the file plugin’s subcommand implementations. Its children provide the command-specific adapters, handlers, and related helpers behind the plugin’s workspace inspection, documentation-generation, file transfer, and git/file browsing features across CLI, bot, web, and AI-facing flows.

## Notes
- This is the plugin’s main subcommand surface: the top-level file plugin routes subcommands into the adapters and handlers defined here.
- Documentation workflows span generation (`bottomup`), context lookup (`bottomup_context`), aggregation (`summarize`), and second-pass enrichment (`topdown`), forming the core of the plugin’s `__BOTTOMUP.md` documentation pipeline.
- Several subcommands back both direct CLI usage and structured bot/web navigation flows, especially `tree`, `view`, and `diff`; those richer browsing commands also have dedicated web renderers, while most other commands return standard message output.
- Shared command-level parsing, workspace resolution, and Nostr/Blossom file-transfer helpers live in the local shared utilities directory.
- Unlike draft-based plugins elsewhere in the repo, these command flows execute immediately rather than creating review drafts.

## Subdirectories
- `bottomup/` - Generates `__BOTTOMUP.md` documentation for directory subtrees in a depth-first pass, with an optional refinement pass for broader context.
- `bottomup_context/` - Adapts CLI input into a read-only `bottomup_context` call that returns nearby `__BOTTOMUP.md` context for AI and documentation workflows.
- `diff/` - Implements git diff previews for the workspace, including color-formatted output for tracked and untracked files used by file-browsing and web diff flows.
- `download/` - Downloads shared files into the workspace by resolving Nostr metadata, fetching Blossom blobs, decrypting content, and handling write conflicts.
- `help/` - Provides the help subcommand adapter and formatting utilities for command-line usage output.
- `shared/` - Holds shared command utilities, including CLI option coercions, workspace-root resolution, and Nostr/Blossom file-storage helpers.
- `summarize/` - Reads bottom-up markdown documentation and emits a flat text summary, warning when source docs are missing or stale.
- `topdown/` - Wires the `topdown` command from CLI definition through typed argument adaptation into a second-pass refinement over existing bottom-up docs.
- `tree/` - Implements workspace tree display for CLI and bot/web interfaces, with text rendering, navigation support, and git-status decoration.
- `upload/` - Encrypts and shares workspace files through Blossom storage and Nostr, including the CLI surface and sync logic.
- `view/` - Implements file viewing from the workspace with binary detection, truncation handling, and either CLI text or `WebNodeRoot` output.
