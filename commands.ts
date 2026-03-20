// ---------------------------------------------------------------------------
// plugins/file/commands.ts — !file sub-commands (no DB)
// ---------------------------------------------------------------------------

import { resolve } from 'path';

import type { PluginIdentity } from '@src/core/plugin';
import { loadFileShareNostrConfig } from '@src/env';

import { fileDownload, fileUpload } from './sync';
import { resolveFileWorkspaceRoot } from './workspace-root';
import { buildWorkspaceTree, parseTreeCliArgs } from './workspace-tree';

export type HandleFileProps = {
  args: string[];
  identity: PluginIdentity;
  helpText: (alias: string) => string[];
};

async function wrapAsync(
  fn: () => Promise<string>,
  errorPrefix: string,
): Promise<string> {
  try {
    return await fn();
  } catch (err) {
    return `${errorPrefix}: ${String(err)}`;
  }
}

export async function handleFile({
  args,
  identity,
  helpText,
}: HandleFileProps): Promise<string> {
  const sub = args[0]?.toLowerCase();
  const rest = args.slice(1);
  const alias = identity.alias;

  if (!sub || sub === 'help') {
    return helpText(alias).join('\n');
  }

  if (sub === 'upload') {
    const [filePathArg, recipientNpub] = rest;

    if (!filePathArg || !recipientNpub) {
      return `Usage: !${alias} upload <file_path> <npub_bot_b>`;
    }

    const root = resolveFileWorkspaceRoot();
    const absPath = resolve(root, filePathArg);

    return wrapAsync(async () => {
      const nostr = loadFileShareNostrConfig();

      const result = await fileUpload({
        filePath: absPath,
        recipientNpub,
        nostr,
      });

      if (result.skipped) {
        return `File unchanged (hash matches remote): ${result.filename}. Nothing to upload.\nnaddr: ${result.naddr}`;
      }

      return `Upload complete: ${result.filename}\nnaddr: ${result.naddr}`;
    }, 'File upload failed');
  }

  if (sub === 'download') {
    const [naddr] = rest;

    if (!naddr) {
      return `Usage: !${alias} download <naddr>`;
    }

    return wrapAsync(async () => {
      const destRoot = resolveFileWorkspaceRoot();
      const nostr = loadFileShareNostrConfig();

      const result = await fileDownload({
        naddr,
        nostr,
        filePath: destRoot,
      });

      if (result.skipped) {
        return `File already up to date: ${result.filename}. Nothing to download.`;
      }

      return `Download complete: ${result.filename} → ${result.path}`;
    }, 'File download failed');
  }

  if (sub === 'tree') {
    const { maxDepth, targetDirRelative, extFilter } = parseTreeCliArgs(rest);

    return wrapAsync(async () => {
      const workspaceRoot = resolveFileWorkspaceRoot();

      return buildWorkspaceTree({
        workspaceRoot,
        targetDirRelative,
        maxDepth,
        extFilter,
      });
    }, 'File tree failed');
  }

  return `Unknown subcommand: ${sub}. Use !${alias} help.`;
}
