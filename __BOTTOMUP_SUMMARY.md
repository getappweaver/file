---
subtree_hash: 261f13bd9f297ec18aa2cc1e5be1dab46daddc01e966958fc0292e45ebdb1478
summary_hash: 7de4cb4e9692c3afc7619ba8286bbe45f67197922e901eeb731fa5481b11d1ad
depth: 6
respect_gitignore: true
exclude_hidden: true
include_file_summaries: true
---

# file

## Purpose
dm-bot file plugin providing workspace file operations (tree, view, diff, upload, download, summarize, bottomup). It serves as the top-level entrypoint that connects bot subcommands, AI-facing file tools, and the standalone tree CLI. Unlike draft-based plugins, file operations execute immediately and route each subcommand to its per-command adapter.

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
- Plugin alias is derived from the directory name
- This plugin is stateless compared with draft-backed plugins: it does not use SQLite and mutating commands execute immediately
- Web source triggers specialized renderers for tree/view/diff, while help/message output goes through the shared representation/rendering path
- The standalone CLI entry point is the `plugins/file/tree` executable, which wraps the tree command outside chat usage

## Subdirectories
- `ai/` - Zod schemas and execution for AI file tools (bottomup, bottomup_context, summarize)
- `commands/` - Per-subcommand implementations with adapter/handler/renderer structure
- `output/` - Message representation builder and tone-aware formatting
- `renderers/` - Text renderer dispatching to help or message renderers by representation kind


# ai

## Purpose
AI-facing tool layer for the dm-bot file plugin. Defines the schemas and execution handlers that expose the plugin’s documentation-oriented capabilities to agents, especially the bottom-up `__BOTTOMUP.md` workflow, context retrieval, and subtree summarization used for later big-picture refinement.

## Files
- `schema.ts` - Zod schemas for bottomup, bottomup_context, and summarize calls with nullable parameters; also exports the skill description and usage rules that guide agents toward stable, responsibility-focused documentation
- `tooling.ts` - Tool execution handlers that dispatch call types to their implementations and exports `agentInstructions` for using these tools from AI workflows

## Notes
- This directory is the AI bridge for the plugin’s documentation pipeline rather than its general file-browsing commands: `bottomup_context` reads nearby `__BOTTOMUP.md` docs, `bottomup` generates them, and `summarize` flattens subtree docs so higher-level passes can review or refine them
- The schemas intentionally allow explicit nullable inputs so callers can pass all fields while still deferring behavior to option normalization in the bottomup handlers and command layer
- Guidance emphasizes scope-root–bounded traversal and documenting stable responsibilities over transient implementation details, which supports both initial bottom-up generation and later big-picture enrichment passes
- These tools execute immediately through the plugin CLI/tooling path and do not use the draft system



# commands

## Purpose
This directory contains the file plugin’s subcommand implementations. Its children provide the command-specific adapters, handlers, and related helpers behind the plugin’s workspace inspection, documentation-generation, and file transfer features across CLI, bot, web, and AI-facing flows.

## Notes
- This is the plugin’s main subcommand surface: command adapters here route into the per-command logic used by the top-level file plugin entrypoints.
- Documentation workflows span generation (`bottomup`), context lookup (`bottomup_context`), aggregation (`summarize`), and second-pass enrichment (`topdown`).
- Several subcommands back both direct CLI usage and structured bot/web navigation flows, especially `tree`, `view`, and `diff`.
- Shared command-level parsing, workspace resolution, and Nostr/Blossom file-transfer helpers live in the local shared utilities directory.
- Unlike draft-based plugins elsewhere in the repo, these command flows execute immediately rather than creating review drafts.

