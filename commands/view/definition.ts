import type { SubcommandDefinition } from '@src/system/command-definition';

export const viewDefinition = (
  prefix: string,
  alias: string,
): SubcommandDefinition => ({
  name: 'view',
  summary:
    'Preview a file under the workspace (path relative to workspace root).',
  aliases: [],
  arguments: [
    {
      name: 'path',
      summary: 'File path relative to workspace root.',
      kind: 'string',
      required: true,
      variadic: false,
    },
  ],
  options: [
    {
      name: 'previousDir',
      summary: 'Tree directory to return to in the web UI.',
      flag: '--previous-dir',
      kind: 'string',
      required: false,
      shortFlag: null,
    },
    {
      name: 'line',
      summary: 'Line number to highlight in the web file viewer.',
      flag: '--line',
      kind: 'integer',
      required: false,
      shortFlag: null,
    },
  ],
  examples: [
    `${prefix}${alias} view README.md`,
    `${prefix}${alias} view src/cli.ts`,
  ],
});
