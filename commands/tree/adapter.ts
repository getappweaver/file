import type { CommandDefinition } from '@src/system/command-definition';
import type { ParsedCliInvocation } from '@src/system/parser-cli';

import { createMessageRepresentation } from '../../output/message/builder';

import { handleTreeCommand } from './handler';

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => String(v));
  }

  return [];
}

export function parseTreeTokensFromParsed(parsed: ParsedCliInvocation): {
  restTokens: string[];
  extOption: string | null;
} {
  const rawRest = parsed.arguments.rest;
  const restTokens = toStringArray(rawRest);
  const extRaw = parsed.options.ext;

  const extOption =
    typeof extRaw === 'string' && extRaw.trim().length > 0 ? extRaw : null;

  return { restTokens, extOption };
}

export function adaptTreeCommand(params: {
  alias: string;
  parsed: ParsedCliInvocation;
  command: CommandDefinition;
}) {
  const { restTokens, extOption } = parseTreeTokensFromParsed(params.parsed);

  const result = handleTreeCommand({
    restTokens,
    extOption,
  });

  if (result.type === 'error') {
    return createMessageRepresentation({
      command: params.alias,
      subcommand: 'tree',
      tone: 'error',
      text: result.text,
    });
  }

  return createMessageRepresentation({
    command: params.alias,
    subcommand: 'tree',
    tone: 'info',
    text: result.text,
  });
}
