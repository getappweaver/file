import type { SubcommandDefinition } from '@src/system/command-definition';

export const historyDefinition = (
  prefix: string,
  alias: string,
): SubcommandDefinition => ({
  name: 'history',
  summary: 'Show recent git commits for one workspace path.',
  aliases: [],
  arguments: [
    {
      name: 'path',
      summary:
        'File or folder path relative to workspace root. Defaults to workspace root.',
      kind: 'string',
      required: false,
      variadic: false,
    },
  ],
  options: [],
  examples: [
    `${prefix}${alias} history`,
    `${prefix}${alias} history README.md`,
    `${prefix}${alias} history src`,
  ],
});
