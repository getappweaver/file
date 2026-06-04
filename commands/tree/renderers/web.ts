import type { WebAction, WebNode, WebNodeRoot } from '@src/web/ui-schema';
import { stack, textNode } from '@src/web/widgets';

import {
  openTimelineAction,
  openTimelineButton,
  renderFileBreadcrumb,
} from '../../shared/web-breadcrumb';

import type {
  ListWorkspaceDirectoryResult,
  WorkspaceGitStatusDecoration,
  WorkspaceTreeListRow,
} from '../workspace-tree';

import { filePluginTreeStylesheet } from './stylesheet';

type TreeRefreshActionProps = {
  commandAlias: string;
  rest: string[];
  extOption: string | null;
  expandedPaths: Set<string>;
  revealPath: string | null;
};

function encodedExpandedPaths(expandedPaths: Set<string>): string | null {
  if (expandedPaths.size === 0) {
    return null;
  }

  return encodeURIComponent(JSON.stringify([...expandedPaths].sort()));
}

function treeRefreshAction(props: TreeRefreshActionProps): WebAction {
  const arguments_ = { rest: props.rest };
  const options: Record<string, string> = {};
  const expanded = encodedExpandedPaths(props.expandedPaths);

  if (props.extOption !== null) {
    options.ext = props.extOption;
  }

  if (expanded !== null) {
    options.expanded = expanded;
  }

  if (props.revealPath !== null) {
    options.reveal = props.revealPath;
  }

  return {
    type: 'command',
    command: props.commandAlias,
    subcommand: 'tree',
    arguments: arguments_,
    options,
    recordInTimeline: false,
    refresh: {
      command: props.commandAlias,
      subcommand: 'tree',
      arguments: arguments_,
      options,
    },
  };
}

function revealInlineFormAction(targetId: string): WebAction {
  return { type: 'reveal', targetId };
}

function hideInlineFormAction(targetId: string): WebAction {
  return { type: 'hideReveal', targetId };
}

type ViewFileActionProps = {
  commandAlias: string;
  relativePosix: string;
  previousDir: string;
};

function viewFileAction(props: ViewFileActionProps): WebAction {
  const arguments_ = { path: props.relativePosix };

  return {
    type: 'command',
    command: props.commandAlias,
    subcommand: 'view',
    arguments: arguments_,
    options: {
      previousDir: props.previousDir,
    },
    recordInTimeline: false,
  };
}

type ViewDiffActionProps = {
  commandAlias: string;
  relativePosix: string;
  previousDir: string;
};

function viewDiffAction(props: ViewDiffActionProps): WebAction {
  return {
    type: 'command',
    command: props.commandAlias,
    subcommand: 'diff',
    arguments: { path: props.relativePosix },
    options: {
      previousDir: props.previousDir,
    },
    recordInTimeline: false,
  };
}

function viewTimelineDiffAction(props: ViewDiffActionProps): WebAction {
  return {
    type: 'command',
    command: props.commandAlias,
    subcommand: 'diff',
    arguments: { path: props.relativePosix },
    options: {
      previousDir: props.previousDir,
      timeline: true,
    },
    recordInTimeline: false,
    surface: 'timeline',
  };
}

function viewHistoryAction(props: {
  commandAlias: string;
  relativePosix: string;
}): WebAction {
  return {
    type: 'command',
    command: props.commandAlias,
    subcommand: 'history',
    arguments: props.relativePosix === '.' ? {} : { path: props.relativePosix },
    options: {},
  };
}

function searchFormAction(props: {
  commandAlias: string;
  displayPath: string;
  extOption: string | null;
}): WebAction {
  const options: Record<string, string> = {};

  if (props.displayPath !== '.') {
    options.path = props.displayPath;
  }

  if (props.extOption !== null) {
    options.ext = props.extOption;
  }

  return {
    type: 'command',
    command: props.commandAlias,
    subcommand: 'search',
    arguments: {},
    options,
    presentation: 'form',
  };
}

