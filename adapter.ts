import type { MessageSource } from '@src/messaging';
import { parseCliInput } from '@src/system/parser-cli';
import type { WebNodeRoot } from '@src/web/ui-schema';

import { adaptBottomupCommand } from './commands/bottomup/adapter';
import { adaptBottomupContextCommand } from './commands/bottomup_context/adapter';
import { adaptDiffCommand } from './commands/diff/adapter';
import {
  defaultDiffMaxBytes,
  handleDiffCommand,
} from './commands/diff/handler';
import { renderFileDiffWeb } from './commands/diff/renderers/web';
import { adaptDownloadCommand } from './commands/download/adapter';
import { adaptHelpCommand } from './commands/help/adapter';
import { getFileCommandDefinition } from './commands/help/module';
import { resolveFileWorkspaceRoot } from './commands/shared/workspace-root';
import { adaptSummarizeCommand } from './commands/summarize/adapter';
import { adaptTopdownCommand } from './commands/topdown/adapter';
import {
  adaptTreeCommand,
  parseTreeTokensFromParsed,
} from './commands/tree/adapter';
import { renderFileTreeBrowserWeb } from './commands/tree/renderers/web';
import {
  listWorkspaceDirectoryEntries,
  parseTreeCliArgs,
} from './commands/tree/workspace-tree';
import { adaptUploadCommand } from './commands/upload/adapter';
import { adaptViewCommand } from './commands/view/adapter';
import {
  defaultViewMaxBytes,
  handleViewCommand,
} from './commands/view/handler';
import { renderFileViewWeb } from './commands/view/renderers/web';
import { createMessageRepresentation } from './output/message/builder';
import { renderFileText, type FileTextRepresentation } from './renderers/text';

type FileSubcommand =
  | 'help'
  | 'upload'
  | 'download'
  | 'tree'
  | 'view'
  | 'diff'
  | 'bottomup'
  | 'bottomup_context'
  | 'summarize'
  | 'topdown';

type MaybePromise<T> = T | Promise<T>;

type FileCommandAdapter = (params: {
  prefix: string;
  alias: string;
  parsed: ReturnType<typeof parseCliInput>;
  command: ReturnType<typeof getFileCommandDefinition>;
}) => MaybePromise<FileTextRepresentation>;

const normalizedDefinitions = new Map<
  string,
  ReturnType<typeof getFileCommandDefinition>
>();

const subcommandAdapters: Record<FileSubcommand, FileCommandAdapter> = {
  help: adaptHelpCommand,
  upload: adaptUploadCommand,
  download: adaptDownloadCommand,
  tree: adaptTreeCommand,
  view: adaptViewCommand,
  diff: adaptDiffCommand,
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
    value === 'view' ||
    value === 'diff' ||
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
}): Promise<string | WebNodeRoot> {
  const normalizedArgs = params.args.length === 0 ? ['help'] : params.args;
  const subcommand = normalizedArgs[0]?.toLowerCase();

  const commandNotFound = createMessageRepresentation({
    command: params.alias,
    subcommand: subcommand ?? 'unknown',
    tone: 'error',
    text: `Unknown command: ${params.prefix}${params.alias} ${subcommand ?? 'unknown'}`,
  });

  if (!subcommand || !isFileSubcommand(subcommand)) {
    return renderFileText(commandNotFound, {
      prefix: params.prefix,
    });
  }

  let representation: FileTextRepresentation;

  try {
    const command = getNormalizedDefinition(params.prefix, params.alias);

    const parsed = parseCliInput({
      command,
      tokens: normalizedArgs,
      rawInput:
        `${params.prefix}${params.alias} ${normalizedArgs.join(' ')}`.trim(),
    });

    if (!isFileSubcommand(parsed.subcommand)) {
      return renderFileText(commandNotFound, {
        prefix: params.prefix,
      });
    }

    if (params.source === 'web' && parsed.subcommand === 'tree') {
      const { restTokens, extOption, expandedOption } =
        parseTreeTokensFromParsed(parsed);

      const merged = [
        ...restTokens,
        ...(extOption !== null ? ['--ext', extOption] : []),
        ...(expandedOption !== null ? ['--expanded', expandedOption] : []),
      ];

      const {
        maxDepth,
        maxDepthExplicit,
        targetDirRelative,
        extFilter,
        expandedPaths,
      } = parseTreeCliArgs(merged);

      const workspaceRoot = resolveFileWorkspaceRoot();

      const listMaxDepth = maxDepthExplicit ? maxDepth : 0;

      const list = listWorkspaceDirectoryEntries({
        workspaceRoot,
        targetDirRelative,
        extFilter,
        maxDepth: listMaxDepth,
        expandedPaths,
      });

      return renderFileTreeBrowserWeb({
        commandAlias: params.alias,
        list,
        extOption,
        expandedPaths,
      });
    }

    if (params.source === 'web' && parsed.subcommand === 'view') {
      const pathRaw = parsed.arguments.path;
      const previousDirRaw = parsed.options.previousDir;

      const path =
        typeof pathRaw === 'string' && pathRaw.trim().length > 0
          ? pathRaw.trim()
          : null;

      const previousDir =
        typeof previousDirRaw === 'string' && previousDirRaw.trim().length > 0
          ? previousDirRaw.trim()
          : null;

      if (path === null) {
        return renderFileViewWeb({
          commandAlias: params.alias,
          result: { type: 'error', text: 'Missing required path argument.' },
          previousDir,
        });
      }

      const workspaceRoot = resolveFileWorkspaceRoot();

      const viewResult = handleViewCommand({
        workspaceRoot,
        relativePath: path,
        maxBytes: defaultViewMaxBytes(),
      });

      return renderFileViewWeb({
        commandAlias: params.alias,
        result: viewResult,
        previousDir,
      });
    }

    if (params.source === 'web' && parsed.subcommand === 'diff') {
      const pathRaw = parsed.arguments.path;
      const previousDirRaw = parsed.options.previousDir;

      const path =
        typeof pathRaw === 'string' && pathRaw.trim().length > 0
          ? pathRaw.trim()
          : null;

      const previousDir =
        typeof previousDirRaw === 'string' && previousDirRaw.trim().length > 0
          ? previousDirRaw.trim()
          : null;

      if (path === null) {
        return renderFileDiffWeb({
          commandAlias: params.alias,
          result: { type: 'error', text: 'Missing required path argument.' },
          previousDir,
        });
      }

      const workspaceRoot = resolveFileWorkspaceRoot();

      const diffResult = handleDiffCommand({
        workspaceRoot,
        relativePath: path,
        maxBytes: defaultDiffMaxBytes(),
      });

      return renderFileDiffWeb({
        commandAlias: params.alias,
        result: diffResult,
        previousDir,
      });
    }

    const adapter = subcommandAdapters[parsed.subcommand];

    if (!adapter) {
      return renderFileText(commandNotFound, {
        prefix: params.prefix,
      });
    }

    representation = await adapter({
      prefix: params.prefix,
      alias: params.alias,
      parsed,
      command,
    });
  } catch (err) {
    representation = createMessageRepresentation({
      command: params.alias,
      subcommand: subcommand ?? 'unknown',
      tone: 'error',
      text: String(err instanceof Error ? err.message : err),
    });
  }

  return renderFileText(representation, {
    prefix: params.prefix,
  });
}
