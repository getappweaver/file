import type { SubcommandDefinition } from '@src/system/command-definition';

export const renameDefinition = (
  prefix: string,
  alias: string,
): SubcommandDefinition => ({
  name: 'rename',
  summary: 'Rename a workspace file or folder within its current directory.',
  aliases: [],
  arguments: [
    {
      name: 'path',
      summary: 'Existing file or folder path relative to workspace root.',
      kind: 'string',
      required: true,
      variadic: false,
    },
    {
      name: 'name',
      summary: 'New filename or folder name. Slashes are not allowed.',
      kind: 'string',
      required: true,
      variadic: false,
    },
  ],
  options: [
    {
      name: 'treeDir',
      summary: 'Web UI tree directory to return to after renaming.',
      flag: '--tree-dir',
      kind: 'string',
      required: false,
    },
    {
      name: 'ext',
      summary: 'Web UI extension filter to preserve after renaming.',
      flag: '--ext',
      kind: 'string',
      required: false,
    },
    {
      name: 'expanded',
      summary: 'Web UI expanded folder state to preserve after renaming.',
      flag: '--expanded',
      kind: 'string',
      required: false,
    },
  ],
  examples: [`${prefix}${alias} rename docs/old.md new.md`],
});
