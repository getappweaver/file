import type { SubcommandDefinition } from '@src/system/command-definition';

export const treeDefinition = (
  prefix: string,
  alias: string,
): SubcommandDefinition => ({
  name: 'tree',
  summary:
    'Print a text tree of the workspace (depth, folder, extension filter). Web UI defaults to depth 1 (shows one nested level); pass 0 for a flat list only.',
  aliases: [],
  arguments: [
    {
      name: 'rest',
      summary:
        'Optional max depth, target directory (relative), and other tree tokens.',
      kind: 'string',
      required: false,
      variadic: true,
    },
  ],
  options: [
    {
      name: 'ext',
      summary: 'Comma-separated extensions (e.g. ts,tsx or .ts,.tsx).',
      flag: '--ext',
      kind: 'string',
      required: false,
    },
  ],
  examples: [
    `${prefix}${alias} tree`,
    `${prefix}${alias} tree 0`,
    `${prefix}${alias} tree 3 src`,
    `${prefix}${alias} tree plugins --ext ts`,
    `${prefix}${alias} tree --ext ts,tsx`,
  ],
  webHeaderWidget: {
    label: 'Tree',
    modalTitle: 'Workspace tree',
  },
});
