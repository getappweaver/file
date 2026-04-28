import type { FileCommandAdapterParams } from '../../types/adapter-params';

import { handleUploadCommand } from './handler';

export async function adaptUploadCommand(
  params: FileCommandAdapterParams,
): Promise<string> {
  const filePathArg =
    typeof params.parsed.arguments.filePath === 'string'
      ? params.parsed.arguments.filePath
      : null;

  const recipientNpub =
    typeof params.parsed.arguments.recipientNpub === 'string'
      ? params.parsed.arguments.recipientNpub
      : null;

  const result = await handleUploadCommand({
    prefix: params.prefix,
    alias: params.alias,
    filePathArg,
    recipientNpub,
  });

  if (result.type === 'usage') {
    return result.text;
  }

  if (result.type === 'error') {
    return result.text;
  }

  return result.text;
}
