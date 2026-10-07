# plugins/file/commands/search/renderers architecture

Provides web rendering and styling for the file search command, handling grouped match display, breadcrumb navigation, and timeline integration.

## Architectural role

Web-presentation leaf delegated by the parent search command within the file-operations family — isolates DOM/CSS generation from ripgrep execution, filtering and CLI/text adaptation in the parent. Stateless rendering-only layer invoked via the parent's web adapter path (not directly via the file dispatcher), consuming grouped results to produce interactive UI while reusing shared workspace breadcrumb/timeline infrastructure for navigation consistency.

## Source map

- `stylesheet.ts` — Exports filePluginSearchStylesheet WebStyleSheet defining CSS for search header, results, match items, path button, and line display plus shared breadcrumb and timeline styles.
- `web.ts` — Implements renderFileSearchWeb to render grouped search results by path with breadcrumb header, open-timeline button, and view actions that navigate to match path and line number.

## Integration details

- `stylesheet.ts` — Style-only companion to web.ts in the delegated rendering leaf — isolates declarative CSS from rendering logic, defining search-specific classes consumed solely by renderFileSearchWeb and importing shared breadcrumb/timeline styles to maintain visual consistency across file-plugin web renderers.
- `web.ts` — Web renderer entry that consumes the parent command's grouped result model and translates it into interactive navigation — bridges breadcrumb header/open-timeline actions and per-match view buttons to workspace file-view navigation by path and line number, completing the parent's dual-mode (CLI text vs web) contract.
