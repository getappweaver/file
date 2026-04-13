import type { WebNodeRoot } from '@src/web/ui-schema';
import { row, stack, textBlock } from '@src/web/widgets';

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

type RenderFileViewWebProps = {
  commandAlias: string;
  result: FileViewOk | FileViewErr;
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
    textBlock(`${r.byteLength} bytes`, 'muted'),
    ...(r.truncated ? [textBlock('truncated', 'warning')] : []),
    ...(r.binary ? [textBlock('binary', 'warning')] : []),
  ];

  const rows = [textBlock(r.relativePath, 'info'), row(metaParts, 'sm')];

  if (r.binary) {
    rows.push(textBlock('Binary file — preview not shown.', 'muted'));
  } else {
    const lang = hljsLanguageFromPath(r.relativePath);
    const ui = lang !== null ? `hljs-code:${lang}` : 'hljs-code';

    rows.push({
      type: 'element',
      tag: 'text',
      props: {
        className: 'web-file-view-code',
        ui,
        whiteSpace: 'pre-wrap',
      },
      children: [{ type: 'text', value: r.content }],
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
