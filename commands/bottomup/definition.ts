import type { SubcommandDefinition } from '@src/system/command-definition';

export const bottomupDefinition = (
  prefix: string,
  alias: string,
): SubcommandDefinition => ({
  name: 'bottomup',
  summary:
    'Generate local `__BOTTOMUP.md` files depth-first for a folder subtree.',
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
      summary: 'Override the model used to generate summaries.',
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
      name: 'twoPass',
      summary: 'After generating docs, run a second top-down pass using big-picture context to enrich summaries.',
      flag: '--two-pass',
      shortFlag: null,
      kind: 'boolean',
      required: false,
      choices: null,
    },
  ],
  examples: [
    `${prefix}${alias} bottomup`,
    `${prefix}${alias} bottomup src`,
    `${prefix}${alias} bottomup plugins/file --scope-root plugins/file`,
    `${prefix}${alias} bottomup src --depth 2`,
    `${prefix}${alias} bottomup docs --model openai/gpt-5.1`,
    `${prefix}${alias} bottomup plugins/file --scope-root plugins/file --two-pass`,
  ],
});
