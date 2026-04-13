import type { WebNode, WebNodeRoot } from '@src/web/ui-schema';
import { row, stack, textBlock } from '@src/web/widgets';

import type { FileDiffErr, FileDiffOk } from '../handler';

import { filePluginDiffStylesheet } from './stylesheet';

type RenderFileDiffWebProps = {
  commandAlias: string;
  result: FileDiffOk | FileDiffErr;
  previousDir: string | null;
};

function parentTreeAction(
  commandAlias: string,
  relativePath: string,
  previousDir: string | null,
) {
  const slash = relativePath.lastIndexOf('/');
  const fallbackParentPath = slash >= 0 ? relativePath.slice(0, slash) : '.';
  const parentPath = previousDir ?? fallbackParentPath;

  return {
    type: 'command' as const,
    command: commandAlias,
    subcommand: 'tree',
    arguments: {
      rest: parentPath === '.' ? [] : [parentPath],
    },
    options: {},
  };
}

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
    {
      type: 'element' as const,
      tag: 'button' as const,
      props: {
        label: 'Back to folder',
        action: parentTreeAction(
          props.commandAlias,
          r.relativePath,
          props.previousDir,
        ),
      },
    },
    ...(r.truncated ? [textBlock('truncated', 'warning')] : []),
    ...(r.binary ? [textBlock('binary', 'warning')] : []),
  ];

  const children: WebNode[] = [textBlock(r.relativePath, 'info')];

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
