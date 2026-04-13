import type { SubcommandDefinition } from '@src/system/command-definition';

export const uploadDefinition = (
  prefix: string,
  alias: string,
): SubcommandDefinition => ({
  name: 'upload',
  summary:
    'Encrypt and upload a workspace file for another bot (Blossom + NIP-17).',
  aliases: [],
  arguments: [
    {
      name: 'filePath',
      summary: 'Path relative to the active workspace root.',
      kind: 'string',
      required: false,
    },
    {
      name: 'recipientNpub',
      summary: 'Recipient bot npub (npub1…).',
      kind: 'string',
      required: false,
    },
  ],
  options: [],
  examples: [
    `${prefix}${alias} upload README.md npub1abcdef…`,
    `${prefix}${alias} upload docs/notes.md npub1…`,
  ],
});
