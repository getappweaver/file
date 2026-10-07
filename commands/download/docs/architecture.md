# plugins/file/commands/download architecture

Directory implements the file download subcommand — adapter parsing, command definition, request handling, and Nostr/Blossom sync that decodes naddr, fetches and validates the file-share event, integrity-checks, decrypts, and writes the file to the workspace with up-to-date and conflict handling.

## Architectural role

Consumer side of the upload/download pair. The adapter/handler flow validates Nostr event authenticity, Blossom blob integrity, NIP-44 decryption, workspace containment, and conflict policy behind a minimal naddr entrypoint for CLI/web callers.

## Source map

- `adapter.ts` — Adapter extracts optional naddr string from FileCommandAdapterParams and delegates to handleDownloadCommand, returning its text result.
- `definition.ts` — Defines download SubcommandDefinition with name download, summary to download and decrypt by naddr, optional naddr string argument, and usage examples.
- `handler.ts` — Handler validates naddr presence for usage guidance, resolves workspace root and Nostr config, calls fileDownload, and maps skipped, success, and error outcomes to text results.
- `sync.ts` — Implements fileDownload that decodes and validates naddr kind, fetches the file event via SimplePool, validates url/x/hash tags, checks local hash against plaintext/prev for skip or conflict handling, downloads and hash-verifies the Blossom blob, decrypts via NIP-44 conversation key and AES-GCM, and writes to the resolved workspace path.

## Integration details

- `adapter.ts` — Thin CLI/web adaptation shim in the file plugin's validate → execute → adapt pattern; extracts the optional naddr from FileCommandAdapterParams and delegates to the domain handler, keeping transport/parsing concerns out of sync logic consistent with sibling command adapters under the central dispatcher.
- `definition.ts` — Declarative SubcommandDefinition contract registered via the plugin init subcommand table; provides the name, summary, optional naddr argument and usage examples that the central dispatcher uses for routing, help generation, and validation before adapter/handler execution.
- `handler.ts` — Orchestration and presentation boundary for the download flow; enforces preconditions (naddr presence for usage guidance, workspace-root and Nostr config resolution) and normalizes fileDownload domain outcomes (skipped/up-to-date, success, conflict, error) into text results for CLI and web renderer consumption.
- `sync.ts` — Encapsulated domain core owning the end-to-end Nostr/Blossom trust pipeline — naddr decode/kind validation, SimplePool event fetch, url/x/hash tag checks, local hash comparison for skip/conflict decisions, Blossom blob download with hash verification, NIP-44 conversation-key and AES-GCM decryption, and contained workspace write — isolating network/crypto/I/O and idempotency policy from adapter/handler layers.
