import { createHelpSubcommandDefinition } from '@src/commands/help/command';
import type { CommandDefinition } from '@src/system/command-definition';

import {
  bottomupEnrichAcceptDefinition,
  bottomupEnrichDefinition,
  bottomupEnrichReviseDefinition,
} from './commands/bottomup-enrich/definition';
import {
  bottomupGenerateAcceptDefinition,
  bottomupGenerateDefinition,
  bottomupGenerateReviseDefinition,
} from './commands/bottomup-generate/definition';
import {
  bottomupSummarizeAcceptDefinition,
  bottomupSummarizeDefinition,
  bottomupSummarizeReviseDefinition,
} from './commands/bottomup-summarize/definition';
import {
  bottomupSummaryDefinition,
  bottomupSummarySaveDefinition,
} from './commands/bottomup-summary/definition';
import { commitDefinition } from './commands/commit/definition';
import { createDefinition } from './commands/create/definition';
import { deleteDefinition } from './commands/delete/definition';
import { diffDefinition } from './commands/diff/definition';
import { downloadDefinition } from './commands/download/definition';
import { editDefinition } from './commands/edit/definition';
import { historyDefinition } from './commands/history/definition';
import { initDefinition } from './commands/init/definition';
import { renameDefinition } from './commands/rename/definition';
import { restoreDefinition } from './commands/restore/definition';
import { searchDefinition } from './commands/search/definition';
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
        'Optional subcommand name: upload, download, tree, commit, create, delete, init, search, view, edit, rename, restore, diff, history, bottomup.generate, bottomup.summarize, bottomup.enrich, or bottomup.summary.',
      exampleTopics: [
        'upload',
        'download',
        'tree',
        'commit',
        'create',
        'delete',
        'init',
        'search',
        'view',
        'edit',
        'rename',
        'restore',
        'diff',
        'history',
        'bottomup.generate',
        'bottomup.summarize',
        'bottomup.summary',
        'bottomup.enrich',
      ],
    }),
    uploadDefinition(prefix, alias),
    downloadDefinition(prefix, alias),
    treeDefinition(prefix, alias),
    commitDefinition(prefix, alias),
    createDefinition(prefix, alias),
    deleteDefinition(prefix, alias),
    initDefinition(prefix, alias),
    searchDefinition(prefix, alias),
    viewDefinition(prefix, alias),
    editDefinition(prefix, alias),
    renameDefinition(prefix, alias),
    restoreDefinition(prefix, alias),
    diffDefinition(prefix, alias),
    historyDefinition(prefix, alias),
    bottomupGenerateDefinition(prefix, alias),
    bottomupGenerateReviseDefinition(prefix, alias),
    bottomupGenerateAcceptDefinition(prefix, alias),
    bottomupSummarizeDefinition(prefix, alias),
    bottomupSummarizeReviseDefinition(),
    bottomupSummarizeAcceptDefinition(),
    bottomupSummaryDefinition(prefix, alias),
    bottomupSummarySaveDefinition(),
    bottomupEnrichDefinition(prefix, alias),
    bottomupEnrichReviseDefinition(),
    bottomupEnrichAcceptDefinition(),
  ],
});
