import {
  parseMarkdownTableSegments,
  type MarkdownTableAlignment,
  type MarkdownTableRow,
  type MarkdownTableSegment,
} from '@src/web/markdown-table';
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

type MarkdownTableRowNodeProps = {
  relativePath: string;
  row: MarkdownTableRow;
  alignments: MarkdownTableAlignment[];
  isHeader: boolean;
  scrollIntoView: boolean;
  scrollOnceKey: string | null;
};

type MarkdownTableSegmentNodeProps = {
  relativePath: string;
  segment: MarkdownTableSegment;
  highlightLine: number | null;
  lineScrollToken: string | null;
};

type RenderFileCodeContentNodesProps = {
  relativePath: string;
  content: string;
  language: string | null;
  highlightLine: number | null;
  lineScrollToken: string | null;
};

function lineClipboardAction(text: string): WebAction {
  return {
    type: 'clientAction',
    action: 'clipboard.writeText',
    payload: { text },
  };
}

function lineNumberLinkNode(relativePath: string, lineNumber: number): WebNode {
  return {
    type: 'element',
    tag: 'link',
    props: {
      className: 'web-file-view-line-number',
      href: '#',
      action: lineClipboardAction(`${relativePath}:${lineNumber}`),
    },
    children: [{ type: 'text', value: String(lineNumber) }],
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
      className: `web-file-view-code-line${params.scrollIntoView ? ' web-file-view-code-line--target' : ''}`,
      ...(params.scrollIntoView ? { scrollIntoViewOnMount: true } : {}),
      ...(params.scrollOnceKey === null
        ? {}
        : { scrollIntoViewOnceKey: params.scrollOnceKey }),
    },
    children: [
      lineNumberLinkNode(params.relativePath, params.lineNumber),
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

function markdownTableRowNode(params: MarkdownTableRowNodeProps): WebNode {
  const rowClasses = [
    'web-file-view-code-line',
    'web-file-view-md-table-row',
    ...(params.isHeader ? ['web-file-view-md-table-row--header'] : []),
    ...(params.scrollIntoView ? ['web-file-view-code-line--target'] : []),
  ].join(' ');

  return {
    type: 'element',
    tag: 'row',
    props: {
      gap: 'xs',
      itemAlign: 'baseline',
      className: rowClasses,
      ...(params.scrollIntoView ? { scrollIntoViewOnMount: true } : {}),
      ...(params.scrollOnceKey === null
        ? {}
        : { scrollIntoViewOnceKey: params.scrollOnceKey }),
    },
    children: [
      lineNumberLinkNode(params.relativePath, params.row.lineNumber),
      ...params.row.cells.map((cell, index): WebNode => {
        const align = params.alignments[index] ?? 'left';

        const cellClasses = [
          'web-file-view-md-table-cell',
          `web-file-view-md-table-cell--${align}`,
          ...(params.isHeader ? ['web-file-view-md-table-cell--header'] : []),
        ].join(' ');

        return {
          type: 'element',
          tag: 'text',
          props: {
            className: cellClasses,
            ui: 'hljs-code:markdown',
            whiteSpace: 'pre-wrap',
          },
          children: [{ type: 'text', value: cell.length === 0 ? ' ' : cell }],
        };
      }),
    ],
  };
}

function markdownTableSegmentNode(
  params: MarkdownTableSegmentNodeProps,
): WebNode {
  const headerScrollIntoView =
    params.highlightLine === params.segment.header.lineNumber ||
    params.highlightLine === params.segment.delimiterLineNumber;

  return {
    type: 'element',
    tag: 'stack',
    props: {
      gap: 'xs',
      className: 'web-file-view-md-table',
    },
    children: [
      markdownTableRowNode({
        relativePath: params.relativePath,
        row: params.segment.header,
        alignments: params.segment.alignments,
        isHeader: true,
        scrollIntoView: headerScrollIntoView,
        scrollOnceKey: headerScrollIntoView ? params.lineScrollToken : null,
      }),
      ...params.segment.rows.map((tableRow) => {
        const rowScrollIntoView = params.highlightLine === tableRow.lineNumber;

        return markdownTableRowNode({
          relativePath: params.relativePath,
          row: tableRow,
          alignments: params.segment.alignments,
          isHeader: false,
          scrollIntoView: rowScrollIntoView,
          scrollOnceKey: rowScrollIntoView ? params.lineScrollToken : null,
        });
      }),
    ],
  };
}

function renderFileCodeContentNodes(
  params: RenderFileCodeContentNodesProps,
): WebNode[] {
  if (params.language === 'markdown') {
    const segments = parseMarkdownTableSegments(params.content);

    return segments.map((segment): WebNode => {
      if (segment.type === 'lines') {
        return {
          type: 'element',
          tag: 'stack',
          props: { gap: 'xs', className: 'web-file-view-code-lines' },
          children: segment.lines.map((entry) =>
            codeLineNode({
              relativePath: params.relativePath,
              line: entry.text,
              lineNumber: entry.lineNumber,
              language: params.language,
              scrollIntoView: params.highlightLine === entry.lineNumber,
              scrollOnceKey:
                params.highlightLine === entry.lineNumber
                  ? params.lineScrollToken
                  : null,
            }),
          ),
        };
      }

      return markdownTableSegmentNode({
        relativePath: params.relativePath,
        segment,
        highlightLine: params.highlightLine,
        lineScrollToken: params.lineScrollToken,
      });
    });
  }

  const lines = params.content.split(/\r?\n/);

  return [
    {
      type: 'element',
      tag: 'stack',
      props: { gap: 'xs', className: 'web-file-view-code-lines' },
      children: lines.map((line, index) =>
        codeLineNode({
          relativePath: params.relativePath,
          line,
          lineNumber: index + 1,
          language: params.language,
          scrollIntoView: params.highlightLine === index + 1,
          scrollOnceKey:
            params.highlightLine === index + 1 ? params.lineScrollToken : null,
        }),
      ),
    },
  ];
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
      children: renderFileCodeContentNodes({
        relativePath: r.relativePath,
        content: r.content,
        language: lang,
        highlightLine: props.highlightLine,
        lineScrollToken: props.lineScrollToken,
      }),
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

  const toolbarActions = r.binary
    ? []
    : [
        {
          label: 'Copy file',
          icon: 'copy' as const,
          action: lineClipboardAction(r.content),
        },
        ...(canEdit
          ? [
              {
                label: 'Edit file',
                icon: 'edit' as const,
                activeLabel: 'Save file',
                activeIcon: 'save' as const,
                toggleKey: `file-edit:${r.relativePath}`,
                storyTargetId: `file-view-edit-${r.relativePath}`,
                action: {
                  type: 'clientAction' as const,
                  action: 'web.toggle' as const,
                  payload: { key: `file-edit:${r.relativePath}` },
                },
                activeAction: {
                  type: 'clientAction' as const,
                  action: 'editableText.runCommand' as const,
                  payload: {
                    editableTextId: `file-edit-text:${r.relativePath}`,
                    contentArgument: 'content',
                    activeLineRefreshOption: 'line',
                    activeLineScrollTokenOption: 'lineScrollToken',
                    toggleKey: `file-edit:${r.relativePath}`,
                    command: {
                      type: 'command' as const,
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
                icon: 'diff' as const,
                className: 'web-file-timeline-diff-button',
                storyTargetId: `file-view-diff-${r.relativePath}`,
                action: {
                  type: 'command' as const,
                  command: props.commandAlias,
                  subcommand: 'diff',
                  arguments: { path: r.relativePath },
                  options:
                    props.previousDir === null
                      ? {}
                      : { previousDir: props.previousDir },
                  recordInTimeline: true,
                  surface: 'timeline' as const,
                },
              },
            ]
          : []),
      ];

  const rootTree = stack(rows, 'sm');

  const viewOptions: Record<string, unknown> = {
    ...(props.previousDir === null ? {} : { previousDir: props.previousDir }),
    ...(props.highlightLine === null ? {} : { line: props.highlightLine }),
  };

  const viewMeta = {
    command: props.commandAlias,
    subcommand: 'view',
    arguments: { path: r.relativePath },
    ...(Object.keys(viewOptions).length > 0 ? { options: viewOptions } : {}),
  };

  if (rootTree.type !== 'element') {
    return {
      kind: 'ui',
      version: 1,
      meta: viewMeta,
      tree: rootTree,
      stylesheets: [filePluginViewStylesheet],
    };
  }

  return {
    kind: 'ui',
    version: 1,
    meta: viewMeta,
    tree: {
      ...rootTree,
      props: {
        ...rootTree.props,
        refreshable: true,
        ...(toolbarActions.length > 0 ? { toolbarActions } : {}),
      },
    },
    stylesheets: [filePluginViewStylesheet],
  };
}
