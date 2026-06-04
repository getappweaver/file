import { createHelpSubcommandDefinition } from '@src/commands/help/command';
import type { CommandDefinition } from '@src/system/command-definition';

import { bottomupDefinition } from './commands/bottomup/definition';
import { bottomupContextDefinition } from './commands/bottomup_context/definition';
import { commitDefinition } from './commands/commit/definition';
import { createDefinition } from './commands/create/definition';
import { deleteDefinition } from './commands/delete/definition';
import { diffDefinition } from './commands/diff/definition';
import { downloadDefinition } from './commands/download/definition';
import { editDefinition } from './commands/edit/definition';
import { historyDefinition } from './commands/history/definition';
import { renameDefinition } from './commands/rename/definition';
import { restoreDefinition } from './commands/restore/definition';
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
    'Browse the workspace tree, inspect git history, diff and preview files, upload files encrypted for another AppWeaver bot (NIP-17), and download by naddr.',
  aliases: [],
  subcommands: [
    createHelpSubcommandDefinition(prefix, alias, {
      topicArgSummary:
        'Optional subcommand name: upload, download, tree, commit, create, delete, search, view, edit, rename, restore, diff, history, bottomup, bottomup_context, summarize, or topdown.',
      exampleTopics: [
        'upload',
        'download',
        'tree',
        'commit',
        'create',
        'delete',
        'search',
        'view',
        'edit',
        'rename',
        'restore',
        'diff',
        'history',
        'bottomup',
        'bottomup_context',
        'summarize',
        'topdown',
      ],
    }),
    uploadDefinition(prefix, alias),
    downloadDefinition(prefix, alias),
    treeDefinition(prefix, alias),
    commitDefinition(prefix, alias),
    createDefinition(prefix, alias),
    deleteDefinition(prefix, alias),
    searchDefinition(prefix, alias),
    viewDefinition(prefix, alias),
    editDefinition(prefix, alias),
    renameDefinition(prefix, alias),
    restoreDefinition(prefix, alias),
    diffDefinition(prefix, alias),
    historyDefinition(prefix, alias),
    bottomupDefinition(prefix, alias),
    bottomupContextDefinition(prefix, alias),
    summarizeDefinition(prefix, alias),
    topdownDefinition(prefix, alias),
  ],
});
