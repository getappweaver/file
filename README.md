# File plugin

File plugin for dm-bot (nostr://_@dhalsim.github.io/nostr-dm-agent)

## Demo

[Interactive Demo](https://getappweaver.com/apps/file-manager)

![Edit a file and inspect the diff](https://getappweaver.com/gifs/file-edit-diff.gif)

![Edit a file and inspect the diff on mobile](https://getappweaver.com/gifs/file-edit-diff-mobile.gif)

- **Commands** — `/file [help]` to see available commands.
- `/file upload <file_path> <npub_bot_b>` to upload a file to a bot's workspace.
- `/file download <naddr>` to download a file from a bot's workspace.
- `/file tree [maxDepth] [targetDir] [--ext ext1,ext2]` to show the file tree of the bot’s workspace (uses `dm-bot.sqlite` workspace target).

## CLI (`plugins/file/tree`)

Executable on your PATH: roots the tree at **`process.cwd()`** by default (the directory you run it from). Optional **`--dm-bot-workspace`** matches `/file tree` (SQLite `workspace_target`).

```bash
chmod +x plugins/file/tree   # once; or rely on `bun /path/to/tree`
cd ~/some-project && tree 1
tree --dm-bot-workspace 2      # dm-bot workspace root from this install
```

If the binary name `tree` clashes with `tree(1)`, symlink it to e.g. `dm-bot-file-tree`.
