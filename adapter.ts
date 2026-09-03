import type { MessageSource } from '@src/messaging';
import type { ParsedCliInvocation } from '@src/system/parser-cli';
import { parseCliInput } from '@src/system/parser-cli';
import type { WebHandlerResult } from '@src/web/ui-schema';

import {
  adaptBottomupEnrichAcceptCommand,
  adaptBottomupEnrichCommand,
  adaptBottomupEnrichReviseCommand,
} from './commands/bottomup-enrich/adapter';
import { adaptBottomupGenerateCommand } from './commands/bottomup-generate/adapter';
import {
  adaptBottomupGenerateAcceptCommand,
  adaptBottomupGenerateReviseCommand,
} from './commands/bottomup-generate/draft-adapter';
import {
  adaptBottomupSummarizeAcceptCommand,
  adaptBottomupSummarizeCommand,
  adaptBottomupSummarizeReviseCommand,
} from './commands/bottomup-summarize/adapter';
import {
  adaptBottomupSummaryCommand,
  adaptBottomupSummarySaveCommand,
} from './commands/bottomup-summary/adapter';
import { adaptCommitCommand } from './commands/commit/adapter';
import { adaptCreateCommand } from './commands/create/adapter';
import { adaptDeleteCommand } from './commands/delete/adapter';
import { adaptDiffCommand } from './commands/diff/adapter';
import { adaptDownloadCommand } from './commands/download/adapter';
import { adaptEditCommand } from './commands/edit/adapter';
import { adaptHelpCommand } from './commands/help/adapter';
import { getFileCommandDefinition } from './commands/help/module';
import { adaptHistoryCommand } from './commands/history/adapter';
import { adaptInitCommand } from './commands/init/adapter';
import { adaptRenameCommand } from './commands/rename/adapter';
import { adaptRestoreCommand } from './commands/restore/adapter';
import { adaptSearchCommand } from './commands/search/adapter';
import { adaptTreeCommand } from './commands/tree/adapter';
import { adaptUploadCommand } from './commands/upload/adapter';
import { adaptViewCommand } from './commands/view/adapter';
import type { FileCommandAdapterParams } from './types/adapter-params';

type FileSubcommand =
  | 'help'
  | 'upload'
  | 'download'
  | 'tree'
  | 'commit'
  | 'create'
  | 'delete'
  | 'init'
  | 'search'
  | 'view'
  | 'edit'
  | 'rename'
  | 'restore'
  | 'diff'
  | 'history'
  | 'bottomup.generate'
  | 'bottomup.generate.revise'
  | 'bottomup.generate.accept'
  | 'bottomup.summarize'
  | 'bottomup.summarize.revise'
  | 'bottomup.summarize.accept'
  | 'bottomup.summary'
  | 'bottomup.summary.save'
  | 'bottomup.enrich'
  | 'bottomup.enrich.revise'
  | 'bottomup.enrich.accept';

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
  commit: adaptCommitCommand,
  create: adaptCreateCommand,
  delete: adaptDeleteCommand,
  init: adaptInitCommand,
  search: adaptSearchCommand,
  view: adaptViewCommand,
  edit: adaptEditCommand,
  rename: adaptRenameCommand,
  restore: adaptRestoreCommand,
  diff: adaptDiffCommand,
  history: adaptHistoryCommand,
  'bottomup.generate': adaptBottomupGenerateCommand,
  'bottomup.generate.revise': adaptBottomupGenerateReviseCommand,
  'bottomup.generate.accept': adaptBottomupGenerateAcceptCommand,
  'bottomup.summarize': adaptBottomupSummarizeCommand,
  'bottomup.summarize.revise': adaptBottomupSummarizeReviseCommand,
  'bottomup.summarize.accept': adaptBottomupSummarizeAcceptCommand,
  'bottomup.summary': adaptBottomupSummaryCommand,
  'bottomup.summary.save': adaptBottomupSummarySaveCommand,
  'bottomup.enrich': adaptBottomupEnrichCommand,
  'bottomup.enrich.revise': adaptBottomupEnrichReviseCommand,
  'bottomup.enrich.accept': adaptBottomupEnrichAcceptCommand,
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
    value === 'commit' ||
    value === 'create' ||
    value === 'delete' ||
    value === 'init' ||
    value === 'search' ||
    value === 'view' ||
    value === 'edit' ||
    value === 'rename' ||
    value === 'restore' ||
    value === 'diff' ||
    value === 'history' ||
    value === 'bottomup.generate' ||
    value === 'bottomup.generate.revise' ||
    value === 'bottomup.generate.accept' ||
    value === 'bottomup.summarize' ||
    value === 'bottomup.summarize.revise' ||
    value === 'bottomup.summarize.accept' ||
    value === 'bottomup.summary' ||
    value === 'bottomup.summary.save' ||
    value === 'bottomup.enrich' ||
    value === 'bottomup.enrich.revise' ||
    value === 'bottomup.enrich.accept'
  );
}

