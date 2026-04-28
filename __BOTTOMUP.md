---
direct_hash: eaf297d8b71f4b17acd715fdf92bad6494d4d2c7dfa0c3a5dfe4fefce8ee545a
subtree_hash: 261f13bd9f297ec18aa2cc1e5be1dab46daddc01e966958fc0292e45ebdb1478
enriched: true
enriched_summary_hash: 7de4cb4e9692c3afc7619ba8286bbe45f67197922e901eeb731fa5481b11d1ad
enriched_version: 1
files:
  .gitignore: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
  adapter.ts: d2cc609466acc59ef82cbb6dcff5c683515f2c479510c53cf2b1ddbb22295b4e
  ai.ts: d1d0d139b489d61da31f5c4961c4feb4939eadb44ab3edee920b389af8e543b2
  definition.ts: 2a13bd07dfc9596275741dc08dbe6923dfb839d141b65c2fe0a30ffc61fcf7dd
  init.ts: 795942547b2337c54efb990ad65e2f866132758c30c039b5726a3709b15c9306
  package.json: 33356dc3833c6ed216e2343bbca4eeb433198db7818e37fa8a49631952430f5d
  README.md: 181e4ad9622d790fffcc1a08a49319bbc368cee3c2cbe8613dab5ea0497bae93
  tree: 01a411c3d1b2a3a0852b87bd6003dbd7e4556faa87998135b50f8bc8e683c06b
children:
  ai: 569deb369460b8a3365739fc522c95e4964afd7e21705bbd3191b433b3f8a75e
  commands: 8129728015280d89003fa5264b7dcbe6915d3ced509256b4631896386699d43e
  output: 7f736272f2dab1f269ec2c23ab3720afb38db4a2805584798f1966d0b70b938e
  renderers: 27dc7388c008afd4eb926393e8e002801241b8fa804d6ca6af205c196555d8f0
---
# file

## Purpose
dm-bot file plugin providing workspace file operations and documentation-oriented tooling across tree, view, diff, upload, download, bottomup, bottomup_context, and summarize. It is the top-level entrypoint that connects bot subcommands, AI-facing file tools, and the standalone tree CLI, combining everyday workspace browsing/file transfer with the bottom-up documentation pipeline used to generate, read, and aggregate `__BOTTOMUP.md` context. Unlike draft-based plugins, file operations execute immediately and route each subcommand to its per-command adapter.

## Files
- `.gitignore` - Empty gitignore placeholder
- `adapter.ts` - Main handler: parses subcommand, routes to adapter, returns text or WebNodeRoot representation
- `ai.ts` - Exports AI tool schemas (BottomupCall, FileToolCall, SummarizeCall) and executeTool function
- `definition.ts` - Declares command definition with 9 subcommands: help, upload, download, tree, view, diff, bottomup, bottomup_context, summarize
- `init.ts` - Plugin initialization: defines FilePlugin with handler, helpText, and commandDefinition
- `package.json` - dm-bot-file-plugin v1.1.0, coreApiVersion ^7.0.0
- `README.md` - Usage docs: !file commands and standalone tree CLI with --dm-bot-workspace option
- `tree` - Executable CLI script that imports and runs tree-cli main function

## Notes
- Plugin alias is derived from the directory name
- This plugin is stateless compared with draft-backed plugins: it does not use SQLite and mutating commands execute immediately
- It has two main roles in the wider bot: workspace browsing/sharing (`tree`, `view`, `diff`, `upload`, `download`) and documentation support (`bottomup`, `bottomup_context`, `summarize`) for generating and consuming `__BOTTOMUP.md` subtree docs
- Web source triggers specialized renderers for tree/view/diff, while help/message output goes through the shared representation/rendering path
- The standalone CLI entry point is the `plugins/file/tree` executable, which wraps the tree command outside chat usage

## Subdirectories
- `ai/` - Zod schemas and execution for AI file tools (bottomup, bottomup_context, summarize)
- `commands/` - Per-subcommand implementations with adapter/handler/renderer structure
- `output/` - Message representation builder and tone-aware formatting
- `renderers/` - Text renderer dispatching to help or message renderers by representation kind
