---
direct_hash: 44d778b7d7de49a6686ff0aeed868bfcf729289f5a12f0ed85b356e47c1386b7
subtree_hash: 06a6c5f20a1bd75c3df628c415d97d02f15095482c4d37bb33624dd650c4f3ea
enriched: true
enriched_summary_hash: 7de4cb4e9692c3afc7619ba8286bbe45f67197922e901eeb731fa5481b11d1ad
enriched_version: 1
files:
  stylesheet.ts: bc29c0aa910c127fa60a41571309e81f31d1ef8e3d28f03ea4a1b3573d1a9ca8
  web.ts: 8217b73be5486e4f1a2c17c3107d44cf6e5fe9263007ee0063ff1ea77220573e
children:
---
# commands/diff/renderers

## Purpose
Web UI renderers for the `diff` subcommand’s output. They turn diff results from the command handler into generic `WebNodeRoot` views, providing the structured diff screen used by the file plugin’s web tree/view/diff browsing flow with scoped styling and line-by-line rendering for additions, deletions, context, and hunk metadata.

## Files
- `stylesheet.ts` - Defines the scoped `WebStyleSheet` for diff rendering, including the diff container, file headers, hunk markers, and per-line color treatment for additions, deletions, and context.
- `web.ts` - Renders `FileDiffOk`/error results into `WebNodeRoot`, including navigation back to the parent folder and presentation for normal, truncated, binary, and error cases.

## Notes
- This is one of the file plugin’s specialized web renderers: `tree`, `view`, and `diff` use dedicated structured renderers, while ordinary help/message output goes through the shared representation path.
- Follows the repo’s generic Web UI model: command output is rendered as reusable `WebNodeRoot` data rather than plugin-specific frontend logic.
- Styling is scoped and theme-friendly via CSS variables, matching the broader web renderer approach used by other file-plugin surfaces.
- Supports the main diff edge cases surfaced by the handler, including errors, truncation, and binary files.
- Provides a “Back to folder” action so the diff view fits into the larger tree/view/diff navigation flow.
