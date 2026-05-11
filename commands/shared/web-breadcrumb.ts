import type { WebAction, WebNode } from '@src/web/ui-schema';
import { textNode } from '@src/web/widgets';

type TreeActionProps = {
  commandAlias: string;
  path: string;
  extOption: string | null;
};

function treeAction({
  commandAlias,
  path,
  extOption,
}: TreeActionProps): WebAction {
  const options: Record<string, string> = {};

  if (extOption !== null) {
    options.ext = extOption;
  }

  return {
    type: 'command',
    command: commandAlias,
    subcommand: 'tree',
    arguments: {
      rest: path === '.' ? [] : [path],
    },
    options,
    recordInTimeline: false,
    refresh: {
      command: commandAlias,
      subcommand: 'tree',
      arguments: {
        rest: path === '.' ? [] : [path],
      },
      options,
    },
  };
}

function breadcrumbParts(path: string): string[] {
  if (path === '' || path === '.') {
    return ['.'];
  }

  return ['.', ...path.split('/').filter((part) => part.length > 0)];
}

function breadcrumbPath(parts: string[], index: number): string {
  if (index === 0) {
    return '.';
  }

  return parts.slice(1, index + 1).join('/');
}

type RenderFileBreadcrumbProps = {
  commandAlias: string;
  path: string;
  className: string;
  extOption: string | null;
};

export function renderFileBreadcrumb({
  commandAlias,
  path,
  className,
  extOption,
}: RenderFileBreadcrumbProps): WebNode {
  const parts = breadcrumbParts(path);
  const children: WebNode[] = [];

  for (let i = 0; i < parts.length; i += 1) {
    if (i > 0) {
      children.push({
        type: 'element',
        tag: 'text',
        props: {
          className: 'web-file-breadcrumb-separator',
          whiteSpace: 'pre-wrap',
        },
        children: [textNode(' / ')],
      });
    }

    const label = parts[i];
    const isCurrent = i === parts.length - 1;

    if (isCurrent) {
      children.push({
        type: 'element',
        tag: 'text',
        props: {
          className: 'web-file-breadcrumb-current',
          whiteSpace: 'pre-wrap',
        },
        children: [textNode(label)],
      });

      continue;
    }

    children.push({
      type: 'element',
      tag: 'button',
      props: {
        label,
        action: treeAction({
          commandAlias,
          path: breadcrumbPath(parts, i),
          extOption,
        }),
        stopPropagation: true,
        className: 'web-file-breadcrumb-link',
      },
    });
  }

  return {
    type: 'element',
    tag: 'row',
    props: {
      gap: 'xs',
      align: 'start',
      itemAlign: 'baseline',
      className: `web-file-breadcrumb ${className}`,
    },
    children,
  };
}

export const fileBreadcrumbCss = `
.web-file-breadcrumb.web-row {
  flex-wrap: wrap;
  min-width: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.78rem;
  line-height: 1.4;
}

.web-button.web-file-breadcrumb-link {
  display: inline;
  background: transparent !important;
  box-shadow: none !important;
  padding: 0 !important;
  margin: 0;
  border: none;
  border-radius: 0;
  color: var(--color-accent, #8ecae6);
  text-decoration: none;
  text-align: left;
  min-height: 0;
  transform: none !important;
  vertical-align: baseline;
  font: inherit;
  cursor: pointer;
}

.web-button.web-file-breadcrumb-link:hover,
.web-button.web-file-breadcrumb-link:focus-visible {
  background: transparent !important;
  box-shadow: none !important;
  text-decoration: underline;
  transform: none !important;
}

.web-button.web-file-breadcrumb-link:active {
  background: transparent !important;
  box-shadow: none !important;
  transform: none !important;
}

.web-file-breadcrumb-current {
  color: var(--color-text, #d4d4d4);
}

.web-file-breadcrumb-separator {
  color: var(--color-text-muted, #a8a8a8);
  opacity: 0.55;
  user-select: none;
}
`.trim();

type OpenTimelineActionProps = {
  commandAlias: string;
  subcommand: string;
  arguments_: Record<string, unknown>;
  options: Record<string, unknown>;
};

export function openTimelineAction({
  commandAlias,
  subcommand,
  arguments_,
  options,
}: OpenTimelineActionProps): WebAction {
  return {
    type: 'command',
    command: commandAlias,
    subcommand,
    arguments: arguments_,
    options,
    surface: 'timeline',
    recordInTimeline: true,
  };
}

export function openTimelineButton(action: WebAction): WebNode {
  return {
    type: 'element',
    tag: 'button',
    props: {
      label: 'Open in timeline',
      action,
      stopPropagation: true,
      className: 'web-file-open-timeline-button',
    },
  };
}

export const fileOpenTimelineButtonCss = `
.web-button.web-file-open-timeline-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.55rem;
  height: 1.45rem;
  min-height: 0;
  padding: 0 !important;
  border: 1px solid #000;
  border-radius: 0;
  background: color-mix(in srgb, var(--color-accent, #8ecae6) 86%, transparent) !important;
  box-shadow: 3px 3px 0 var(--color-panel-shadow, rgba(0, 0, 0, 0.7));
  color: #000;
  font-size: 0;
  line-height: 1;
  transform: none;
}

.web-button.web-file-open-timeline-button::before {
  content: '';
  display: block;
  width: 1.125rem;
  height: 1.125rem;
  background: currentColor;
  mask: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cg transform='translate(85.333333,64)'%3E%3Cpath d='M128 63.999444v42.667l-85.333333.000223V320H256v-85.333556h42.666l.000667 128.000223H0V64l128-.000556ZM362.666667 0v170.666667H320V72.835L143.084945 249.751611l-30.16989-30.169889L289.83 42.666H192V0h170.666667Z'/%3E%3C/g%3E%3C/svg%3E") center / contain no-repeat;
  -webkit-mask: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cg transform='translate(85.333333,64)'%3E%3Cpath d='M128 63.999444v42.667l-85.333333.000223V320H256v-85.333556h42.666l.000667 128.000223H0V64l128-.000556ZM362.666667 0v170.666667H320V72.835L143.084945 249.751611l-30.16989-30.169889L289.83 42.666H192V0h170.666667Z'/%3E%3C/g%3E%3C/svg%3E") center / contain no-repeat;
}

.web-button.web-file-open-timeline-button:hover,
.web-button.web-file-open-timeline-button:focus-visible {
  background: var(--color-accent, #8ecae6) !important;
  color: #000;
  box-shadow: 3px 3px 0 var(--color-panel-shadow, rgba(0, 0, 0, 0.7));
  transform: none;
}

.web-button.web-file-open-timeline-button:active {
  background: color-mix(in srgb, var(--color-accent, #8ecae6) 72%, #000) !important;
  box-shadow: 1px 1px 0 var(--color-panel-shadow, rgba(0, 0, 0, 0.7));
  transform: translate(2px, 2px);
}

:host(.web-ui-shadow-host--timeline) .web-button.web-file-open-timeline-button {
  display: none;
}
`.trim();