## Subdirectories
- `bottomup/` - Generates `__BOTTOMUP.md` documentation for directory subtrees in a depth-first pass, with an optional refinement pass for broader context.
- `bottomup_context/` - Adapts CLI input into a read-only `bottomup_context` call that returns nearby `__BOTTOMUP.md` context for AI and documentation workflows.
- `diff/` - Implements git diff previews for the workspace, including color-formatted output for tracked and untracked files used by file-browsing and web diff flows.
- `download/` - Downloads shared files into the workspace by resolving Nostr metadata, fetching Blossom blobs, decrypting content, and handling write conflicts.
- `help/` - Provides the help subcommand adapter and formatting utilities for command-line usage output.
- `shared/` - Holds shared command utilities, including CLI option coercions, workspace-root resolution, and Nostr/Blossom file-storage helpers.
- `summarize/` - Reads bottom-up markdown documentation and emits a flat text summary, warning when source docs are missing or stale.
- `topdown/` - Wires the `topdown` command from CLI definition through typed argument adaptation into a second-pass refinement over existing bottom-up docs.
- `tree/` - Implements workspace tree display for CLI and bot/web interfaces, with text rendering, navigation support, and git-status decoration.
- `upload/` - Encrypts and shares workspace files through Blossom storage and Nostr, including the CLI surface and sync logic.
- `view/` - Implements file viewing from the workspace with binary detection, truncation handling, and either CLI text or `WebNodeRoot` output.



# commands/bottomup

## Purpose
Implements the `bottomup` subcommand that generates `__BOTTOMUP.md` files for directory subtrees in a depth-first pass. This is the primary documentation-generation command within the file plugin: it creates the per-directory bottom-up docs that later power `bottomup_context` and `summarize`, and it can also run the initial big-picture enrichment pass used by the broader documentation workflow.

## Files
- `adapter.ts` - CLI adapter - parses CLI invocation, calls executeBottomupTool, and returns the command result as a formatted message representation
- `definition.ts` - Command definition - declares arguments, options, and examples for the bottomup subcommand
- `handler.ts` - Core handler - walks the directory tree, builds directory nodes, renders `__BOTTOMUP.md`, and optionally runs a second refinement pass using summarized subtree context

## Notes
- Entrypoint is `adaptBottomupCommand` in `adapter.ts`
- Supports `--two-pass` to first generate bottom-up per-directory docs, then refine them with broader subtree context gathered through the summarize flow
- Writes one `__BOTTOMUP.md` per directory in the target subtree
- Serves as the producer for the plugin’s documentation pipeline: `bottomup_context` reads these docs for context, `summarize` aggregates them for flat subtree summaries, and the separate `topdown` command can later rerun enrichment against existing bottom-up artifacts
- The refinement flow depends on summary/cache data managed by the handlers layer, so this command is both the initial doc writer and the first stage in the plugin’s larger bottom-up → summarize → enrich workflow

## Subdirectories
- `handlers/` - Implements the bottom-up documentation engine for directory trees, including AI summarization, doc parsing/rendering, filesystem operations, option normalization, and recursive tree building with hash-based change detection.



# commands/bottomup/handlers

## Purpose
This directory is the core implementation layer behind the file plugin’s documentation pipeline. It scans workspace-bounded directory trees, normalizes options shared across `bottomup`, `summarize`, `bottomup_context`, and `topdown`, generates or reuses per-directory documentation, and writes the markdown/cache artifacts that other commands later read or validate. It also owns the AI prompt/repair flow and the hash-based logic that decides when docs can be skipped, refreshed, or enriched in a second pass.

## Files
- `ai.ts` - Runs AI-backed directory summarization and second-pass refinement, including prompt construction, backend/session setup, JSON extraction or repair, and validation of returned summaries.
- `doc.ts` - Parses existing bottom-up docs, renders the canonical markdown format, writes docs for a tree, and produces compact run or tree-summary output.
- `fs.ts` - Provides filesystem and path utilities for bottom-up scanning, including scope-root resolution, ignore filtering, file snippet extraction, hashing, and child doc-status listing.
- `options.ts` - Normalizes schema-level bottomup, summarize, context, and topdown calls into internal option objects with local defaults.
- `summary-cache.ts` - Reads and writes the cached subtree summary file used to persist rendered summary bodies together with the hash and option context that produced them.
- `tree.ts` - Builds directory nodes recursively, decides whether to skip, reuse, or regenerate docs, writes updated markdown, and performs the top-down enrichment pass over existing bottom-up docs.
- `types.ts` - Defines the local constants, AI JSON schema shape, option types, and directory/file data structures shared across these handlers.

