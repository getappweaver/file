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
} {
  const rawRest = parsed.arguments.rest;
  const restTokens = toStringArray(rawRest);
  const extRaw = parsed.options.ext;
  const expandedRaw = parsed.options.expanded;

  const extOption =
    typeof extRaw === 'string' && extRaw.trim().length > 0 ? extRaw : null;

  const expandedOption =
    typeof expandedRaw === 'string' && expandedRaw.trim().length > 0
      ? expandedRaw
      : null;

  return { restTokens, extOption, expandedOption };
}

export function adaptTreeCommand(
  params: FileCommandAdapterParams,
): string | WebNodeRoot {
  const { restTokens, extOption } = parseTreeTokensFromParsed(params.parsed);
  const expandedRaw = params.parsed.options.expanded;

  const expandedOption =
    typeof expandedRaw === 'string' && expandedRaw.trim().length > 0
      ? expandedRaw
      : null;

  if (params.source === 'web') {
    const merged = [
      ...restTokens,
      ...(extOption !== null ? ['--ext', extOption] : []),
      ...(expandedOption !== null ? ['--expanded', expandedOption] : []),
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
      commandAlias: params.alias,
      list,
      extOption,
      expandedPaths,
    });
  }

  const result = handleTreeCommand({
    restTokens,
    extOption,
  });

  return result.text;
}