function searchFormButton(action: WebAction): WebNode {
  return {
    type: 'element',
    tag: 'button',
    props: {
      label: 'Advanced search',
      action,
      stopPropagation: true,
      className: 'web-file-advanced-search-button',
    },
  };
}

function timelineDiffButton(action: WebAction): WebNode {
  return {
    type: 'element',
    tag: 'button',
    props: {
      label: 'Show folder diff',
      action,
      stopPropagation: true,
      className: 'web-file-timeline-diff-button',
    },
  };
}

function historyButton(action: WebAction): WebNode {
  return {
    type: 'element',
    tag: 'button',
    props: {
      label: 'View history',
      action,
      stopPropagation: true,
      className: 'web-file-history-button',
    },
  };
}

const TREE_LINK_BUTTON_CLASS = 'web-tree-link';

function treeLinkButton(props: {
  label: string;
  action: WebAction;
  variant: 'dir' | 'file' | 'nav';
  className?: string;
  storyTargetId?: string;
}): WebNode {
  const variantClass =
    props.variant === 'dir'
      ? 'web-tree-link-dir'
      : props.variant === 'file'
        ? 'web-tree-link-file'
        : 'web-tree-link-nav';

  return {
    type: 'element',
    tag: 'button',
    props: {
      label: props.label,
      action: props.action,
      stopPropagation: true,
      className: `${TREE_LINK_BUTTON_CLASS} ${variantClass}${props.className ? ` ${props.className}` : ''}`,
      ...(props.storyTargetId ? { storyTargetId: props.storyTargetId } : {}),
    },
  };
}

function treeGitStatusBadge(props: {
  status: WorkspaceGitStatusDecoration;
  action: WebAction | null;
  storyTargetId?: string;
}): WebNode {
  if (props.action !== null) {
    return {
      type: 'element',
      tag: 'button',
      props: {
        label: props.status.label,
        action: props.action,
        stopPropagation: true,
        className: `web-tree-git-badge web-tree-git-badge-button web-tree-git-${props.status.kind} web-tree-git-scope-${props.status.scope}`,
        ...(props.storyTargetId ? { storyTargetId: props.storyTargetId } : {}),
      },
    };
  }

  return {
    type: 'element',
    tag: 'badge',
    props: {
      label: props.status.label,
      className: `web-tree-git-badge web-tree-git-${props.status.kind} web-tree-git-scope-${props.status.scope}`,
    },
  };
}

type WorkspaceTreeListRowWithDepth = WorkspaceTreeListRow & {
  depth: number;
};

function rowDepth(row: WorkspaceTreeListRow): number {
  return row.treePrefix.length / 4;
}

function rowsWithDepth(
  rows: WorkspaceTreeListRow[],
): WorkspaceTreeListRowWithDepth[] {
  return rows.map((r) => ({ ...r, depth: rowDepth(r) }));
}

function fileTreeItemId(relativePosix: string): string {
  return `file-tree-item-${relativePosix.replace(/[^a-zA-Z0-9_-]+/g, '_')}`;
}

function fileTreeRevealId(
  kind: 'create' | 'rename',
  relativePosix: string,
): string {
  return `file-tree-${kind}-${relativePosix.replace(/[^a-zA-Z0-9_-]+/g, '_')}`;
}

function fileTreeStoryTargetId(
  kind: 'open' | 'diff',
  relativePosix: string,
): string {
  return `file-tree-${kind}-${relativePosix.replace(/[^a-zA-Z0-9_-]+/g, '_')}`;
}

function parentDir(relativePosix: string): string {
  const index = relativePosix.lastIndexOf('/');

  return index === -1 ? '.' : relativePosix.slice(0, index);
}

function expandedPathsForReveal(props: {
  current: Set<string>;
  revealPath: string;
}): Set<string> {
  const next = new Set(props.current);
  const parts = props.revealPath.split('/').filter((part) => part.length > 0);

  for (let index = 1; index < parts.length; index++) {
    next.add(parts.slice(0, index).join('/'));
  }

  return next;
}

