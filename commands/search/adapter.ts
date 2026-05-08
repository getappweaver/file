import type { WebNodeRoot } from '@src/web/ui-schema';

import type { FileCommandAdapterParams } from '../../types/adapter-params';

import { resolveFileWorkspaceRoot } from '../shared/workspace-root';

import { handleSearchCommand, type FileSearchResult } from './handler';
import { renderFileSearchWeb } from './renderers/web';

function searchResultToCliText(result: FileSearchResult): string {
  if (result.type === 'error') {
    return result.text;
  }

  if (result.matches.length === 0) {
    return `No matches for ${JSON.stringify(result.keyword)}.`;
  }

  const lines = [
    `Matches for ${JSON.stringify(result.keyword)} (${result.matches.length}${result.truncated ? '+' : ''}):`,
  ];

  for (const match of result.matches) {
    lines.push(
      `${match.path}:${match.lineNumber}:${match.column}: ${match.line.trim()}`,
    );
  }

  if (result.truncated) {
    lines.push(``, `Results truncated to ${result.limit} matches.`);
  }

  return lines.join('\n');
}

export async function adaptSearchCommand(
  params: FileCommandAdapterParams,
): Promise<string | WebNodeRoot> {
  const keywordRaw = params.parsed.arguments.keyword;

  const keyword = (() => {
    if (typeof keywordRaw === 'string' && keywordRaw.trim().length > 0) {
      return keywordRaw.trim();
    }

    if (Array.isArray(keywordRaw)) {
      return (
        keywordRaw
          .filter((item): item is string => typeof item === 'string')
          .join(' ')
          .trim() || null
      );
    }

    return null;
  })();

  const extRaw = params.parsed.options.ext;

  const extOption =
    typeof extRaw === 'string' && extRaw.trim().length > 0
      ? extRaw.trim()
      : null;

  const pathRaw = params.parsed.options.path;

  const pathOption =
    typeof pathRaw === 'string' && pathRaw.trim().length > 0
      ? pathRaw.trim()
      : null;

  const regex = params.parsed.options.regex === true;

  if (keyword === null) {
    const result: FileSearchResult = {
      type: 'error',
      text: 'Missing required keyword argument.',
    };

    return params.source === 'web'
      ? renderFileSearchWeb({ commandAlias: params.alias, result })
      : searchResultToCliText(result);
  }

  let workspaceRoot: string;

  try {
    workspaceRoot = resolveFileWorkspaceRoot();
  } catch (err) {
    const result: FileSearchResult = {
      type: 'error',
      text: String(err instanceof Error ? err.message : err),
    };

    return params.source === 'web'
      ? renderFileSearchWeb({ commandAlias: params.alias, result })
      : searchResultToCliText(result);
  }

  const result = await handleSearchCommand({
    workspaceRoot,
    keyword,
    extOption,
    pathOption,
    regex,
    limit: 100,
  });

  if (params.source === 'web') {
    return renderFileSearchWeb({ commandAlias: params.alias, result });
  }

  return searchResultToCliText(result);
}
