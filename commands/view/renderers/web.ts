import type { WebAction, WebNode, WebNodeRoot } from '@src/web/ui-schema';
import { row, stack, textBlock } from '@src/web/widgets';

import {
  openTimelineAction,
  openTimelineButton,
  renderFileBreadcrumb,
} from '../../shared/web-breadcrumb';

import type { FileViewErr, FileViewOk } from '../handler';

import { filePluginViewStylesheet } from './stylesheet';

function hljsLanguageFromPath(path: string): string | null {
  const slash = path.lastIndexOf('/');
  const base = slash >= 0 ? path.slice(slash + 1) : path;
  const dot = base.lastIndexOf('.');

  if (dot < 0) {
    return null;
  }

  const ext = base.slice(dot + 1).toLowerCase();

  const map: Record<string, string> = {
    ts: 'typescript',
    tsx: 'tsx',
    js: 'javascript',
    jsx: 'javascript',
    mjs: 'javascript',
    cjs: 'javascript',
    json: 'json',
    md: 'markdown',
    css: 'css',
    html: 'xml',
    xml: 'xml',
    yaml: 'yaml',
    yml: 'yaml',
    sh: 'bash',
    py: 'python',
    rs: 'rust',
    go: 'go',
    java: 'java',
    kt: 'kotlin',
    sql: 'sql',
  };

  return map[ext] ?? ext;
}

function supportsTts(path: string): boolean {
  const lower = path.toLowerCase();

  return lower.endsWith('.md') || lower.endsWith('.txt');
}

type RenderFileViewWebProps = {
  commandAlias: string;
  result: FileViewOk | FileViewErr;
  previousDir: string | null;
  highlightLine: number | null;
};

type CodeLineNodeProps = {
  relativePath: string;
  line: string;
  lineNumber: number;
  language: string | null;
  highlighted: boolean;
};

function lineClipboardAction(text: string): WebAction {
  return {
    type: 'clientAction',
    action: 'clipboard.writeText',
    payload: { text },
  };
}

function codeLineNode(params: CodeLineNodeProps): WebNode {
  const ui =
    params.language !== null ? `hljs-code:${params.language}` : 'hljs-code';

  return {
    type: 'element',
    tag: 'row',
    props: {
      gap: 'xs',
      itemAlign: 'baseline',
      className: `web-file-view-code-line${params.highlighted ? ' web-file-view-code-line-highlighted' : ''}`,
      ...(params.highlighted ? { autoFocus: true } : {}),
    },
    children: [
      {
        type: 'element',
        tag: 'link',
        props: {
          className: 'web-file-view-line-number',
          href: '#',
          action: lineClipboardAction(
            `${params.relativePath}:${params.lineNumber}`,
          ),
        },
        children: [{ type: 'text', value: String(params.lineNumber) }],
      },
      {
        type: 'element',
        tag: 'text',
        props: {
          className: 'web-file-view-code-text',
          ui,
          whiteSpace: 'pre-wrap',
        },
        children: [
          { type: 'text', value: params.line.length === 0 ? ' ' : params.line },
        ],
      },
    ],
  };
}

export function renderFileViewWeb(props: RenderFileViewWebProps): WebNodeRoot {
  if (props.result.type === 'error') {
    return {
      kind: 'ui',
      version: 1,
      meta: { command: props.commandAlias, subcommand: 'view' },
      tree: stack([textBlock(props.result.text, 'danger')], 'sm'),
    };
  }

  const r = props.result;

  const metaParts = [
    ...(r.truncated ? [textBlock('truncated', 'warning')] : []),
    ...(r.binary ? [textBlock('binary', 'warning')] : []),
  ];

  const rows = [
    {
      type: 'element' as const,
      tag: 'row' as const,
      props: {
        gap: 'sm' as const,
        align: 'between' as const,
        itemAlign: 'baseline' as const,
        className: 'web-file-view-header',
      },
      children: [
        renderFileBreadcrumb({
          commandAlias: props.commandAlias,
          path: r.relativePath,
          className: 'web-file-view-breadcrumb',
          extOption: null,
        }),
        openTimelineButton(
          openTimelineAction({
            commandAlias: props.commandAlias,
            subcommand: 'view',
            arguments_: { path: r.relativePath },
            options:
              props.previousDir === null
                ? {}
                : { previousDir: props.previousDir },
          }),
        ),
      ],
    },
    row(metaParts, 'sm'),
  ];

  if (r.binary) {
    rows.push(textBlock('Binary file — preview not shown.', 'muted'));
  } else {
    const lang = hljsLanguageFromPath(r.relativePath);
    const lines = r.content.split(/\r?\n/);

    rows.push({
      type: 'element',
      tag: 'box',
      props: {
        className: 'web-file-view-code',
        ...(supportsTts(r.relativePath) ? { ttsText: r.content } : {}),
      },
      children: [
        {
          type: 'element',
          tag: 'stack',
          props: { gap: 'xs', className: 'web-file-view-code-lines' },
          children: lines.map((line, index) =>
            codeLineNode({
              relativePath: r.relativePath,
              line,
              lineNumber: index + 1,
              language: lang,
              highlighted: props.highlightLine === index + 1,
            }),
          ),
        },
      ],
    });
  }

  return {
    kind: 'ui',
    version: 1,
    meta: { command: props.commandAlias, subcommand: 'view' },
    tree: stack(rows, 'sm'),
    stylesheets: [filePluginViewStylesheet],
  };
}
