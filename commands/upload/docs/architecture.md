# plugins/file/commands/upload architecture

Implements the `upload` subcommand for the file plugin, defining its CLI metadata and handling the full pipeline of validating arguments, resolving workspace-relative paths, and encrypting files for Blossom upload with NIP-44 key sharing and publishing a replaceable Nostr file event.

## Architectural role

Outbound leaf of the secure-transfer pair (complement to download) within the file plugin's command aggregation. Operates as a dispatched leaf beneath adapter.ts/handleFile and init.ts registration, reusing the shared workspace-containment validation before executing the encrypt-upload-publish chain. Provides the workspace-to-recipient direction of the Nostr/Blossom NIP-44 flow with hash-based deduplication via replaceable FILE_KIND events, which download reverses.

## Source map

- `adapter.ts` — Adapter extracts string filePath and recipientNpub from params.parsed.arguments and delegates to handleUploadCommand with prefix/alias, returning result.text for usage/error/success cases.
- `definition.ts` — Defines uploadDefinition factory returning SubcommandDefinition named 'upload' with summary about Blossom + NIP-17 encryption, optional filePath and recipientNpub string arguments, and example invocations.
- `handler.ts` — Handler validates filePathArg and recipientNpub presence, resolves absolute path via resolveFileWorkspaceRoot, loads Nostr config, invokes fileUpload, and formats usage, skipped-hash, success, or error text with filename and naddr.
- `sync.ts` — Implements fileUpload that decodes recipient npub, reads file and SHA-256 hashes plaintext, checks existing FILE_KIND event for hash-match skip or prev divergence, AES-GCM encrypts with random key/nonce, uploads ciphertext blob to Blossom, NIP-44 encrypts the AES key for the recipient, and publishes the tagged Nostr event returning filename, naddr, and skipped.

## Integration details

- `adapter.ts` — CLI/web adaptation shim for the centralized dispatcher pattern — extracts typed arguments and threads prefix/alias through to the handler, isolating transport formatting (result.text) from validation and transfer logic consistent with all 20 file commands.
- `definition.ts` — Declarative registration artifact consumed by the file plugin's command aggregation and help system — defines the subcommand contract (name, summary, arguments, examples) without owning execution, enabling discovery and routing via the parent container.
- `handler.ts` — Orchestration and boundary-validation layer between adapter and core logic — enforces argument presence, resolves workspace containment via resolveFileWorkspaceRoot, loads Nostr config, delegates to fileUpload, and maps skipped/success/error outcomes to user-facing text with filename and naddr.
- `sync.ts` — Core domain engine for the outbound encrypted transfer — owns the hash-check deduplication against existing replaceable Nostr events, AES-GCM file encryption, Blossom ciphertext upload, NIP-44 key wrapping for the recipient, and tagged event publication.
