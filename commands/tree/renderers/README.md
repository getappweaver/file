# plugins/file/commands/tree/renderers architecture

Provides web rendering for the file tree command including stylesheet, icon, and interactive WebNode tree with navigation, expand/collapse, and file operations.

## Architectural role

Terminal web-presentation leaf delegated by plugins/file/commands/tree to isolate browser-specific interactive rendering from parent's depth/target parsing, workspace containment/IGNORE/.gitignore filtering, and git-status bubbling. Completes the dual CLI/web execution split for the read-only discovery surface — parent owns data-building for both paths, this directory owns lazy expansion/navigation/file-ops UI for web consumers routed through the centralized adapter/handleFile dispatch — with no further children or filesystem mutation ownership.

## Source map

- `stylesheet.ts` — Exports filePluginTreeStylesheet WebStyleSheet with id 'file-plugin-tree' and cssText styling the file tree modal layout, tree blocks, rows, inline forms, breadcrumbs and control buttons.
- `web.ts` — Renders workspace tree WebNodes/WebActions: refresh, reveal, navigation, expand state, create/rename/delete forms, diff/history, and search with breadcrumbs and scoped styles.

## Integration details

- `stylesheet.ts` — Decoupled presentation asset for the web execution path; provides scoped 'file-plugin-tree' WebStyleSheet consumed by web.ts to style modal, tree blocks/rows, inline forms, breadcrumbs and controls without coupling styling to WebNode construction or action logic.
- `web.ts` — Transforms parent-validated directory data into stateful UI. Directory `⋮` menus expose creation and search alongside rename, diff, history, and deletion. These actions delegate to retained file/Git commands rather than implementing mutations in the renderer.
