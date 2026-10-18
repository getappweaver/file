# plugins/file/commands/diff/renderers architecture

Renders file diff web UI: stylesheet defines diff block and line styles, renderer builds diff card and timeline output with breadcrumb, line-numbered patch, and git-state notices.

## Architectural role

Stateless web-presentation leaf beneath plugins/file/commands/diff, invoked only on the web path to materialize already-resolved diff results. Completes the parent read-only inspection leaf's validate-containment/repository-resolution → execute → adapt pattern by owning all web-channel rendering while CLI formatting stays in the parent adapter, and follows the plugin-wide stylesheet + renderer split as a terminal, logic-free view layer with no children or git/filesystem dependencies.

## Source map

- `stylesheet.ts` — Exports filePluginDiffStylesheet WebStyleSheet id 'file-plugin-diff' defining CSS for web-file-diff-block, diff-file__patch table, diff-line variants (add/del/hunk/meta/number/text) and injected breadcrumb/timeline button styles.
- `web.ts` — Exports renderFileDiffWeb and renderTimelineDiffOutput to build diff WebNodeRoot/timeline_event UIs with breadcrumb header, refreshable root metadata, truncated/binary meta, table-styled patch rows with old/new line numbers and clipboard links, and git_unavailable/init and error handling.

## Integration details

- `stylesheet.ts` — Declarative style contract for the diff presentation leaf; registers WebStyleSheet id 'file-plugin-diff' for consumption by web.ts and the AppWeaver shell. Provides no runtime logic, decoupling visual semantics for patch/table/line-variant and breadcrumb/timeline elements from truncation, binary, and repository-resolution handling in the parent command.
- `web.ts` — Imperative web-channel builder that translates diff execution outputs into WebNodeRoot/timeline_event trees for the shell. Counterpart to CLI rendering in the parent adapter, depends on stylesheet.ts for styling, and branches across single-file vs timeline/commit variants to handle refreshable root metadata, truncated/binary metadata, breadcrumb headers, line-numbered patch tables with clipboard links, and git_unavailable/init error states.
