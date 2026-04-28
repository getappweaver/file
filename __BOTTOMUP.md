---
direct_hash: b8321b3fa7cdb1213a44b4537e7c65af6a269cb5eb2f2b5bb73858eceef61474
subtree_hash: 4cb74b8b82808afb3e1f5d79176f677733092853ed180697dcdc7fd8c1ca7ae8
files:
  .gitignore: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
  adapter.ts: 265cc417dc2203777e4d164a88d288eade6a92d7ece26881b04c8fd36f8afb1e
  ai.ts: d1d0d139b489d61da31f5c4961c4feb4939eadb44ab3edee920b389af8e543b2
  definition.ts: c5fe58a49ffbaf4dd71bbbf454ab9c51bbd482efd23ce4326da15a5e982c4403
  init.ts: 795942547b2337c54efb990ad65e2f866132758c30c039b5726a3709b15c9306
  package.json: 33356dc3833c6ed216e2343bbca4eeb433198db7818e37fa8a49631952430f5d
  README.md: 181e4ad9622d790fffcc1a08a49319bbc368cee3c2cbe8613dab5ea0497bae93
  tree: 01a411c3d1b2a3a0852b87bd6003dbd7e4556faa87998135b50f8bc8e683c06b
children:
  ai: d225db5c181197e2a1462fcfe468f065d8ba975424c4d89aef15d7027bedb23a
  commands: 40d9d942c79f9eaa6b42179cf1d0f0fe2e23b133e8d4bfe9cb0a1d826c21fa47
  output: 7f736272f2dab1f269ec2c23ab3720afb38db4a2805584798f1966d0b70b938e
  renderers: 27dc7388c008afd4eb926393e8e002801241b8fa804d6ca6af205c196555d8f0
---
# file

## Purpose
dm-bot file plugin providing workspace file operations (tree, view, diff, upload, download, summarize, bottomup). It serves as the top-level entrypoint that connects bot subcommands, AI-facing file tools, and the standalone tree CLI. Unlike draft-based plugins, file operations execute immediately and route each subcommand to its per-command adapter.

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
- Web source triggers specialized renderers for tree/view/diff, while help/message output goes through the shared representation/rendering path
- The standalone CLI entry point is the `plugins/file/tree` executable, which wraps the tree command outside chat usage

## Subdirectories
- `ai/` - Zod schemas and execution for AI file tools (bottomup, bottomup_context, summarize)
- `commands/` - Per-subcommand implementations with adapter/handler/renderer structure
- `output/` - Message representation builder and tone-aware formatting
- `renderers/` - Text renderer dispatching to help or message renderers by representation kind
