import { resolve } from 'path';

import { loadFileShareNostrConfig } from '@src/env';

import { resolveFileWorkspaceRoot } from '../shared/workspace-root';

import { fileUpload } from './sync';

type HandleUploadCommandProps = {
  prefix: string;
  alias: string;
  filePathArg: string | null;
  recipientNpub: string | null;
};

type UploadCommandResult =
  | { type: 'success'; text: string; tone: 'info' | 'success' }
  | { type: 'usage'; text: string }
  | { type: 'error'; text: string };

export async function handleUploadCommand(
  props: HandleUploadCommandProps,
): Promise<UploadCommandResult> {
  const { prefix, alias, filePathArg, recipientNpub } = props;

  if (!filePathArg || !recipientNpub) {
    return {
      type: 'usage',
      text: `Usage: ${prefix}${alias} upload <file_path> <npub_bot_b>`,
    };
  }

  const root = resolveFileWorkspaceRoot();
  const absPath = resolve(root, filePathArg);

  try {
    const nostr = loadFileShareNostrConfig();

    const result = await fileUpload({
      filePath: absPath,
      recipientNpub,
      nostr,
    });

    if (result.skipped) {
      return {
        type: 'success',
        tone: 'info',
        text: `File unchanged (hash matches remote): ${result.filename}. Nothing to upload.\nnaddr: ${result.naddr}`,
      };
    }

    return {
      type: 'success',
      tone: 'success',
      text: `Upload complete: ${result.filename}\nnaddr: ${result.naddr}`,
    };
  } catch (err) {
    return {
      type: 'error',
      text: `File upload failed: ${String(err)}`,
    };
  }
}
