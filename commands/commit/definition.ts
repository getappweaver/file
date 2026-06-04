import type { SubcommandDefinition } from '@src/system/command-definition';

export const commitDefinition = (
  prefix: string,
  alias: string,
): SubcommandDefinition => ({
  name: 'commit',
  summary: 'Commit selected git diff files with a message.',
  aliases: [],
  arguments: [
    {
      name: 'message',
      summary: 'Commit message.',
      kind: 'string',
      required: true,
      variadic: true,
    },
  ],
  options: [],
  examples: [`${prefix}${alias} commit "Update files"`],
});