## Notes
- Docs are stored as `__BOTTOMUP.md` with frontmatter hashes and optional scope/enrichment markers, and subtree-level summary cache data is persisted separately for later refinement.
- Reuse is hash-driven: unchanged docs are skipped, partially reusable docs get hashes refreshed, and stale pass-2 docs are not refined.
- This directory’s helpers are shared beyond initial generation: `summarize` relies on the same filtering/hash logic for staleness checks, and `topdown` reuses the refinement path over existing bottom-up artifacts.
- Path handling and ignore behavior are workspace-bounded and can respect `.gitignore` plus extra ignore patterns.


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


# commands/diff

## Purpose
Implements the diff subcommand for workspace git diff previews. Provides the CLI adapter, command definition, and core handler for generating color-formatted diff output for both tracked and untracked files, and serves as the diff view used by the file plugin’s larger tree/view/diff browsing flow.

## Files
- `adapter.ts` - CLI entrypoint - parses path argument, resolves workspace, calls handler, returns message representation
- `definition.ts` - Subcommand metadata - defines arguments, options, and usage examples for the diff command
- `handler.ts` - Core diff logic - resolves file paths, invokes git, parses and truncates diff output for preview

## Notes
- Uses git status and git diff to generate per-file diff previews within the active workspace
- Supports truncation for large files and binary detection
- WebUI renderers in the subdirectory provide the structured diff view used by web navigation flows alongside tree/view
- Fits the plugin’s generic WebNodeRoot rendering model rather than adding plugin-specific frontend behavior

## Subdirectories
- `renderers/` - WebUI renderers for diff output with color-coded lines (additions, deletions, context)


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


# commands/download

## Purpose
Implements the `download` subcommand for importing a shared file into the workspace from a Nostr file-share reference. Within the file plugin, it is the receive-side counterpart to `upload`: it resolves the share event, downloads the encrypted Blossom blob, decrypts it, and writes the result into the workspace with conflict protection.

## Files
- `adapter.ts` - Command adapter: validates CLI input, invokes handler, and formats responses as user messages
- `definition.ts` - Subcommand schema: defines the download command, its naddr argument, and usage examples
- `handler.ts` - Command orchestrator: validates the naddr, resolves the workspace destination, invokes sync, and returns typed results
- `sync.ts` - Core download logic: decodes the naddr, fetches the file-share event from relays, downloads the blob from Blossom, verifies hashes, decrypts via NIP-44/AES-GCM, and writes the file with conflict detection

## Notes
- Read/write command in the otherwise stateless file plugin: unlike draft-based plugins, downloads execute immediately.
- Requires an naddr pointing to a shared-file event published by the complementary upload flow.
- Uses the NIP-44 v2 conversation key to recover the file key, then AES-GCM to decrypt the downloaded blob.
- Detects local file conflicts and preserves divergent incoming content as a `.incoming` file instead of overwriting silently.


# commands/help

## Purpose
Help command adapter and formatting utilities for the dm-bot file plugin’s CLI subcommands. This directory provides the user-facing usage/help surface for the plugin’s command set, turning command definitions into consistent help output for command-line and bot-driven flows.

## Files
- `adapter.ts` - Adapts parsed CLI invocation into the plugin’s help message representation, so help output goes through the same shared response pipeline as other file commands
- `module.ts` - Formats subcommand usage strings from the file plugin’s command definitions and exports `getFileHelpLines` and `getFileCommandDefinition`

## Notes
- Small adapter/module pattern: the adapter delegates to shared help-line/definition builders
- Sits at the command-surface layer: it documents the file plugin’s available subcommands rather than implementing file operations itself
- Public exports: `adaptHelpCommand`, `getFileHelpLines`, `getFileCommandDefinition`


# commands/shared

