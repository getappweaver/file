import type {
  TimelineEventOutput,
  WebAction,
  WebNode,
  WebNodeRoot,
} from '@src/web/ui-schema';
import { row, stack, textBlock } from '@src/web/widgets';

import {
  openTimelineAction,
  openTimelineButton,
  renderFileBreadcrumb,
} from '../../shared/web-breadcrumb';

import type { FileDiffErr, FileDiffOk, TimelineDiffResult } from '../handler';

import { filePluginDiffStylesheet } from './stylesheet';

type RenderFileDiffWebProps = {
  commandAlias: string;
  result: FileDiffOk | FileDiffErr;
  previousDir: string | null;
};

function diffLineClass(line: FileDiffOk['lines'][number]): string {
  switch (line.kind) {
    case 'header':
      return 'diff-line diff-line--meta';
    case 'hunk':
      return 'diff-line diff-line--hunk';
    case 'add':
      return 'diff-line diff-line--add';
    case 'remove':
      return 'diff-line diff-line--del';
    case 'context':
      return 'diff-line';
  }
}

type DiffLineNodeProps = {
  line: FileDiffOk['lines'][number];
  relativePath: string;
};

function lineClipboardAction(text: string): WebAction {
  return {
    type: 'clientAction',
    action: 'clipboard.writeText',
    payload: { text },
  };
}

function diffLineOldNumberNode(line: FileDiffOk['lines'][number]): WebNode {
  return {
    type: 'element',
    tag: 'text',
    props: { className: 'diff-line__number' },
    children: [
      {
        type: 'text',
        value: line.oldLine === null ? '' : String(line.oldLine),
      },
    ],
  };
}

function diffLineNewNumberNode(props: DiffLineNodeProps): WebNode {
  if (props.line.newLine !== null) {
    return {
      type: 'element',
      tag: 'link',
      props: {
        className: 'diff-line__number diff-line__number--current',
        href: '#',
        action: lineClipboardAction(
          `${props.relativePath}:${props.line.newLine}`,
        ),
      },
      children: [{ type: 'text', value: String(props.line.newLine) }],
    };
  }

  return {
    type: 'element',
    tag: 'text',
    props: { className: 'diff-line__number' },
    children: [{ type: 'text', value: '' }],
  };
}

function diffLineNode(props: DiffLineNodeProps): WebNode {
  return {
    type: 'element',
    tag: 'text',
    props: {
      className: diffLineClass(props.line),
    },
    children: [
      diffLineOldNumberNode(props.line),
      diffLineNewNumberNode(props),
      {
        type: 'element',
        tag: 'text',
        props: {
          className: 'diff-line__text',
          whiteSpace: 'pre-wrap',
        },
        children: [{ type: 'text', value: props.line.text || ' ' }],
      },
    ],
  };
}

export function renderFileDiffWeb(props: RenderFileDiffWebProps): WebNodeRoot {
  if (props.result.type === 'error') {
    return {
      kind: 'ui',
      version: 1,
      meta: { command: props.commandAlias, subcommand: 'diff' },
      tree: stack([textBlock(props.result.text, 'danger')], 'sm'),
    };
  }

  const r = props.result;

  const metaParts = [
    ...(r.truncated ? [textBlock('truncated', 'warning')] : []),
    ...(r.binary ? [textBlock('binary', 'warning')] : []),
  ];

  const children: WebNode[] = [
    {
      type: 'element',
      tag: 'row',
      props: {
        gap: 'sm',
        align: 'between',
        itemAlign: 'baseline',
        className: 'web-file-diff-header',
      },
      children: [
        renderFileBreadcrumb({
          commandAlias: props.commandAlias,
          path: r.relativePath,
          className: 'web-file-diff-breadcrumb',
          extOption: null,
        }),
        openTimelineButton(
          openTimelineAction({
            commandAlias: props.commandAlias,
            subcommand: 'diff',
            arguments_: { path: r.relativePath },
            options:
              props.previousDir === null
                ? {}
                : { previousDir: props.previousDir },
          }),
        ),
      ],
    },
  ];

  if (metaParts.length > 0) {
    children.push(row(metaParts, 'sm'));
  }

  children.push({
    type: 'element',
    tag: 'box',
    props: {
      className: 'web-file-diff-block',
    },
    children: [
      {
        type: 'element',
        tag: 'stack',
        props: {
          className: 'diff-file__patch web-file-diff-lines',
          gap: 'xs',
        },
        children: r.lines.map((line) =>
          diffLineNode({ line, relativePath: r.relativePath }),
        ),
      },
    ],
  });

  return {
    kind: 'ui',
    version: 1,
    meta: { command: props.commandAlias, subcommand: 'diff' },
    tree: stack(children, 'sm'),
    stylesheets: [filePluginDiffStylesheet],
  };
}

export function renderTimelineDiffOutput(props: {
  commandAlias: string;
  result: TimelineDiffResult;
}): TimelineEventOutput | WebNodeRoot {
  if (props.result.type === 'error') {
    return {
      kind: 'ui',
      version: 1,
      meta: { command: props.commandAlias, subcommand: 'diff' },
      tree: stack([textBlock(props.result.text, 'danger')], 'sm'),
    };
  }

  return {
    kind: 'timeline_event',
    version: 1,
    event: {
      type: 'diff',
      files: props.result.files,
      title: props.result.commit?.subject ?? props.result.relativePath,
      subtitle: props.result.commit?.relativeTime ?? 'working tree',
      origin: props.result.commit ? 'git_commit' : 'workspace_diff',
    },
  };
}
