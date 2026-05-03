import type { ClientViewRoot, WebNode, WebNodeRoot } from '@src/web/ui-schema';
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

function diffLineNode(line: FileDiffOk['lines'][number]): WebNode {
  return {
    type: 'element',
    tag: 'text',
    props: {
      className: `web-file-diff-line web-file-diff-line-${line.kind}`,
      whiteSpace: 'pre-wrap',
    },
    children: [{ type: 'text', value: line.text }],
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
          className: 'web-file-diff-lines',
          gap: 'xs',
        },
        children: r.lines.map(diffLineNode),
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

export function renderTimelineDiffClientView(props: {
  commandAlias: string;
  result: TimelineDiffResult;
}): ClientViewRoot | WebNodeRoot {
  if (props.result.type === 'error') {
    return {
      kind: 'ui',
      version: 1,
      meta: { command: props.commandAlias, subcommand: 'diff' },
      tree: stack([textBlock(props.result.text, 'danger')], 'sm'),
    };
  }

  return {
    kind: 'client_view',
    version: 1,
    view: 'timeline-diff',
    meta: { command: props.commandAlias, subcommand: 'diff' },
    payload: {
      relativePath: props.result.relativePath,
      files: props.result.files,
      truncated: props.result.truncated,
    },
  };
}