## Purpose
Shared utilities for file-plugin subcommands. This directory centralizes common CLI coercion, workspace-root resolution, and Nostr/Blossom file-transfer helpers so upload/download and other command adapters can share the same workspace-bounded behavior.

## Files
- `cli-option-parsing.ts` - CLI option coercion helpers for string, int, bool, and CSV-array values used across command adapters
- `nostr-file.ts` - Shared Nostr/Blossom file-transfer helpers, including upload/download support and naddr encoding used by the plugin’s file-sharing flows
- `workspace-root.ts` - Resolves the effective workspace root from dm-bot/core context so CLI and bot-invoked commands operate on the correct target workspace

## Notes
- Provides the common parsing layer used by multiple file-plugin subcommands instead of duplicating option handling per command
- `workspace-root.ts` is part of the bridge between standalone CLI usage and dm-bot-managed workspace selection/state
- Nostr/Blossom helpers are the shared foundation beneath the plugin’s upload/download flows and integrate with `nostr-tools`


# commands/summarize

## Purpose
Implements the `summarize` CLI command that reads generated bottom-up documentation and returns it as a flat subtree summary. It is the aggregation step in the file plugin’s documentation pipeline: higher-level review and second-pass refinement use this command to turn many per-directory `__BOTTOMUP.md` files into one linear context block, while also warning about missing or stale docs.

## Files
- `adapter.ts` - CLI entrypoint: parses arguments/options, invokes the summarize handler, and returns the result as a formatted message representation.
- `definition.ts` - Defines the subcommand schema: `workingDir` argument plus scope/depth/filtering options for choosing which bottom-up docs to include in the summary.
- `handler.ts` - Core logic: walks the target subtree, collects `__BOTTOMUP.md` files, validates their hashes for staleness warnings, and returns the joined summary text.

## Notes
- Depends on `../bottomup/handlers` for shared filtering and hash-validation logic.
- Aggregates existing `__BOTTOMUP.md` files; it does not generate documentation itself.
- Returns concatenated bottom-up doc contents as plain text, with warnings when source docs are missing or stale.
- No AI model invocation in this command; despite sharing option patterns with the broader documentation workflow, it is a read-only file aggregation step.


# commands/topdown

## Purpose
This directory exposes the `topdown` subcommand as the standalone second-pass refinement step in the file plugin’s documentation pipeline. It wires the CLI definition through argument adaptation into the execution path that enriches existing bottom-up docs using cached subtree summary context, so broader big-picture context can be added after `bottomup` has already produced the initial `__BOTTOMUP.md` files.

## Files
- `adapter.ts` - CLI adapter that converts parsed `topdown` arguments/options into a typed tool call, executes it against the resolved workspace root, and returns success or error message output.
- `definition.ts` - Subcommand definition for `topdown`, declaring its purpose, argument and option surface, and example invocations for the CLI.
- `handler.ts` - Execution entrypoint that validates summary and bottom-up doc prerequisites, builds filtering and scope context, and runs the refinement pass over existing directory docs.

## Notes
- `topdown` depends on existing `__BOTTOMUP.md` and `__BOTTOMUP_SUMMARY.md` data.
- It is the standalone form of the same big-picture enrichment workflow that `bottomup --two-pass` can trigger automatically.
- The handler reuses bottomup filesystem, option, cache, and tree logic rather than defining its own traversal.
- Like the rest of the file plugin, it executes immediately and surfaces failures as user-facing command messages in the adapter.


# commands/tree

## Purpose
Tree command implementation for workspace file tree display. It is the primary navigation surface for the file plugin, serving both standalone CLI usage and bot/web file-browsing flows with text tree output and git status decoration.

