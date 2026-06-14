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
  lineScrollToken: string | null;
};

type CodeLineNodeProps = {
  relativePath: string;
  line: string;
  lineNumber: number;
  language: string | null;
  scrollIntoView: boolean;
  scrollOnceKey: string | null;
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
      className: 'web-file-view-code-line',
      ...(params.scrollIntoView ? { scrollIntoViewOnMount: true } : {}),
      ...(params.scrollOnceKey === null
        ? {}
        : { scrollIntoViewOnceKey: params.scrollOnceKey }),
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
    const editToggleKey = `file-edit:${r.relativePath}`;
    const editableTextId = `file-edit-text:${r.relativePath}`;

    rows.push({
      type: 'element',
      tag: 'box',
      props: {
        className: 'web-file-view-code',
        hiddenWhenToggleKey: editToggleKey,
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
              scrollIntoView: props.highlightLine === index + 1,
              scrollOnceKey:
                props.highlightLine === index + 1
                  ? props.lineScrollToken
                  : null,
            }),
          ),
        },
      ],
    });

    rows.push({
      type: 'element',
      tag: 'editableText',
      props: {
        className: 'web-file-view-code web-file-view-code--edit',
        visibleWhenToggleKey: editToggleKey,
        editableTextId,
        storyTargetId: `file-view-edit-text-${r.relativePath}`,
        editableTextValue: r.content,
        showLineNumbers: true,
      },
    });
  }

  const canEdit = !r.binary && !r.truncated;
  const rootTree = stack(rows, 'sm');

  if (rootTree.type !== 'element') {
    return {
      kind: 'ui',
      version: 1,
      meta: { command: props.commandAlias, subcommand: 'view' },
      tree: rootTree,
      stylesheets: [filePluginViewStylesheet],
    };
  }

  return {
    kind: 'ui',
    version: 1,
    meta: { command: props.commandAlias, subcommand: 'view' },
    tree: {
      ...rootTree,
      props: {
        ...rootTree.props,
        ...(canEdit
          ? {
              toolbarActions: [
                {
                  label: 'Edit file',
                  icon: 'edit',
                  activeLabel: 'Save file',
                  activeIcon: 'save',
                  toggleKey: `file-edit:${r.relativePath}`,
                  storyTargetId: `file-view-edit-${r.relativePath}`,
                  action: {
                    type: 'clientAction',
                    action: 'web.toggle',
                    payload: { key: `file-edit:${r.relativePath}` },
                  },
                  activeAction: {
                    type: 'clientAction',
                    action: 'editableText.runCommand',
                    payload: {
                      editableTextId: `file-edit-text:${r.relativePath}`,
                      contentArgument: 'content',
                      activeLineRefreshOption: 'line',
                      activeLineScrollTokenOption: 'lineScrollToken',
                      toggleKey: `file-edit:${r.relativePath}`,
                      command: {
                        type: 'command',
                        command: props.commandAlias,
                        subcommand: 'edit',
                        arguments: { path: r.relativePath },
                        options:
                          props.previousDir === null
                            ? {}
                            : { previousDir: props.previousDir },
                        recordInTimeline: true,
                        refresh: {
                          command: props.commandAlias,
                          subcommand: 'view',
                          arguments: { path: r.relativePath },
                          recordInTimeline: false,
                          options:
                            props.previousDir === null
                              ? {}
                              : { previousDir: props.previousDir },
                        },
                      },
                    },
                  },
                },
                {
                  label: 'Check diff',
                  icon: 'diff',
                  className: 'web-file-timeline-diff-button',
                  storyTargetId: `file-view-diff-${r.relativePath}`,
                  action: {
                    type: 'command',
                    command: props.commandAlias,
                    subcommand: 'diff',
                    arguments: { path: r.relativePath },
                    options:
                      props.previousDir === null
                        ? {}
                        : { previousDir: props.previousDir },
                    recordInTimeline: true,
                    surface: 'timeline',
                  },
                },
              ],
            }
          : {}),
      },
    },
    stylesheets: [filePluginViewStylesheet],
  };
}
