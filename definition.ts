import { createHelpSubcommandDefinition } from '@src/commands/help/command';
import type { CommandDefinition } from '@src/system/command-definition';

import { bottomupDefinition } from './commands/bottomup/definition';
import { bottomupContextDefinition } from './commands/bottomup_context/definition';
import { diffDefinition } from './commands/diff/definition';
import { downloadDefinition } from './commands/download/definition';
import { searchDefinition } from './commands/search/definition';
import { summarizeDefinition } from './commands/summarize/definition';
import { topdownDefinition } from './commands/topdown/definition';
import { treeDefinition } from './commands/tree/definition';
import { uploadDefinition } from './commands/upload/definition';
import { viewDefinition } from './commands/view/definition';

export const commandDefinition = (
  prefix: string,
  alias: string,
): CommandDefinition => ({
  name: alias,
  summary:
    'Browse the workspace tree, diff and preview files, upload files encrypted for another bot (NIP-17), and download by naddr.',
  aliases: [],
  subcommands: [
    createHelpSubcommandDefinition(prefix, alias, {
      topicArgSummary:
        'Optional subcommand name: upload, download, tree, search, view, diff, bottomup, bottomup_context, summarize, or topdown.',
      exampleTopics: [
        'upload',
        'download',
        'tree',
        'search',
        'view',
        'diff',
        'bottomup',
        'bottomup_context',
        'summarize',
        'topdown',
      ],
    }),
    uploadDefinition(prefix, alias),
    downloadDefinition(prefix, alias),
    treeDefinition(prefix, alias),
    searchDefinition(prefix, alias),
    viewDefinition(prefix, alias),
    diffDefinition(prefix, alias),
    bottomupDefinition(prefix, alias),
    bottomupContextDefinition(prefix, alias),
    summarizeDefinition(prefix, alias),
    topdownDefinition(prefix, alias),
  ],
});
