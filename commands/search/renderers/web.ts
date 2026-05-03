import type { WebAction, WebNode, WebNodeRoot } from '@src/web/ui-schema';
import { stack, textBlock, textNode } from '@src/web/widgets';

import {
  openTimelineAction,
  openTimelineButton,
  renderFileBreadcrumb,
} from '../../shared/web-breadcrumb';

import type { FileSearchMatch, FileSearchResult } from '../handler';

import { filePluginSearchStylesheet } from './stylesheet';

function viewSearchMatchAction(props: {
  commandAlias: string;
  match: FileSearchMatch;
  previousDir: string;
}): WebAction {
  return {
    type: 'command',
    command: props.commandAlias,
    subcommand: 'view',
    arguments: { path: props.match.path },
    options: { previousDir: props.previousDir, line: props.match.lineNumber },
  };
}

type FileSearchMatchGroup = {
  path: string;
  matches: FileSearchMatch[];
};

function groupMatchesByPath(
  matches: FileSearchMatch[],
): FileSearchMatchGroup[] {
  const groups = new Map<string, FileSearchMatch[]>();

  for (const match of matches) {
    const group = groups.get(match.path);

    if (group) {
      group.push(match);
    } else {
      groups.set(match.path, [match]);
    }
  }

  return [...groups.entries()].map(([path, groupMatches]) => ({
    path,
    matches: groupMatches,
  }));
}

function matchNode(props: {
  commandAlias: string;
  match: FileSearchMatch;
  previousDir: string;
}): WebNode {
  const action = viewSearchMatchAction(props);

  return {
    type: 'element',
    tag: 'box',
    props: { className: 'web-file-search-match', action },
    children: [
      {
        type: 'element',
        tag: 'row',
        props: {
          gap: 'sm',
          align: 'between',
          itemAlign: 'baseline',
          className: 'web-file-search-match-header',
        },
        children: [
          textBlock(`${props.match.lineNumber}:${props.match.column}`, 'muted'),
        ],
      },
      {
        type: 'element',
        tag: 'text',
        props: { className: 'web-file-search-line', whiteSpace: 'pre-wrap' },
        children: [textNode(props.match.line.trim())],
      },
    ],
  };
}

function resultGroupNode(props: {
  commandAlias: string;
  group: FileSearchMatchGroup;
  previousDir: string;
}): WebNode {
  const firstMatch = props.group.matches[0];

  return {
    type: 'element',
    tag: 'box',
    props: { className: 'web-file-search-result' },
    children: [
      {
        type: 'element',
        tag: 'button',
        props: {
          label: props.group.path,
          action:
            firstMatch === undefined
              ? undefined
              : viewSearchMatchAction({
                  commandAlias: props.commandAlias,
                  match: firstMatch,
                  previousDir: props.previousDir,
                }),
          className: 'web-file-search-path',
        },
      },
      {
        type: 'element',
        tag: 'stack',
        props: { gap: 'xs', className: 'web-file-search-file-matches' },
        children: props.group.matches.map((match) =>
          matchNode({
            commandAlias: props.commandAlias,
            match,
            previousDir: props.previousDir,
          }),
        ),
      },
    ],
  };
}

export function renderFileSearchWeb(props: {
  commandAlias: string;
  result: FileSearchResult;
}): WebNodeRoot {
  if (props.result.type === 'error') {
    return {
      kind: 'ui',
      version: 1,
      meta: { command: props.commandAlias, subcommand: 'search' },
      tree: stack([textBlock(props.result.text, 'danger')], 'sm'),
      stylesheets: [filePluginSearchStylesheet],
    };
  }

  const r = props.result;
  const displayPath = r.pathOption ?? '.';
  const searchOptions: Record<string, unknown> = {};
  const groups = groupMatchesByPath(r.matches);

  if (r.extOption !== null) {
    searchOptions.ext = r.extOption;
  }

  if (r.pathOption !== null) {
    searchOptions.path = r.pathOption;
  }

  const children: WebNode[] = [
    {
      type: 'element',
      tag: 'row',
      props: {
        gap: 'sm',
        align: 'between',
        itemAlign: 'baseline',
        className: 'web-file-search-header',
      },
      children: [
        renderFileBreadcrumb({
          commandAlias: props.commandAlias,
          path: displayPath,
          className: 'web-file-search-breadcrumb',
          extOption: r.extOption,
        }),
        openTimelineButton(
          openTimelineAction({
            commandAlias: props.commandAlias,
            subcommand: 'search',
            arguments_: { keyword: r.keyword },
            options: searchOptions,
          }),
        ),
      ],
    },
    textBlock(
      r.matches.length === 0
        ? `No matches for ${JSON.stringify(r.keyword)}.`
        : `Matches for ${JSON.stringify(r.keyword)} (${r.matches.length}${r.truncated ? '+' : ''})`,
      r.matches.length === 0 ? 'muted' : undefined,
    ),
  ];

  if (r.matches.length > 0) {
    children.push({
      type: 'element',
      tag: 'stack',
      props: { gap: 'sm', className: 'web-file-search-results' },
      children: groups.map((group) =>
        resultGroupNode({
          commandAlias: props.commandAlias,
          group,
          previousDir: displayPath,
        }),
      ),
    });
  }

  if (r.truncated) {
    children.push(
      textBlock(`Results truncated to ${r.limit} matches.`, 'muted'),
    );
  }

  return {
    kind: 'ui',
    version: 1,
    meta: { command: props.commandAlias, subcommand: 'search' },
    tree: stack(children, 'sm'),
    stylesheets: [filePluginSearchStylesheet],
  };
}
