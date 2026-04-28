import type { SubcommandDefinition } from '@src/system/command-definition';

export const topdownDefinition = (
  prefix: string,
  alias: string,
): SubcommandDefinition => ({
  name: 'topdown',
  summary:
    'Enrich existing __BOTTOMUP.md files using __BOTTOMUP_SUMMARY.md context.',
  aliases: [],
  arguments: [
    {
      name: 'workingDir',
      summary:
        'Folder relative to workspace root. Omit for the workspace root.',
      kind: 'string',
      required: false,
      variadic: false,
    },
  ],
  options: [
    {
      name: 'scopeRoot',
      summary: 'Logical documentation root relative to workspace root.',
      flag: '--scope-root',
      shortFlag: null,
      kind: 'string',
      required: false,
      choices: null,
    },
    {
      name: 'depth',
      summary: 'Maximum recursive depth. Omit for unlimited.',
      flag: '--depth',
      shortFlag: null,
      kind: 'integer',
      required: false,
      choices: null,
    },
    {
      name: 'model',
      summary: 'Override the model used to enrich summaries.',
      flag: '--model',
      shortFlag: null,
      kind: 'string',
      required: false,
      choices: null,
    },
    {
      name: 'ignore',
      summary: 'Comma-separated extra ignore patterns.',
      flag: '--ignore',
      shortFlag: null,
      kind: 'string',
      required: false,
      choices: null,
    },
    {
      name: 'includeHidden',
      summary: 'Include hidden files and directories.',
      flag: '--include-hidden',
      shortFlag: null,
      kind: 'boolean',
      required: false,
      choices: null,
    },
    {
      name: 'noGitignore',
      summary: 'Do not respect `.gitignore` rules.',
      flag: '--no-gitignore',
      shortFlag: null,
      kind: 'boolean',
      required: false,
      choices: null,
    },
    {
      name: 'force',
      summary:
        'Run even when summary/doc enrichment metadata is stale or present.',
      flag: '--force',
      shortFlag: null,
      kind: 'boolean',
      required: false,
      choices: null,
    },
  ],
  examples: [
    `${prefix}${alias} topdown`,
    `${prefix}${alias} topdown plugins/file --scope-root plugins/file`,
    `${prefix}${alias} topdown src --depth 2`,
    `${prefix}${alias} topdown plugins/file --force`,
  ],
});
