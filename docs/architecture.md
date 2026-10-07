# File architecture

The File plugin provides workspace tree browsing, bounded file previews, editing,
creation/deletion/rename/restore, Git history/diff/commit/init, search, and encrypted
file transfer. Core/client integration uses generic commands and WebNodes.

## Entry points

- `init.ts` — Plugin lifecycle, command/help registration, stories, and capabilities.
- `definition.ts` — Aggregates the retained command definitions.
- `adapter.ts` — Parses structured or CLI invocations and dispatches command adapters.
- `commands/help/module.ts` — Help text and normalized command definition.
- `fuzzy-file-search-provider.ts` — Filtered/scored workspace file discovery.
- `workspace-file-view-provider.ts` — Workspace file preview capability.
- `stories.ts` — Guided tree, edit, diff, and commit demonstrations.
- `landing.ts` — Data-only website content and media metadata.

## Modules and boundaries

- [Commands](../commands/README.md) own domain execution and web/text presentation.
- [Shared helpers](../commands/shared/README.md) own containment, ignore filtering,
  encrypted transfer, and breadcrumbs.
- [Tree rendering](../commands/tree/renderers/README.md) owns the file browser and
  its `⋮` actions: creation, rename, search, diff, history, and deletion.
- [Types](../types/README.md) define shared adapter contracts.

There is no File AI-tool bundle or generated File skill. Agents use standard file
tools and local READMEs/docs; committed code/documentation discovery belongs to
[Memory](../../memory/README.md).

Core contracts: [Plugin system](../../../docs/PLUGIN_SYSTEM.md) and
[Web renderer](../../../docs/WEB_RENDERER.md).
