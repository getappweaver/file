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
      summary:
        'Literal text to search for. Use --regex to treat it as a regex pattern.',
      kind: 'string',
      required: true,
      variadic: true,
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
    {
      name: 'regex',
      summary: 'Treat keyword as a regular expression instead of literal text.',
      flag: '--regex',
      kind: 'boolean',
      required: false,
      shortFlag: null,
    },
  ],
  examples: [
    `${prefix}${alias} search TODO`,
    `${prefix}${alias} search project notes`,
    `${prefix}${alias} search nostr --ext md,txt`,
    `${prefix}${alias} search meeting agenda --path docs`,
    `${prefix}${alias} search invoice|receipt --regex`,
  ],
});
