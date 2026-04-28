import type { WebAction, WebNode, WebNodeRoot } from '@src/web/ui-schema';
import { stack, textNode } from '@src/web/widgets';

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
    refresh: {
      command: props.commandAlias,
      subcommand: 'view',
      arguments: arguments_,
      options: {
        previousDir: props.previousDir,
      },
    },
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
  };
}

function parentDisplayPosix(displayPath: string): string | null {
  if (displayPath === '.' || displayPath === '') {
    return null;
  }

  const idx = displayPath.lastIndexOf('/');

  if (idx < 0) {
    return '.';
  }

  if (idx === 0) {
    return '.';
  }

  return displayPath.slice(0, idx);
}

const TREE_LINK_BUTTON_CLASS = 'web-tree-link';

function treeLinkButton(props: {
  label: string;
  action: WebAction;
  variant: 'dir' | 'file' | 'nav';
  className?: string;
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
    },
  };
}

function treeGitStatusBadge(props: {
  status: WorkspaceGitStatusDecoration;
  action: WebAction | null;
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

function fileTreeSummaryLine(params: {
  row: WorkspaceTreeListRow;
  commandAlias: string;
  displayPath: string;
  extOption: string | null;
}): WebNode {
  const { row, commandAlias, displayPath, extOption } = params;

  const action = row.isDirectory
    ? treeRefreshAction({
        commandAlias,
        rest: [row.relativePosix],
        extOption,
        expandedPaths: new Set(),
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
          }),
        ],
      },
      ...(row.git
        ? [
            treeGitStatusBadge({
              status: row.git,
              action: gitBadgeAction,
            }),
          ]
        : []),
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
  startIndex: number;
  levelDepth: number;
}): { nodes: WebNode[]; nextIndex: number } {
  const {
    rows,
    commandAlias,
    displayPath,
    extOption,
    expandedPaths,
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
        defaultExpanded: row.loaded,
        lazyLoaded: row.loaded,
        ...(row.isDirectory && row.hasChildren && !row.loaded
          ? {
              lazyLoadAction: treeRefreshAction({
                commandAlias,
                rest: displayPath === '.' ? [] : [displayPath],
                extOption,
                expandedPaths: lazyExpandedPaths,
              }),
              lazyLoadingLabel: 'Loading folder…',
            }
          : {}),
      },
      children: [
        fileTreeSummaryLine({ row, commandAlias, displayPath, extOption }),
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

  const navLinks: WebNode[] = [
    treeLinkButton({
      label: 'Root',
      action: treeRefreshAction({
        commandAlias: props.commandAlias,
        rest: [],
        extOption: props.extOption,
        expandedPaths: new Set(),
      }),
      variant: 'nav',
    }),
  ];

  const parentPath = parentDisplayPosix(displayPath);

  if (parentPath !== null) {
    navLinks.push(
      {
        type: 'element',
        tag: 'text',
        props: { className: 'web-file-tree-nav-sep' },
        children: [textNode(' ')],
      },
      treeLinkButton({
        label: 'Up',
        action: treeRefreshAction({
          commandAlias: props.commandAlias,
          rest: parentPath === '.' ? [] : [parentPath],
          extOption: props.extOption,
          expandedPaths: new Set(),
        }),
        variant: 'nav',
      }),
    );
  }

  const pathLabel = displayPath === '.' ? '.' : displayPath;

  const controlsRow: WebNode = {
    type: 'element',
    tag: 'row',
    props: {
      gap: 'sm',
      align: 'start',
      itemAlign: 'baseline',
      className: 'web-file-tree-controls',
    },
    children: [
      {
        type: 'element',
        tag: 'text',
        props: {
          className: 'web-file-tree-path',
          tone: 'muted',
          whiteSpace: 'pre-wrap',
        },
        children: [textNode(pathLabel)],
      },
      {
        type: 'element',
        tag: 'text',
        props: { className: 'web-file-tree-nav-sep' },
        children: [textNode('·')],
      },
      ...navLinks,
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
    children: [treeBlock, controlsRow],
  };

  return {
    kind: 'ui',
    version: 1,
    meta: { command: props.commandAlias, subcommand: 'tree' },
    tree: treeLayout,
    stylesheets: [filePluginTreeStylesheet],
    shadowMountOverflow: 'hidden',
  };
}
