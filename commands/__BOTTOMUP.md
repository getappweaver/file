---
direct_hash: aae5a71db7cd42382ef749f87ca847684d9d4a517cc8235f53ea31bd492c3577
subtree_hash: 20640e8c773471e09b20cb7966341a684cb69748102e53567d16518de6c30ba6
files:
children:
  bottomup: fd1f502acc61e84a575966f82a043610de2095536311913226df624866434eaa
  bottomup_context: b14ee555dbcfc5c760d3a3734aa8510764ee04ae4c1dee69042da29312b82902
  diff: 5975d76e7873481215bb7de913532c9c9650ef3fe135b9c6b6ad96ea6e6beb1b
  download: 09aa49f038e8245444a6994f5fe0633baffc97f13ec4d6037ccbf13fd9b96154
  help: 8eb1ff78fe64c6675af88e07e633f77ba4c28ddccdf8dc09587576099cfabab4
  shared: e89b708c5b92dfa47ba50ce8f2399fcd0604a7d6dc6ae25fddbfe10bd34e67ae
  summarize: faae2d5f274c393f72ae6692aabedd4e68354b909601112a33bb75e45dd5725e
  topdown: 7c84390d1c2494223a47eb18e50b600c224e4417ba2c6e708c9481acc1623377
  tree: 79999ab7455722f7f3123c2582b915492cf088a15d6f69724a1eaafe0e9dce20
  upload: 5a3e34d393814d4537c8637569d97655d016cf50ccd0de576c34d1542d06e05a
  view: 9aa10a97f0f5e4f18ada2b2933aa2a95491879f6b0aeb378286cb78fc7763159
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
