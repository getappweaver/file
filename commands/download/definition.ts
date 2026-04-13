import type { SubcommandDefinition } from '@src/system/command-definition';

export const downloadDefinition = (
  prefix: string,
  alias: string,
): SubcommandDefinition => ({
  name: 'download',
  summary: 'Download and decrypt a shared file by naddr into the workspace.',
  aliases: [],
  arguments: [
    {
      name: 'naddr',
      summary: 'Note address (naddr1…) of the file share.',
      kind: 'string',
      required: false,
    },
  ],
  options: [],
  examples: [
    `${prefix}${alias} download naddr1qqyg8x2xx…`,
    `${prefix}${alias} download naddr1…`,
  ],
});