## Files
- `adapter.ts` - Bot command adapter: parses tree tokens from parsed CLI invocation and delegates to handler for workspace tree output
- `cli.ts` - Standalone CLI entrypoint supporting --dm-bot-workspace flag and -h/--help; parses args and prints tree to stdout
- `definition.ts` - Subcommand definition for tree: describes arguments (maxDepth, targetDir), --ext option, and webHeaderWidget config
- `git-status.ts` - Git status collector: parses git status --porcelain=v1 -z output and returns Map of path → decoration (modified, added, deleted, renamed, untracked, conflicted)
- `handler.ts` - Command handler: resolves workspace root, parses CLI args, and returns tree output or error result
- `workspace-tree.ts` - Core tree logic: builds text tree, parses CLI args, lists directory entries with tree prefixes and git decorations; exports buildWorkspaceTree and listWorkspaceDirectoryEntries

## Notes
- Supports max depth, extension filtering, and optional dm-bot workspace root
- CLI entrypoint at `cli.ts`, bot adapter at `adapter.ts`
- Git status decorations are applied to files and propagated to parent directories
- This command underpins the plugin’s broader navigation flow: web renderers layer tree browsing on top of these results and link into the sibling `view` and `diff` commands
- The standalone `plugins/file/tree` executable wraps this command for non-chat usage

## Subdirectories
- `renderers/` - Web UI renderers for file tree browser with git status badges, navigation controls, and clickable links


# commands/tree/renderers

## Purpose
This directory contains the web-facing renderer assets for the tree command. It turns workspace tree data into a generic `WebNodeRoot` browser view and supplies the scoped stylesheet and icon used for the file-plugin’s tree surface within the broader tree/view/diff navigation flow.

## Files
- `stylesheet.ts` - Defines the scoped stylesheet for the file-tree browser, including layout, link styling, navigation controls, and git-status color states.
- `tree.svg` - Provides the tree command’s icon asset for UI surfaces that need a visual marker.
- `web.ts` - Renders workspace tree results into generic Web UI nodes, wiring navigation, lazy folder expansion, file viewing, and diff actions into the tree browser.

## Notes
- Web output is built around command actions that connect the tree browser to the related `view` and `diff` command flows.
- Styling is scoped through a dedicated `WebStyleSheet`, matching the plugin’s renderer pattern and the repo’s generic web-renderer model.
- This folder is a self-contained renderer surface with no child directories.


# commands/upload

## Purpose
Implements the upload subcommand for immediately encrypting and sharing workspace files through Blossom storage and Nostr so they can be fetched later by the companion `download` flow. It is the file plugin’s outbound file-transfer path, exposing the capability through the standard command adapter/handler structure rather than the documentation-oriented `bottomup` tooling.

## Files
- `adapter.ts` - CLI adapter that parses upload arguments and converts handler results to message representations with appropriate tone.
- `definition.ts` - Subcommand definition with filePath and recipientNpub arguments, describing the encrypt-and-upload flow via Blossom and Nostr.
- `handler.ts` - Command handler that validates arguments, resolves workspace-relative paths, and returns success/usage/error results.
- `sync.ts` - Core upload logic: reads the workspace file, checks remote hash state, encrypts with AES-GCM, uploads to Blossom, encrypts the file key with NIP-44, publishes the Nostr metadata event, and returns an addressable reference.

## Notes
- This command is part of the file plugin’s immediate-execution transfer features, unlike the plugin’s draft-backed patterns elsewhere in the repo.
- Uses NIP-44 for key encryption, AES-GCM for file encryption, and file-share metadata events that can later be resolved by `commands/download`.
- Skips upload when the local file hash matches the remote version, avoiding unnecessary re-uploads.
- Builds an `naddr` reference for the uploaded file so it can be shared and downloaded later.
- Operates on workspace-relative paths, fitting the plugin’s workspace-bounded file access model.

## Subdirectories


# commands/view

## Purpose
File viewer subcommand. Reads files from the active workspace, detects binary content, handles truncation, and returns either CLI text or generic `WebNodeRoot` output. Within the file plugin, it serves as the file-content counterpart to the tree and diff subcommands in the shared workspace browsing flow.

## Files
- `adapter.ts` - CLI adapter - parses path arg, resolves workspace root, calls handler, formats result as text message
- `definition.ts` - Subcommand definition - declares 'view' name, required 'path' argument, optional --previous-dir option
- `handler.ts` - Core logic - validates path, reads file via fs, detects binary, handles truncation, returns ok/error result

