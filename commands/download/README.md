# commands/download

Directory implements the file download subcommand — adapter parsing, command definition, request handling, and Nostr/Blossom sync that decodes naddr, fetches and validates the file-share event, integrity-checks, decrypts, and writes the file to the workspace with up-to-date and conflict handling.

## Documentation

- [Architecture and source map](docs/architecture.md)
