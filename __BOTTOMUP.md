---
direct_hash: 744c0097b28891347ced1fa2fc8b4f2b2b9480c9d1d86cf44f12f5dc03bff122
subtree_hash: 2644e8bfc326b1aa8a55f963fce84057ff7f309e67931168d87b4877f8b8f3e0
files:
  .gitignore: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
  adapter.ts: 331cd145208a36864d9817cc917a269fc23151a50f7345260803ffb31fb3815e
  ai.ts: d1d0d139b489d61da31f5c4961c4feb4939eadb44ab3edee920b389af8e543b2
  definition.ts: 2a13bd07dfc9596275741dc08dbe6923dfb839d141b65c2fe0a30ffc61fcf7dd
  init.ts: 795942547b2337c54efb990ad65e2f866132758c30c039b5726a3709b15c9306
  package.json: 33356dc3833c6ed216e2343bbca4eeb433198db7818e37fa8a49631952430f5d
  README.md: 181e4ad9622d790fffcc1a08a49319bbc368cee3c2cbe8613dab5ea0497bae93
  tree: 01a411c3d1b2a3a0852b87bd6003dbd7e4556faa87998135b50f8bc8e683c06b
children:
  ai: 569deb369460b8a3365739fc522c95e4964afd7e21705bbd3191b433b3f8a75e
  commands: 20640e8c773471e09b20cb7966341a684cb69748102e53567d16518de6c30ba6
  output: 90ac04ac9ec58d6839bec4a27ca19e39a321b725c19d81289e8d368b95d63831
  types: 194e58ef133d2b83455f5dfd80b9ca6604821c96c7282bbff56e44b77542138d
---

# file

## Purpose
This directory defines the file plugin’s local entrypoints and wiring: plugin initialization, command definition, subcommand dispatch, AI tool exposure, and a small CLI launcher. It delegates concrete behavior to the local ai/, commands/, output/, and types/ subdirectories.

## Files
- `.gitignore` - Empty placeholder with no ignore rules defined here.
- `adapter.ts` - Top-level file command dispatcher that validates the subcommand, parses CLI-style input, and routes to the matching local adapter.
- `ai.ts` - Exports the file plugin’s AI definition by bundling tool schemas, instructions, database access, and tool execution hooks for agents.
- `definition.ts` - Builds the plugin’s command definition and registers the supported file-related subcommands and help metadata.
- `init.ts` - Plugin bootstrap that reads package metadata, exposes the BotPlugin object, and connects runtime handling, help text, AI support, and command definitions.
- `package.json` - Local package metadata for the file plugin, including its dm-bot compatibility and a contributor setup script for git hooks.
- `README.md` - User-facing overview of the file plugin’s commands plus usage notes for the standalone tree CLI entrypoint.
- `tree` - Minimal Bun executable that invokes the local tree CLI main function.

## Notes
- Commands default to help when no subcommand is provided.
- The plugin alias is derived from the directory name at init time.
- The tree file is a thin Bun executable that forwards into tree-cli.

## Subdirectories
- `ai/` - AI-facing tool layer for the plugin, including schemas and execution handlers for documentation and summarization workflows.
- `commands/` - Subcommand implementations and related adapters/helpers for workspace inspection, documentation generation, file transfer, and browsing flows.
- `output/` - Shared output shaping for generic command responses, especially message-style results used before rendering.
- `types/` - Local TypeScript contracts for the command adapter layer and its parameter shapes.
