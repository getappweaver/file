# plugins/file/commands/init architecture

Implements the `init` file subcommand for initializing a Git repository in the resolved workspace, providing command definition, workspace-root adaptation, and git execution with existing-repository checks.

## Architectural role

Git repository initialization through the centralized dispatcher. It reuses shared workspace resolution/containment, implements idempotency in the handler, and isolates Bun.spawnSync execution from later Git workflows.

## Source map

- `adapter.ts` — Adapts FileCommandAdapterParams to handleInitCommand by resolving the workspace root via resolveFileWorkspaceRoot and returning the handler's text or the resolution error string.
- `definition.ts` — Exports initDefinition factory that defines the `init` (alias `git-init`) subcommand metadata to initialize a Git repository in the workspace.
- `handler.ts` — Implements handleInitCommand that checks `git rev-parse --is-inside-work-tree`, validates an existing `.git` path, and runs `git init` via Bun spawnSync returning ok/error text results.

## Integration details

- `adapter.ts` — Workspace-boundary adapter for the init pipeline — translates FileCommandAdapterParams via shared/resolveFileWorkspaceRoot and delegates to handleInitCommand, surfacing handler text or resolution error string back to the central adapter dispatch without owning git logic.
- `definition.ts` — Publishes `init` (alias `git-init`) metadata through initDefinition for command registration, help, and dispatch.
- `handler.ts` — Idempotent execution core for repository bootstrap — pre-checks `git rev-parse --is-inside-work-tree` and existing `.git` path before running `git init` via Bun spawnSync, returning normalized ok/error text and keeping git-process concerns separate from workspace resolution in the adapter.
