import { loadFileShareNostrConfig } from '@src/env';

import { resolveFileWorkspaceRoot } from '../shared/workspace-root';

import { fileDownload } from './sync';

type HandleDownloadCommandProps = {
  prefix: string;
  alias: string;
  naddr: string | null;
};

type DownloadCommandResult =
  | { type: 'success'; text: string; tone: 'info' | 'success' }
  | { type: 'usage'; text: string }
  | { type: 'error'; text: string };

export async function handleDownloadCommand(
  props: HandleDownloadCommandProps,
): Promise<DownloadCommandResult> {
  const { prefix, alias, naddr } = props;

  if (!naddr) {
    return {
      type: 'usage',
      text: `Usage: ${prefix}${alias} download <naddr>`,
    };
  }

  try {
    const destRoot = resolveFileWorkspaceRoot();
    const nostr = loadFileShareNostrConfig();

    const result = await fileDownload({
      naddr,
      nostr,
      filePath: destRoot,
    });

    if (result.skipped) {
      return {
        type: 'success',
        tone: 'info',
        text: `File already up to date: ${result.filename}. Nothing to download.`,
      };
    }

    return {
      type: 'success',
      tone: 'success',
      text: `Download complete: ${result.filename} → ${result.path}`,
    };
  } catch (err) {
    return {
      type: 'error',
      text: `File download failed: ${String(err)}`,
    };
  }
}
