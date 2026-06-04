import type { ParsedCliInvocation } from '@src/system/parser-cli';
import type { WebNodeRoot } from '@src/web/ui-schema';

import type { FileCommandAdapterParams } from '../../types/adapter-params';

import { resolveFileWorkspaceRoot } from '../shared/workspace-root';

import { handleTreeCommand } from './handler';
import { renderFileTreeBrowserWeb } from './renderers/web';
import {
  listWorkspaceDirectoryEntries,
  parseTreeCliArgs,
} from './workspace-tree';

type RenderTreeForWebProps = {
  commandAlias: string;
  targetDirRelative: string | null;
  extOption: string | null;
  expandedOption: string | null;
  revealPath: string | null;
};

export function renderTreeForWeb(props: RenderTreeForWebProps): WebNodeRoot {
  const merged = [
    ...(props.targetDirRelative === null ? [] : [props.targetDirRelative]),
    ...(props.extOption !== null ? ['--ext', props.extOption] : []),
    ...(props.expandedOption !== null
      ? ['--expanded', props.expandedOption]
      : []),
  ];

  const { targetDirRelative, extFilter, expandedPaths } =
    parseTreeCliArgs(merged);

  const workspaceRoot = resolveFileWorkspaceRoot();
  const listMaxDepth = Number.POSITIVE_INFINITY;

  const list = listWorkspaceDirectoryEntries({
    workspaceRoot,
    targetDirRelative,
    extFilter,
    maxDepth: listMaxDepth,
    expandedPaths,
  });

  return renderFileTreeBrowserWeb({
    commandAlias: props.commandAlias,
    list,
    extOption: props.extOption,
    expandedPaths,
    revealPath: props.revealPath,
  });
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => String(v));
  }

  return [];
}

export function parseTreeTokensFromParsed(parsed: ParsedCliInvocation): {
  restTokens: string[];
  extOption: string | null;
  expandedOption: string | null;
  revealOption: string | null;
} {
  const rawRest = parsed.arguments.rest;
  const restTokens = toStringArray(rawRest);
  const extRaw = parsed.options.ext;
  const expandedRaw = parsed.options.expanded;
  const revealRaw = parsed.options.reveal;

  const extOption =
    typeof extRaw === 'string' && extRaw.trim().length > 0 ? extRaw : null;

  const expandedOption =
    typeof expandedRaw === 'string' && expandedRaw.trim().length > 0
      ? expandedRaw
      : null;

  const revealOption =
    typeof revealRaw === 'string' && revealRaw.trim().length > 0
      ? revealRaw.trim()
      : null;

  return { restTokens, extOption, expandedOption, revealOption };
}

export function adaptTreeCommand(
  params: FileCommandAdapterParams,
): string | WebNodeRoot {
  const { restTokens, extOption, revealOption } = parseTreeTokensFromParsed(
    params.parsed,
  );

  const expandedRaw = params.parsed.options.expanded;

  const expandedOption =
    typeof expandedRaw === 'string' && expandedRaw.trim().length > 0
      ? expandedRaw
      : null;

  if (params.source === 'web') {
    return renderTreeForWeb({
      commandAlias: params.alias,
      targetDirRelative: restTokens[0] ?? null,
      extOption,
      expandedOption,
      revealPath: revealOption,
    });
  }

  const result = handleTreeCommand({
    restTokens,
    extOption,
  });

  return result.text;
}
