# plugins/file/types architecture

Houses TypeScript type definitions for the file plugin, establishing the adapter parameter contract for file command invocations.

## Architectural role

Type-contract boundary for the file plugin facade. Normalizes the invocation envelope between the centralized dispatcher (adapter.ts/handleFile) and the commands/ container so CLI, web-tree, and AI JSON entry points share a single typed shape, preserving decoupling and workspace-containment guarantees without embedding runtime logic.

## Source map

- `adapter-params.ts` — Defines FileCommandAdapterParams type aggregating prefix, alias, MessageSource, ParsedCliInvocation, file command definition return type, and unknown jsonPayload.

## Integration details

- `adapter-params.ts` — Shared dispatcher envelope for file/Git/transfer commands: prefix/alias, transport, parsed invocation, and structured payload. It keeps downstream adapters independent of transport-specific parsing.