## Notes
- Uses `handler.ts` for the core file-reading and validation logic
- Web output is provided via the `renderers/` subdirectory as part of the plugin’s shared tree/view/diff navigation flow
- Paths must be relative to the resolved workspace root, keeping reads workspace-bounded
- The web path uses the repo’s generic Web UI model rather than plugin-specific frontend behavior

## Subdirectories
- `renderers/` - Web renderers for file view output


# commands/view/renderers

## Purpose
Web renderers for the file view command. Contains the scoped styling and WebNodeRoot renderer that turns workspace file-view results into the generic web UI used by the file plugin’s tree/view/diff browsing flow.

## Files
- `stylesheet.ts` - Scoped styles for web file viewing, including code/content display in the generic Web UI renderer
- `web.ts` - Main renderer converting FileViewOk/FileViewErr results into WebNodeRoot output with language detection and navigation actions

## Notes
- Provides language detection mapping from file extension to hljs language
- Handles both binary and text file display with truncation warnings
- Uses parentTreeAction to navigate back to the containing folder, fitting into the broader tree/view/diff web navigation flow
- Follows the repo’s plugin-agnostic web rendering model by producing generic WebNodeRoot output rather than frontend-specific behavior


# output

## Purpose
Output layer for the file plugin’s command responses. It defines the shared representation used for non-specialized command output—especially tone-aware message responses—and the text-rendering path that adapters use when a command returns standard CLI text instead of a specialized tree/view/diff Web UI.

## Subdirectories
- `message/` - Message representation layer for standard command responses, with tone-aware structured data and text rendering used by adapters across the plugin when output does not go through specialized tree/view/diff renderers.


# output/message

## Purpose
Message output layer for file-plugin command responses. It provides the generic structured representation used by most non-specialized subcommands before the top-level text renderer dispatches output, with tone (info/success/error), command metadata, and text content. The `renderers/` subdirectory handles simple CLI text output.

## Files
- `builder.ts` - Creates `MessageRepresentation` objects from command, subcommand, tone, and text params.
- `schema.ts` - Zod schemas for message data (tone, text) and the full representation using `createRepresentationSchema`.

## Notes
- Part of the plugin’s shared output system for command responses.
- Messages use representation kind `message` with version `1`.
- Tone controls the semantic feedback style for adapters that return plain informational, success, or error text instead of specialized web/tree/view/diff output.
- This layer is the common path for immediate text responses across the file plugin, while dedicated web renderers are used only for richer command-specific views.

## Subdirectories
- `renderers/` - Simple CLI text renderer returning raw message text without formatting.


# output/message/renderers

## Purpose
CLI text renderer for the file plugin’s generic message representation. It returns the message body without extra formatting and is used for command responses that flow through the shared representation/rendering path rather than specialized tree/view/diff web renderers.

## Files
- `cli.ts` - Returns raw `MessageRepresentation.data.text` for terminal/console output

## Notes
- Minimal pass-through renderer for generic command messages
- Sits at the end of the plugin’s shared message-output pipeline used by adapters that emit `message` representations
- Distinct from the structured WebNode-based renderers used by richer file-browsing commands such as tree, view, and diff


# renderers

## Purpose
Unified text-rendering entrypoint for the file plugin’s shared command-output path. It dispatches representation kinds such as help and message to their CLI text renderers, complementing the plugin’s separate WebNode-based renderers used by interactive tree/view/diff flows.

## Files
- `text.ts` - Dispatcher routing shared representation kinds like `help` and `message` to their respective text renderers for CLI/plain-text output.

## Notes
- This directory handles only the plugin’s generic text output path, not the specialized web renderers used by commands such as `tree`, `view`, and `diff`.
- It sits above the concrete help/message renderers and keeps command adapters decoupled from representation-specific text formatting.

## Subdirectories
- `shared/` - Empty directory.



# renderers/shared

## Purpose
Empty shared directory under renderers. No files or subdirectories present.
