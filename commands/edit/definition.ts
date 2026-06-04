import type { SubcommandDefinition } from '@src/system/command-definition';

export const editDefinition = (
  prefix: string,
  alias: string,
): SubcommandDefinition => ({
  name: 'edit',
  summary:
    'Overwrite a workspace text file with edited content and show a diff.',
  aliases: [],
  arguments: [
    {
      name: 'path',
      summary: 'File path relative to workspace root.',
      kind: 'string',
      required: true,
      variadic: false,
    },
    {
      name: 'content',
      summary: 'New file content.',
      kind: 'string',
      required: true,
      variadic: true,
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
  ],
  examples: [`${prefix}${alias} edit README.md "new content"`],
});
