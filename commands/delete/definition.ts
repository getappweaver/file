import type { SubcommandDefinition } from '@src/system/command-definition';

export const deleteDefinition = (
  prefix: string,
  alias: string,
): SubcommandDefinition => ({
  name: 'delete',
  summary: 'Delete a workspace file or folder.',
  aliases: ['remove'],
  arguments: [
    {
      name: 'path',
      summary: 'Existing file or folder path relative to workspace root.',
      kind: 'string',
      required: true,
      variadic: false,
    },
  ],
  options: [
    {
      name: 'treeDir',
      summary: 'Web UI tree directory to return to after deleting.',
      flag: '--tree-dir',
      kind: 'string',
      required: false,
    },
    {
      name: 'ext',
      summary: 'Web UI extension filter to preserve after deleting.',
      flag: '--ext',
      kind: 'string',
      required: false,
    },
    {
      name: 'expanded',
      summary: 'Web UI expanded folder state to preserve after deleting.',
      flag: '--expanded',
      kind: 'string',
      required: false,
    },
  ],
  examples: [`${prefix}${alias} delete docs/old.md`],
});