function treeMutationOptions(props: {
  displayPath: string;
  extOption: string | null;
  expandedPaths: Set<string>;
}): Record<string, string> {
  const options: Record<string, string> = {
    treeDir: props.displayPath,
  };

  const expanded = encodedExpandedPaths(props.expandedPaths);

  if (props.extOption !== null) {
    options.ext = props.extOption;
  }

  if (expanded !== null) {
    options.expanded = expanded;
  }

  return options;
}

function buildInlineCreateFileForm(props: {
  row: WorkspaceTreeListRow;
  commandAlias: string;
  displayPath: string;
  extOption: string | null;
  expandedPaths: Set<string>;
}): WebNode {
  const revealId = fileTreeRevealId('create', props.row.relativePosix);

  return {
    type: 'element',
    tag: 'form',
    props: {
      className: 'web-form web-form--stacked web-file-tree-inline-form',
      revealId,
      hiddenUntilRevealed: true,
      action: {
        type: 'command',
        command: props.commandAlias,
        subcommand: 'create',
        arguments: { dir: props.row.relativePosix },
        options: treeMutationOptions({
          displayPath: props.displayPath,
          extOption: props.extOption,
          expandedPaths: expandedPathsForReveal({
            current: props.expandedPaths,
            revealPath: props.row.relativePosix,
          }),
        }),
        recordInTimeline: false,
      },
    },
    children: [
      {
        type: 'element',
        tag: 'text',
        props: { tone: 'muted', size: 'sm' },
        children: [textNode(`Create file in ${props.row.relativePosix}/`)],
      },
      {
        type: 'element',
        tag: 'textField',
        props: {
          formFieldName: 'name',
          inputPlaceholder: 'filename.ext',
          autoFocus: true,
        },
      },
      {
        type: 'element',
        tag: 'row',
        props: { className: 'web-form__actions', gap: 'sm' },
        children: [
          {
            type: 'element',
            tag: 'button',
            props: { label: 'Create', htmlType: 'submit' },
          },
          {
            type: 'element',
            tag: 'button',
            props: {
              label: 'Close',
              className: 'web-button',
              action: hideInlineFormAction(revealId),
            },
          },
        ],
      },
    ],
  };
}

function buildInlineRenameForm(props: {
  row: WorkspaceTreeListRow;
  commandAlias: string;
  displayPath: string;
  extOption: string | null;
  expandedPaths: Set<string>;
}): WebNode {
  const revealId = fileTreeRevealId('rename', props.row.relativePosix);

  return {
    type: 'element',
    tag: 'form',
    props: {
      className: 'web-form web-form--stacked web-file-tree-inline-form',
      revealId,
      hiddenUntilRevealed: true,
      action: {
        type: 'command',
        command: props.commandAlias,
        subcommand: 'rename',
        arguments: { path: props.row.relativePosix },
        options: treeMutationOptions({
          displayPath: props.displayPath,
          extOption: props.extOption,
          expandedPaths: expandedPathsForReveal({
            current: props.expandedPaths,
            revealPath: parentDir(props.row.relativePosix),
          }),
        }),
        recordInTimeline: false,
      },
    },
    children: [
      {
        type: 'element',
        tag: 'text',
        props: { tone: 'muted', size: 'sm' },
        children: [textNode(`Rename ${props.row.relativePosix}`)],
      },
      {
        type: 'element',
        tag: 'textField',
        props: {
          formFieldName: 'name',
          inputPlaceholder: props.row.name,
          value: props.row.name,
          autoFocus: true,
        },
      },
      {
        type: 'element',
        tag: 'row',
        props: { className: 'web-form__actions', gap: 'sm' },
        children: [
          {
            type: 'element',
            tag: 'button',
            props: { label: 'Rename', htmlType: 'submit' },
          },
          {
            type: 'element',
            tag: 'button',
            props: {
              label: 'Close',
              className: 'web-button',
              action: hideInlineFormAction(revealId),
            },
          },
        ],
      },
    ],
  };
}

