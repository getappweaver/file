---
direct_hash: 7fa542b1ef51271334a2f1dac8369fc5c36bd0e56be3202d5d76f0b380a59645
subtree_hash: b14ee555dbcfc5c760d3a3734aa8510764ee04ae4c1dee69042da29312b82902
files:
  adapter.ts: a59d3b0d6217785da6c844d91822523297ac7a810651363d1f3dee9c4663083a
  definition.ts: d6ac1c4c2ad779b6fa95b614ac8ccf228490ca3cc864333d28875dcc810b5485
children:
---

# commands/bottomup_context

## Purpose
Command adapter for the `bottomup_context` subcommand. It turns CLI arguments and options into a read-only `bottomup_context` tool call, returning nearby `__BOTTOMUP.md` documentation as context for AI agents and documentation workflows.

## Files
- `adapter.ts` - CLI adapter that parses arguments/options, executes the `bottomup_context` tool, and returns the result as a message representation.
- `definition.ts` - Defines the subcommand schema: `workingDir` argument plus context-selection options such as `scopeRoot`, `parents`, `children`, `ignore`, `includeHidden`, and `noGitignore`, with usage examples.

## Notes
- Part of the dm-bot file plugin’s CLI and AI-tooling surface.
- Read-only companion to `bottomup`, `summarize`, and the broader bottom-up/top-down documentation pipeline: it fetches surrounding `__BOTTOMUP.md` context rather than generating or refining docs.
- Useful in second-pass enrichment workflows where an agent needs neighboring directory docs to add broader subtree context without rescanning source files.
- Uses shared parsing utilities from `../shared/`.
