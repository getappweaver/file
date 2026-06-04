import type { SubcommandDefinition } from '@src/system/command-definition';

export const restoreDefinition = (
  prefix: string,
  alias: string,
): SubcommandDefinition => ({
  name: 'restore',
  summary:
    'Restore one changed git file to HEAD, deleting it if it is untracked or newly added.',
  aliases: [],
  arguments: [
    {
      name: 'file',
      summary: 'Changed file path relative to workspace root.',
      kind: 'string',
      required: true,
      variadic: false,
    },
  ],
  options: [],
  examples: [`${prefix}${alias} restore README.md`],
});
