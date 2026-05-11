import type { MessageSource } from '@src/messaging';
import { parseCliInput } from '@src/system/parser-cli';
import type { WebHandlerResult } from '@src/web/ui-schema';

import { adaptBottomupCommand } from './commands/bottomup/adapter';
import { adaptBottomupContextCommand } from './commands/bottomup_context/adapter';
import { adaptDiffCommand } from './commands/diff/adapter';
import { adaptDownloadCommand } from './commands/download/adapter';
import { adaptHelpCommand } from './commands/help/adapter';
import { getFileCommandDefinition } from './commands/help/module';
import { adaptHistoryCommand } from './commands/history/adapter';
import { adaptSearchCommand } from './commands/search/adapter';
import { adaptSummarizeCommand } from './commands/summarize/adapter';
import { adaptTopdownCommand } from './commands/topdown/adapter';
import { adaptTreeCommand } from './commands/tree/adapter';
import { adaptUploadCommand } from './commands/upload/adapter';
import { adaptViewCommand } from './commands/view/adapter';
import type { FileCommandAdapterParams } from './types/adapter-params';

type FileSubcommand =
  | 'help'
  | 'upload'
  | 'download'
  | 'tree'
  | 'search'
  | 'view'
  | 'diff'
  | 'history'
  | 'bottomup'
  | 'bottomup_context'
  | 'summarize'
  | 'topdown';

type MaybePromise<T> = T | Promise<T>;

type FileCommandAdapter = (
  params: FileCommandAdapterParams,
) => MaybePromise<WebHandlerResult>;

const normalizedDefinitions = new Map<
  string,
  ReturnType<typeof getFileCommandDefinition>
>();

const subcommandAdapters: Record<FileSubcommand, FileCommandAdapter> = {
  help: adaptHelpCommand,
  upload: adaptUploadCommand,
  download: adaptDownloadCommand,
  tree: adaptTreeCommand,
  search: adaptSearchCommand,
  view: adaptViewCommand,
  diff: adaptDiffCommand,
  history: adaptHistoryCommand,
  bottomup: adaptBottomupCommand,
  bottomup_context: adaptBottomupContextCommand,
  summarize: adaptSummarizeCommand,
  topdown: adaptTopdownCommand,
};

function getDefinitionKey(prefix: string, alias: string): string {
  return `${prefix}:${alias}`;
}

function getNormalizedDefinition(prefix: string, alias: string) {
  const key = getDefinitionKey(prefix, alias);
  const cached = normalizedDefinitions.get(key);

  if (cached) {
    return cached;
  }

  const normalized = getFileCommandDefinition(prefix, alias);

  normalizedDefinitions.set(key, normalized);

  return normalized;
}

function isFileSubcommand(value: string): value is FileSubcommand {
  return (
    value === 'help' ||
    value === 'upload' ||
    value === 'download' ||
    value === 'tree' ||
    value === 'search' ||
    value === 'view' ||
    value === 'diff' ||
    value === 'history' ||
    value === 'bottomup' ||
    value === 'bottomup_context' ||
    value === 'summarize' ||
    value === 'topdown'
  );
}

export async function handleFile(params: {
  args: string[];
  prefix: string;
  alias: string;
  source: MessageSource;
}): Promise<WebHandlerResult> {
  const normalizedArgs = params.args.length === 0 ? ['help'] : params.args;
  const subcommand = normalizedArgs[0]?.toLowerCase();

  if (!subcommand || !isFileSubcommand(subcommand)) {
    return `Unknown command: ${params.prefix}${params.alias} ${subcommand ?? 'unknown'}`;
  }

  try {
    const command = getNormalizedDefinition(params.prefix, params.alias);

    const parsed = parseCliInput({
      command,
      tokens: normalizedArgs,
      rawInput:
        `${params.prefix}${params.alias} ${normalizedArgs.join(' ')}`.trim(),
    });

    if (!isFileSubcommand(parsed.subcommand)) {
      return `Unknown command: ${params.prefix}${params.alias} ${parsed.subcommand}`;
    }

    const adapter = subcommandAdapters[parsed.subcommand];

    return await adapter({
      prefix: params.prefix,
      alias: params.alias,
      source: params.source,
      parsed,
      command,
    });
  } catch (err) {
    return String(err instanceof Error ? err.message : err);
  }
}