export async function handleFile(params: {
  args: string[];
  prefix: string;
  alias: string;
  source: MessageSource;
  jsonPayload: unknown;
}): Promise<WebHandlerResult> {
  const normalizedArgs = params.args.length === 0 ? ['help'] : params.args;
  const subcommand = normalizedArgs[0]?.toLowerCase();

  if (!subcommand || !isFileSubcommand(subcommand)) {
    return `Unknown command: ${params.prefix}${params.alias} ${subcommand ?? 'unknown'}`;
  }

  try {
    const command = getNormalizedDefinition(params.prefix, params.alias);

    const jsonParsed = parseFileInvocationFromJsonPayload({
      alias: params.alias,
      jsonPayload: params.jsonPayload,
      prefix: params.prefix,
      subcommand,
    });

    const argsParsed = parsedEditInvocationFromArgs({
      alias: params.alias,
      normalizedArgs,
      prefix: params.prefix,
      subcommand,
    });

    const parsed =
      jsonParsed ??
      argsParsed ??
      parseCliInput({
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
      jsonPayload: params.jsonPayload,
    });
  } catch (err) {
    return String(err instanceof Error ? err.message : err);
  }
}

function parsedEditInvocationFromArgs(props: {
  alias: string;
  normalizedArgs: string[];
  prefix: string;
  subcommand: string | undefined;
}): ParsedCliInvocation | null {
  if (props.subcommand !== 'edit') {
    return null;
  }

  const path = props.normalizedArgs[1];
  const contentParts: string[] = [];
  const options: Record<string, string> = {};

  for (let index = 2; index < props.normalizedArgs.length; index++) {
    const token = props.normalizedArgs[index]!;

    if (token === '--previous-dir') {
      const value = props.normalizedArgs[index + 1];

      if (value !== undefined) {
        options.previousDir = value;
        index++;
      }

      continue;
    }

    contentParts.push(token);
  }

  if (path === undefined || contentParts.length === 0) {
    return null;
  }

  return {
    command: props.alias,
    subcommand: 'edit',
    arguments: { path, content: contentParts.join(' ') },
    options,
    raw: {
      input: `${props.prefix}${props.alias} ${props.normalizedArgs.join(' ')}`,
      tokens: props.normalizedArgs,
    },
  };
}

type ParsedJsonRecord = Record<
  string,
  string | number | boolean | Array<string | number | boolean>
>;

function isParsedJsonValue(
  value: unknown,
): value is string | number | boolean | Array<string | number | boolean> {
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return true;
  }

  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === 'string' ||
        typeof item === 'number' ||
        typeof item === 'boolean',
    )
  );
}

function parsedJsonRecordFrom(value: unknown): ParsedJsonRecord {
  if (typeof value !== 'object' || value === null) {
    return {};
  }

  const record: ParsedJsonRecord = {};

  for (const [key, entry] of Object.entries(value)) {
    if (isParsedJsonValue(entry)) {
      record[key] = entry;
    }
  }

  return record;
}

export function parseFileInvocationFromJsonPayload(props: {
  alias: string;
  jsonPayload: unknown;
  prefix: string;
  subcommand: string | undefined;
}): ParsedCliInvocation | null {
  if (typeof props.jsonPayload !== 'object' || props.jsonPayload === null) {
    return null;
  }

  const payload = props.jsonPayload as Record<string, unknown>;

  const argsSource =
    typeof payload.arguments === 'object' && payload.arguments !== null
      ? payload.arguments
      : payload;

  const parsedArguments = parsedJsonRecordFrom(argsSource);
  const parsedOptions = parsedJsonRecordFrom(payload.options);

  if (
    Object.keys(parsedArguments).length === 0 &&
    Object.keys(parsedOptions).length === 0
  ) {
    return null;
  }

  return {
    command: props.alias,
    subcommand: props.subcommand ?? 'help',
    arguments: parsedArguments,
    options: parsedOptions,
    raw: {
      input: `${props.prefix}${props.alias} ${props.subcommand ?? 'help'}`,
      tokens: [props.subcommand ?? 'help'],
    },
  };
}
