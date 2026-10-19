# plugins/file/commands/view/renderers architecture

Provides web rendering for the file view command, combining code-view stylesheet and WebNodeRoot construction for displaying, highlighting, copying, and inline-editing file content with breadcrumb and timeline integration.

## Architectural role

Owns view's preview styles and WebNodeRoot generation, separate from handler validation and bounded reading. It maps file results to generic code-view, breadcrumb, and timeline primitives while the adapter/dispatcher remain transport boundaries.

## Source map

- `stylesheet.ts` — Defines and exports filePluginViewStylesheet WebStyleSheet with CSS for read-only and editable code views, line numbers, GFM markdown table blocks, and injected breadcrumb/timeline styles.
- `web.ts` — Exports renderFileViewWeb to build the file view WebNodeRoot with breadcrumb, timeline button, highlighted code lines (and segmented GFM markdown tables with per-row source line numbers) with clipboard/scroll handling, toggleable editableText, refreshable root metadata, and edit/diff toolbar actions.

## Integration details

- `stylesheet.ts` — Static style dependency for its sibling web.ts — not imported outside this directory except transitively via renderFileViewWeb. Isolates all visual concerns for the view's web adaptation so markup generation stays style-agnostic, supporting the read-only/editable code-view split, markdown table cell layout, and injected breadcrumb/timeline overrides.
- `web.ts` — Web-branch renderer invoked exclusively by parent view/handler.ts; builds the WebNodeRoot response that handler returns to adapter.ts for dispatch. Composes filePluginViewStylesheet with highlighted line and GFM markdown table rendering, clipboard/scroll handling, toggleable editableText, refreshable root metadata (`arguments`/`options`), and edit/diff toolbar actions to connect read-only preview output to workspace editing, manual refresh, and history affordances.
