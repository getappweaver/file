import type { FileCommandAdapterParams } from '../../types/adapter-params';

import { handleDownloadCommand } from './handler';

export async function adaptDownloadCommand(
  params: FileCommandAdapterParams,
): Promise<string> {
  const naddr =
    typeof params.parsed.arguments.naddr === 'string'
      ? params.parsed.arguments.naddr
      : null;

  const result = await handleDownloadCommand({
    prefix: params.prefix,
    alias: params.alias,
    naddr,
  });

  if (result.type === 'usage') {
    return result.text;
  }

  if (result.type === 'error') {
    return result.text;
  }

  return result.text;
}