function fileTreeRowActionsMenu(props: {
  row: WorkspaceTreeListRow;
  commandAlias: string;
  displayPath: string;
  extOption: string | null;
}): WebNode {
  const { row, commandAlias, displayPath, extOption } = props;

  return {
    type: 'element',
    tag: 'overflowMenu',
    props: {
      label: '⋮',
      buttonVariant: 'icon',
      className: 'web-file-tree-row-menu',
      storyTargetId: `file-tree-row-actions-${row.relativePosix}`,
    },
    children: [
      ...(row.isDirectory
        ? [
            {
              type: 'element' as const,
              tag: 'menuItem' as const,
              props: {
                label: 'Create file here…',
                action: revealInlineFormAction(
                  fileTreeRevealId('create', row.relativePosix),
                ),
              },
            },
          ]
        : []),
      {
        type: 'element',
        tag: 'menuItem',
        props: {
          label: 'Rename…',
          action: revealInlineFormAction(
            fileTreeRevealId('rename', row.relativePosix),
          ),
        },
      },
      ...(row.isDirectory
        ? [
            {
              type: 'element' as const,
              tag: 'menuItem' as const,
              props: {
                label: 'Search here…',
                action: searchFormAction({
                  commandAlias,
                  displayPath: row.relativePosix,
                  extOption,
                }),
              },
            },
          ]
        : []),
      {
        type: 'element',
        tag: 'menuItem',
        props: {
          label: 'Check diff',
          action: row.isDirectory
            ? viewTimelineDiffAction({
                commandAlias,
                relativePosix: row.relativePosix,
                previousDir: displayPath,
              })
            : viewDiffAction({
                commandAlias,
                relativePosix: row.relativePosix,
                previousDir: displayPath,
              }),
        },
      },
      {
        type: 'element',
        tag: 'menuItem',
        props: {
          label: 'Check history',
          action: viewHistoryAction({
            commandAlias,
            relativePosix: row.relativePosix,
          }),
        },
      },
    ],
  };
}

function fileTreeSummaryLine(params: {
  row: WorkspaceTreeListRow;
  commandAlias: string;
  displayPath: string;
  extOption: string | null;
  revealPath: string | null;
}): WebNode {
  const { row, commandAlias, displayPath, extOption, revealPath } = params;

  const action = row.isDirectory
    ? treeRefreshAction({
        commandAlias,
        rest: [row.relativePosix],
        extOption,
        expandedPaths: new Set(),
        revealPath: null,
      })
    : viewFileAction({
        commandAlias,
        relativePosix: row.relativePosix,
        previousDir: displayPath,
      });

  const linkLabel = row.isDirectory ? `${row.name}/` : row.name;

  const gitClassName = row.git
    ? `web-tree-link-git web-tree-link-git-${row.git.kind}`
    : undefined;

  const gitBadgeAction =
    row.git !== null && !row.isDirectory && row.git.scope === 'file'
      ? viewDiffAction({
          commandAlias,
          relativePosix: row.relativePosix,
          previousDir: displayPath,
        })
      : null;

  return {
    type: 'element',
    tag: 'row',
    props: {
      align: 'start',
      itemAlign: 'center',
      className: `web-file-tree-line${row.git ? ` web-file-tree-line-git web-file-tree-line-git-${row.git.kind}` : ''}`,
      ...(row.relativePosix === revealPath
        ? { scrollIntoViewOnMount: true }
        : {}),
    },
    children: [
      {
        type: 'element',
        tag: 'row',
        props: {
          className: 'web-file-tree-link-wrap',
          fill: true,
        },
        children: [
          treeLinkButton({
            label: linkLabel,
            action,
            variant: row.isDirectory ? 'dir' : 'file',
            className: gitClassName,
            storyTargetId: fileTreeStoryTargetId('open', row.relativePosix),
          }),
        ],
      },
      ...(row.git
        ? [
            treeGitStatusBadge({
              status: row.git,
              action: gitBadgeAction,
              storyTargetId:
                gitBadgeAction === null
                  ? undefined
                  : fileTreeStoryTargetId('diff', row.relativePosix),
            }),
          ]
        : []),
      fileTreeRowActionsMenu({ row, commandAlias, displayPath, extOption }),
    ],
  };
}

