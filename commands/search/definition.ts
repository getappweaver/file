import type { SubcommandDefinition } from '@src/system/command-definition';

export const searchDefinition = (
  prefix: string,
  alias: string,
): SubcommandDefinition => ({
  name: 'search',
  summary:
    'Search file contents under the workspace with optional extension and folder filters.',
  aliases: [],
  arguments: [
    {
      name: 'keyword',
      summary: 'Text or regex pattern to search for.',
      kind: 'string',
      required: true,
      variadic: false,
    },
  ],
  options: [
    {
      name: 'ext',
      summary: 'Comma-separated extensions (e.g. txt,md or .ts,.tsx).',
      flag: '--ext',
      kind: 'string',
      required: false,
      shortFlag: null,
    },
    {
      name: 'path',
      summary: 'Directory to search, relative to workspace root.',
      flag: '--path',
      kind: 'string',
      required: false,
      shortFlag: null,
    },
  ],
  examples: [
    `${prefix}${alias} search TODO`,
    `${prefix}${alias} search nostr --ext md,txt`,
    `${prefix}${alias} search WebNode --path src --ext ts,tsx`,
  ],
});
