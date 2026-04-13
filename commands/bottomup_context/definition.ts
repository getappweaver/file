import type { SubcommandDefinition } from '@src/system/command-definition';

export const bottomupContextDefinition = (
  prefix: string,
  alias: string,
): SubcommandDefinition => ({
  name: 'bottomup_context',
  summary:
    'Read existing bottom-up documentation for a folder, its parents, and child status.',
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
      name: 'parents',
      summary: 'How many parent folders to include.',
      flag: '--parents',
      shortFlag: null,
      kind: 'integer',
      required: false,
      choices: null,
    },
    {
      name: 'children',
      summary: 'How many child levels to inspect for `__BOTTOMUP.md` presence.',
      flag: '--children',
      shortFlag: null,
      kind: 'integer',
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
  ],
  examples: [
    `${prefix}${alias} bottomup_context`,
    `${prefix}${alias} bottomup_context plugins/file --scope-root plugins/file`,
    `${prefix}${alias} bottomup_context src --parents 3`,
    `${prefix}${alias} bottomup_context plugins/file --children 2`,
  ],
});
