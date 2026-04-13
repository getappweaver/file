---
direct_hash: fc18509b79b460843ecbe02f1686fe4d16cc6644026e0cda9b937a8001494a09
subtree_hash: a25977550000429a6c4647239af7f01d66c10710002fe3f12c0797b9ef37a4b4
files:
  .gitignore: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
  adapter.ts: 9bea95764557cf96a6f61387c933c6ab40aa28e2ca4e4dfa40b79900dde496bf
  ai.ts: 846f3967f35197a8b2e7d8ea2fac698b6f7c0c26a5da47c009e7f2ccc1b98c7e
  definition.ts: c5fe58a49ffbaf4dd71bbbf454ab9c51bbd482efd23ce4326da15a5e982c4403
  init.ts: 023f8b4652715688df799bf289f213ff170d3a5e33c33316d52f7adb9d4b25df
  package.json: ec959bb2fb13d72378eecefb4cfcdc77600b2bc6f555a1468e075a3b1dc0e4f2
  README.md: 181e4ad9622d790fffcc1a08a49319bbc368cee3c2cbe8613dab5ea0497bae93
  tree: 01a411c3d1b2a3a0852b87bd6003dbd7e4556faa87998135b50f8bc8e683c06b
children:
  ai: 47b6e1cf66b6792460b7f64a123f1466409c889283565b2034e2a363f70ca0b1
  commands: ee4cfda8c15f392da9b12d9a92cf76ad4f4759893ead787658f2b865641dcacc
  output: 7f736272f2dab1f269ec2c23ab3720afb38db4a2805584798f1966d0b70b938e
  renderers: 27dc7388c008afd4eb926393e8e002801241b8fa804d6ca6af205c196555d8f0
---

# file

## Purpose
dm-bot file plugin providing workspace file operations (tree, view, diff, upload, download, summarize, bottomup). No SQLite; commands execute immediately. Routes subcommands to per-command adapters.

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
- Plugin alias derived from directory name
- Web source triggers special renderers for tree/view/diff
- CLI entry point via plugins/file/tree executable

## Subdirectories
- `ai/` - Zod schemas and execution for AI file tools (bottomup, bottomup_context, summarize)
- `commands/` - Per-subcommand implementations with adapter/handler/renderer structure
- `output/` - Message representation builder and tone-aware formatting
- `renderers/` - Text renderer dispatching to help or message renderers by representation kind
