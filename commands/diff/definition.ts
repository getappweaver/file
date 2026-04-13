import type { SubcommandDefinition } from '@src/system/command-definition';

export const diffDefinition = (
  prefix: string,
  alias: string,
): SubcommandDefinition => ({
  name: 'diff',
  summary: 'Show a simple git diff preview for one workspace file.',
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
      choices: null,
    },
  ],
  examples: [
    `${prefix}${alias} diff README.md`,
    `${prefix}${alias} diff src/cli.ts`,
  ],
});
