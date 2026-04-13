import type { CommandDefinition } from '@src/system/command-definition';
import type { ParsedCliInvocation } from '@src/system/parser-cli';

import { createMessageRepresentation } from '../../output/message/builder';

import { handleDownloadCommand } from './handler';

export async function adaptDownloadCommand(params: {
  prefix: string;
  alias: string;
  parsed: ParsedCliInvocation;
  command: CommandDefinition;
}) {
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
    return createMessageRepresentation({
      command: params.alias,
      subcommand: 'download',
      tone: 'error',
      text: result.text,
    });
  }

  if (result.type === 'error') {
    return createMessageRepresentation({
      command: params.alias,
      subcommand: 'download',
      tone: 'error',
      text: result.text,
    });
  }

  return createMessageRepresentation({
    command: params.alias,
    subcommand: 'download',
    tone: result.tone,
    text: result.text,
  });
}
