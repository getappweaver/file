import type { SubcommandDefinition } from '@src/system/command-definition';

export const diffDefinition = (
  prefix: string,
  alias: string,
): SubcommandDefinition => ({
  name: 'diff',
  summary: 'Show a simple git diff preview for one workspace path.',
  aliases: [],
  arguments: [
    {
      name: 'path',
      summary: 'File or folder path relative to workspace root.',
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
    {
      name: 'timeline',
      summary: 'Render web output with the timeline diff card.',
      flag: '--timeline',
      kind: 'boolean',
      required: false,
      shortFlag: null,
      choices: null,
    },
    {
      name: 'commit',
      summary: 'Commit hash to show as a timeline diff card.',
      flag: '--commit',
      kind: 'string',
      required: false,
      shortFlag: null,
      choices: null,
    },
    {
      name: 'repository',
      summary: 'Nested git repository path relative to workspace root.',
      flag: '--repository',
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
