# plugins/file/commands/history/renderers architecture

Provides web rendering for the file history command, converting FileHistoryResult into a styled UI tree with file breadcrumb, clickable commit subjects that dispatch diff actions, and per-commit metrics for file count, additions, and deletions.

## Architectural role

Presents handler-produced Git history as WebNodes with scoped styles. It owns no
Git execution or containment logic, and connects history rows to diff inspection
through ordinary command actions.

## Source map

- `web.ts` — Exports renderFileHistoryWeb to render FileHistoryResult as a WebNodeRoot with error/empty handling, breadcrumb, commit rows with diff command links and addition/deletion stats, and a scoped stylesheet.

## Integration details

- `web.ts` — Sole web adapter for the history feature; encapsulates all WebNodeRoot construction so handler remains focused on path resolution and git execution. Owns the history-to-diff navigation affordance by wiring commit subjects to diff command dispatches, enabling traversal from log overview to single-commit inspection entirely within the web surface.
