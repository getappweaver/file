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
};

function treeRefreshAction(props: TreeRefreshActionProps): WebAction {
  const arguments_ = { rest: props.rest };

  return {
    type: 'command',
    command: props.commandAlias,
    subcommand: 'tree',
    arguments: arguments_,
    options: {},
    refresh: {
      command: props.commandAlias,
      subcommand: 'tree',
      arguments: arguments_,
      options: {},
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

function buildTreeLineRows(params: {
  rows: WorkspaceTreeListRow[];
  commandAlias: string;
  displayPath: string;
}): WebNode[] {
  const { rows, commandAlias, displayPath } = params;

  if (rows.length === 0) {
    return [
      {
        type: 'element',
        tag: 'text',
        props: {
          className: 'web-file-tree-glyph-line',
        },
        children: [textNode('(empty directory)')],
      },
    ];
  }

  const lines: WebNode[] = [];

  rows.forEach((row) => {
    const glyph = `${row.treePrefix}${row.connector}`;

    const action = row.isDirectory
      ? treeRefreshAction({
          commandAlias,
          rest: [row.relativePosix],
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

    lines.push({
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
          tag: 'text',
          props: {
            className: 'web-file-tree-glyph-line',
          },
          children: [textNode(glyph)],
        },
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
    });
  });

  return lines;
}

type RenderFileTreeBrowserWebProps = {
  commandAlias: string;
  list: ListWorkspaceDirectoryResult;
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

  const treeLines = buildTreeLineRows({
    rows,
    commandAlias: props.commandAlias,
    displayPath,
  });

  const treeBlock: WebNode = {
    type: 'element',
    tag: 'box',
    props: {
      className: 'web-file-tree-block',
    },
    children: [
      {
        type: 'element',
        tag: 'stack',
        props: {
          className: 'web-file-tree-lines',
        },
        children: treeLines,
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
