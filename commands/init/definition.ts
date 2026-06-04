import type { SubcommandDefinition } from '@src/system/command-definition';

export const initDefinition = (
  prefix: string,
  alias: string,
): SubcommandDefinition => ({
  name: 'init',
  summary: 'Initialize a Git repository in the workspace.',
  aliases: ['git-init'],
  arguments: [],
  options: [],
  examples: [`${prefix}${alias} init`],
});