/**
 * Same depth semantics as `collectWorkspaceTreeRows`: flat DFS rows → nested
 * `treeItem` nodes so the host `tag: 'tree'` gets collapse/expand-all and folding.
 */
function buildFileTreeItemsFromRows(params: {
  rows: WorkspaceTreeListRowWithDepth[];
  commandAlias: string;
  displayPath: string;
  extOption: string | null;
  expandedPaths: Set<string>;
  revealPath: string | null;
  startIndex: number;
  levelDepth: number;
}): { nodes: WebNode[]; nextIndex: number } {
  const {
    rows,
    commandAlias,
    displayPath,
    extOption,
    expandedPaths,
    revealPath,
    startIndex,
    levelDepth,
  } = params;

  const nodes: WebNode[] = [];
  let i = startIndex;

  while (i < rows.length && rows[i].depth === levelDepth) {
    const row = rows[i];
    i += 1;
    let childNodes: WebNode[] = [];

    if (
      row.isDirectory &&
      i < rows.length &&
      rows[i].depth === levelDepth + 1
    ) {
      const nested = buildFileTreeItemsFromRows({
        rows,
        commandAlias,
        displayPath,
        extOption,
        expandedPaths,
        revealPath,
        startIndex: i,
        levelDepth: levelDepth + 1,
      });

      childNodes = nested.nodes;
      i = nested.nextIndex;
    }

    const lazyExpandedPaths = new Set(expandedPaths);
    lazyExpandedPaths.add(row.relativePosix);

    nodes.push({
      type: 'element',
      tag: 'treeItem',
      props: {
        id: fileTreeItemId(row.relativePosix),
        ui: 'file-tree-item',
        ...(!row.isDirectory ? { className: 'web-file-tree-item-leaf' } : {}),
        filterText: `${row.name}\n${row.relativePosix}${row.git ? `\n${row.git.label}\n${row.git.kind}\n${row.git.scope}` : ''}`,
        filterName: row.name,
        filterPath: row.relativePosix,
        defaultExpanded: expandedPaths.has(row.relativePosix),
        lazyLoaded: row.loaded,
        ...(row.isDirectory && row.hasChildren && !row.loaded
          ? {
              lazyLoadAction: treeRefreshAction({
                commandAlias,
                rest: displayPath === '.' ? [] : [displayPath],
                extOption,
                expandedPaths: lazyExpandedPaths,
                revealPath: null,
              }),
              lazyLoadingLabel: 'Loading folder…',
            }
          : {}),
      },
      children: [
        fileTreeSummaryLine({
          row,
          commandAlias,
          displayPath,
          extOption,
          revealPath,
        }),
        ...(row.isDirectory
          ? [
              buildInlineCreateFileForm({
                row,
                commandAlias,
                displayPath,
                extOption,
                expandedPaths,
              }),
            ]
          : []),
        buildInlineRenameForm({
          row,
          commandAlias,
          displayPath,
          extOption,
          expandedPaths,
        }),
        ...(childNodes.length > 0
          ? [
              {
                type: 'element' as const,
                tag: 'stack' as const,
                props: {
                  gap: 'xs' as const,
                  className: 'web-file-tree-children',
                },
                children: childNodes,
              },
            ]
          : []),
      ],
    });
  }

  return { nodes, nextIndex: i };
}

type RenderFileTreeBrowserWebProps = {
  commandAlias: string;
  list: ListWorkspaceDirectoryResult;
  extOption: string | null;
  expandedPaths: Set<string>;
  revealPath: string | null;
};

