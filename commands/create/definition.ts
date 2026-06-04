import type { SubcommandDefinition } from '@src/system/command-definition';

export const createDefinition = (
  prefix: string,
  alias: string,
): SubcommandDefinition => ({
  name: 'create',
  summary: 'Create an empty file or folder in a workspace directory.',
  aliases: [],
  arguments: [
    {
      name: 'dir',
      summary: 'Directory path relative to workspace root.',
      kind: 'string',
      required: true,
      variadic: false,
    },
    {
      name: 'name',
      summary: 'New file or folder name. Slashes are not allowed.',
      kind: 'string',
      required: true,
      variadic: false,
    },
  ],
  options: [
    {
      name: 'folder',
      summary: 'Create a folder instead of a file.',
      flag: '--folder',
      kind: 'boolean',
      required: false,
    },
    {
      name: 'treeDir',
      summary: 'Web UI tree directory to return to after creating the item.',
      flag: '--tree-dir',
      kind: 'string',
      required: false,
    },
    {
      name: 'ext',
      summary: 'Web UI extension filter to preserve after creating the file.',
      flag: '--ext',
      kind: 'string',
      required: false,
    },
    {
      name: 'expanded',
      summary:
        'Web UI expanded folder state to preserve after creating the item.',
      flag: '--expanded',
      kind: 'string',
      required: false,
    },
  ],
  examples: [`${prefix}${alias} create docs notes.md`],
});
