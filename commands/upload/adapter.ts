import type { CommandDefinition } from '@src/system/command-definition';
import type { ParsedCliInvocation } from '@src/system/parser-cli';

import { createMessageRepresentation } from '../../output/message/builder';

import { handleUploadCommand } from './handler';

export async function adaptUploadCommand(params: {
  prefix: string;
  alias: string;
  parsed: ParsedCliInvocation;
  command: CommandDefinition;
}) {
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
    return createMessageRepresentation({
      command: params.alias,
      subcommand: 'upload',
      tone: 'error',
      text: result.text,
    });
  }

  if (result.type === 'error') {
    return createMessageRepresentation({
      command: params.alias,
      subcommand: 'upload',
      tone: 'error',
      text: result.text,
    });
  }

  return createMessageRepresentation({
    command: params.alias,
    subcommand: 'upload',
    tone: result.tone,
    text: result.text,
  });
}