export function renderFileTreeBrowserWeb(
  props: RenderFileTreeBrowserWebProps,
): WebNodeRoot {
  if (props.list.type === 'error') {
    return {
      kind: 'ui',
      version: 1,
      meta: { command: props.commandAlias, subcommand: 'tree' },
      tree: stack(
        [
          {
            type: 'element',
            tag: 'text',
            props: { tone: 'danger', whiteSpace: 'pre-wrap' },
            children: [textNode(props.list.text)],
          },
        ],
        'sm',
      ),
      stylesheets: [filePluginTreeStylesheet],
      shadowMountOverflow: 'hidden',
    };
  }

  const { rows, displayPath } = props.list;

  const openTreeOptions: Record<string, unknown> = {};

  if (props.extOption !== null) {
    openTreeOptions.ext = props.extOption;
  }

  const controlsRow: WebNode = {
    type: 'element',
    tag: 'row',
    props: {
      gap: 'sm',
      align: 'between',
      itemAlign: 'baseline',
      className: 'web-file-tree-controls',
    },
    children: [
      renderFileBreadcrumb({
        commandAlias: props.commandAlias,
        path: displayPath,
        className: 'web-file-tree-breadcrumb',
        extOption: props.extOption,
      }),
      searchFormButton(
        searchFormAction({
          commandAlias: props.commandAlias,
          displayPath,
          extOption: props.extOption,
        }),
      ),
      timelineDiffButton(
        viewTimelineDiffAction({
          commandAlias: props.commandAlias,
          relativePosix: displayPath,
          previousDir: displayPath,
        }),
      ),
      historyButton(
        viewHistoryAction({
          commandAlias: props.commandAlias,
          relativePosix: displayPath,
        }),
      ),
      openTimelineButton(
        openTimelineAction({
          commandAlias: props.commandAlias,
          subcommand: 'tree',
          arguments_: { rest: displayPath === '.' ? [] : [displayPath] },
          options: openTreeOptions,
        }),
      ),
    ],
  };

  const rowsDepth = rowsWithDepth(rows);

  const treeBodyChildren: WebNode[] =
    rows.length === 0
      ? [
          {
            type: 'element',
            tag: 'text',
            props: {
              className: 'web-file-tree-glyph-line',
            },
            children: [textNode('(empty directory)')],
          },
        ]
      : buildFileTreeItemsFromRows({
          rows: rowsDepth,
          commandAlias: props.commandAlias,
          displayPath,
          extOption: props.extOption,
          expandedPaths: props.expandedPaths,
          revealPath: props.revealPath,
          startIndex: 0,
          levelDepth: 0,
        }).nodes;

  const treeBlock: WebNode = {
    type: 'element',
    tag: 'box',
    props: {
      className: 'web-file-tree-block',
    },
    children: [
      {
        type: 'element',
        tag: 'tree',
        props: {
          gap: 'xs',
          ui: 'file-workspace-tree',
          filterable: true,
          filterIndexKey: `file-tree:${displayPath}:ext=${props.extOption ?? ''}:rows=${rows.length}`,
          filterPlaceholder: 'Filter files',
        },
        children: treeBodyChildren,
      },
    ],
  };

  const treeLayout: WebNode = {
    type: 'element',
    tag: 'stack',
    props: {
      gap: 'md',
      className: 'web-file-tree-modal-layout',
    },
    children: [controlsRow, treeBlock],
  };

  return {
    kind: 'ui',
    version: 1,
    meta: { command: props.commandAlias, subcommand: 'tree' },
    widgetHelp: {
      title: 'File manager',
      body: [
        'Browse project files, open markdown or code, inspect history, and jump into diffs without leaving the app.',
      ],
      stories: [
        {
          id: 'file-tree-read-markdown',
          title: 'Read markdown from the file tree',
          description:
            'Use the File widget tree to open a markdown document in the built-in reader.',
          pluginAlias: props.commandAlias,
          iconUrl: '/plugin-icons/file/commands__tree__renderers__tree.svg',
        },
        {
          id: 'file-tree-git-diff',
          title: 'Open a git diff from the tree',
          description:
            'Use git status in the file tree to open a workspace diff view.',
          pluginAlias: props.commandAlias,
          iconUrl: '/plugin-icons/file/commands__tree__renderers__tree.svg',
        },
      ],
    },
    tree: treeLayout,
    stylesheets: [filePluginTreeStylesheet],
    shadowMountOverflow: 'hidden',
  };
}
