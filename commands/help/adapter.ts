import { buildHelpSubcommandRepresentation } from '@src/commands/help/command';
import type { CommandDefinition } from '@src/system/command-definition';
import type { ParsedCliInvocation } from '@src/system/parser-cli';

import { createMessageRepresentation } from '../../output/message/builder';

export function adaptHelpCommand(params: {
  prefix: string;
  alias: string;
  parsed: ParsedCliInvocation;
  command: CommandDefinition;
}) {
  const result = buildHelpSubcommandRepresentation({
    prefix: params.prefix,
    alias: params.alias,
    command: params.command,
    parsed: params.parsed,
  });

  if (result.type === 'error') {
    return createMessageRepresentation({
      command: params.alias,
      subcommand: 'help',
      tone: 'error',
      text: result.message,
    });
  }

  return result.representation;
}
