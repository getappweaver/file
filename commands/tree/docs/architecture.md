# plugins/file/commands/tree architecture

Manages the file tree subcommand: parsing depth/target/ext/expanded/reveal arguments, resolving and validating the workspace target, building filtered text trees and lazily-expandable web directory listings with IGNORE/.gitignore filtering, and decorating rows with aggregated git status for CLI and web surfaces.

## Architectural role

Read-only discovery surface within the plugins/file/commands aggregation — the browsing counterpart to mutating file/git commands. Provides the foundational navigation layer that view/edit/create/delete/rename operate inside, bridging the centralized adapter/handleFile dispatch to both CLI and lazy web execution paths. Owns its own git-status bubbling and delegates interactive expansion/navigation/file-ops UI to the renderers/ child, while reusing shared/ workspace containment and IGNORE/.gitignore filtering shared with sibling file commands.

## Source map

- `adapter.ts` — Bridges parsed CLI invocations to web or text execution via parseTreeTokensFromParsed, renderTreeForWeb (parseTreeCliArgs + listWorkspaceDirectoryEntries + renderFileTreeBrowserWeb) and adaptTreeCommand dispatch to handleTreeCommand.
- `cli.ts` — Standalone CLI entry that strips --appweaver-workspace flag, shows help, parses maxDepth/target/ext via parseTreeCliArgs, and prints buildWorkspaceTree from cwd or AppWeaver workspace root.
- `definition.ts` — Declares the tree SubcommandDefinition with variadic rest argument, ext/expanded/reveal options, examples, and header webWidget singleton configuration.
- `git-status.ts` — Collects git decorations via git status --porcelain -z, parses nul-delimited entries into kind/priority, and bubbles file statuses to ancestor directories except deleted/renamed.
- `handler.ts` — Handles non-web tree requests by merging restTokens/extOption through parseTreeCliArgs and returning buildWorkspaceTree text or a formatted error.
- `workspace-tree.ts` — Core tree utilities that parse CLI args, enforce workspace-contained resolution, filter by IGNORE/IGNORE_EXT/.gitignore, and build text trees or expandable web rows with git decorations.

## Integration details

- `adapter.ts` — Dual-surface dispatch bridge for this subcommand — routes already-parsed invocations from the file plugin's centralized dispatcher to either web rendering (parseTreeCliArgs + listWorkspaceDirectoryEntries + renderFileTreeBrowserWeb) or text execution (adaptTreeCommand/handleTreeCommand); owns no tree-building logic itself.
- `cli.ts` — Standalone out-of-process entry point that bypasses plugin registration — strips --appweaver-workspace, parses args from cwd/workspace root, and directly prints buildWorkspaceTree text; provides direct CLI invocation path reusing the same core engine as the plugin-embedded flow.
- `definition.ts` — Declares tree's variadic arguments, ext/expanded/reveal options, examples, and singleton header widget.
- `git-status.ts` — Isolated decoration provider for the tree — parses git status --porcelain -z into prioritized kinds and bubbles child statuses to ancestors (excluding deleted/renamed); consumed by workspace-tree to annotate both text and web rows without coupling core filtering/tree logic to git.
- `handler.ts` — Text-surface counterpart to adapter's web path — thin orchestration that merges restTokens/extOption via parseTreeCliArgs and returns buildWorkspaceTree text or formatted error for CLI/non-web callers.
- `workspace-tree.ts` — Central engine of the subcommand — owns CLI arg parsing, workspace-contained resolution, IGNORE/IGNORE_EXT/.gitignore filtering, and construction of both text trees and expandable web rows with git decorations; depended on by adapter, cli, and handler as the single source of tree semantics.
