import type { WebAction, WebNode, WebNodeRoot } from '@src/web/ui-schema';
import { stack, textBlock, textNode } from '@src/web/widgets';

import {
  fileBreadcrumbCss,
  renderFileBreadcrumb,
} from '../../shared/web-breadcrumb';

import type { FileHistoryCommit, FileHistoryResult } from '../handler';

const fileHistoryStylesheet = {
  id: 'file-plugin-history',
  cssText: `
${fileBreadcrumbCss}

.web-file-history-header.web-row {
  flex-wrap: wrap;
}

.web-file-history-breadcrumb {
  flex: 1;
}

.web-link.web-file-history-link {
  display: inline;
  padding: 0;
  margin: 0;
  color: var(--color-accent, #8ecae6);
  text-decoration: none;
  text-align: left;
  vertical-align: baseline;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.web-link.web-file-history-link:hover,
.web-link.web-file-history-link:focus-visible {
  text-decoration: underline;
}

.web-file-history-row.web-row {
  flex-wrap: wrap;
  gap: 0.45rem;
}

.web-file-history-metrics.web-row {
  gap: 0.35rem;
}

.web-file-history-metrics .web-node {
  font-size: 0.75rem;
}

.web-file-history-metrics .diff-card__summary,
.web-file-history-metrics .diff-card__stat {
  font: inherit;
  display: inline-flex;
  align-items: center;
  padding: 0.05rem 0.35rem;
  border: 1px solid var(--color-border, currentColor);
  background: var(--color-panel, transparent);
}

.web-file-history-metrics .diff-card__stat--add {
  color: var(--color-success, #7ee787);
}

.web-file-history-metrics .diff-card__stat--del {
  color: var(--color-danger, #ff7b72);
}
`.trim(),
} as const;

function commitDiffAction(props: {
  commandAlias: string;
  relativePath: string;
  commitHash: string;
}): WebAction {
  return {
    type: 'command',
    command: props.commandAlias,
    subcommand: 'diff',
    arguments: { path: props.relativePath },
    options: {
      timeline: true,
      commit: props.commitHash,
    },
    recordInTimeline: false,
    surface: 'timeline',
  };
}

function commitRow(props: {
  commandAlias: string;
  relativePath: string;
  commit: FileHistoryCommit;
  index: number;
}): WebNode {
  const storyTargetId =
    props.index === 0
      ? 'file-history-commit-first'
      : `file-history-commit-${props.commit.hash}`;

  return {
    type: 'element',
    tag: 'box',
    props: {
      padding: 'sm',
    },
    children: [
      {
        type: 'element',
        tag: 'row',
        props: {
          itemAlign: 'baseline',
          className: 'web-file-history-row',
        },
        children: [
          {
            type: 'element',
            tag: 'link',
            props: {
              href: '#',
              action: commitDiffAction({
                commandAlias: props.commandAlias,
                relativePath: props.relativePath,
                commitHash: props.commit.hash,
              }),
              className: 'web-file-history-link',
              storyTargetId,
            },
            children: [textNode(props.commit.subject)],
          },
          {
            type: 'element',
            tag: 'row',
            props: {
              itemAlign: 'baseline',
              className: 'web-file-history-metrics',
            },
            children: [
              {
                type: 'element',
                tag: 'text',
                props: { className: 'diff-card__summary' },
                children: [
                  textNode(
                    `${props.commit.fileCount} ${props.commit.fileCount === 1 ? 'file' : 'files'}`,
                  ),
                ],
              },
              {
                type: 'element',
                tag: 'text',
                props: { className: 'diff-card__stat diff-card__stat--add' },
                children: [textNode(`+${props.commit.additions}`)],
              },
              {
                type: 'element',
                tag: 'text',
                props: { className: 'diff-card__stat diff-card__stat--del' },
                children: [textNode(`-${props.commit.deletions}`)],
              },
            ],
          },
        ],
      },
      {
        type: 'element',
        tag: 'text',
        props: { tone: 'muted' },
        children: [textNode(props.commit.relativeTime)],
      },
    ],
  };
}

export function renderFileHistoryWeb(props: {
  commandAlias: string;
  result: FileHistoryResult;
}): WebNodeRoot {
  if (props.result.type === 'error') {
    return {
      kind: 'ui',
      version: 1,
      meta: { command: props.commandAlias, subcommand: 'history' },
      tree: stack([textBlock(props.result.text, 'danger')], 'sm'),
      stylesheets: [fileHistoryStylesheet],
    };
  }

  const result = props.result;

  const children: WebNode[] = [
    {
      type: 'element',
      tag: 'row',
      props: {
        gap: 'sm',
        align: 'between',
        itemAlign: 'baseline',
        className: 'web-file-history-header',
      },
      children: [
        renderFileBreadcrumb({
          commandAlias: props.commandAlias,
          path: result.relativePath,
          className: 'web-file-history-breadcrumb',
          extOption: null,
        }),
      ],
    },
    ...(result.commits.length === 0
      ? [textBlock('No commits found for this path.', 'muted')]
      : result.commits.map((commit, index) =>
          commitRow({
            commandAlias: props.commandAlias,
            relativePath: result.relativePath,
            commit,
            index,
          }),
        )),
  ];

  return {
    kind: 'ui',
    version: 1,
    meta: { command: props.commandAlias, subcommand: 'history' },
    tree: stack(children, 'sm'),
    stylesheets: [fileHistoryStylesheet],
  };
}
