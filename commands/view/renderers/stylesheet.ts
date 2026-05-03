import type { WebStyleSheet } from '@src/web/ui-schema';

import {
  fileBreadcrumbCss,
  fileOpenTimelineButtonCss,
} from '../../shared/web-breadcrumb';

export const filePluginViewStylesheet: WebStyleSheet = {
  id: 'file-plugin-view',
  cssText: `
.web-file-view-code.web-box {
  width: 100%;
  max-height: 60vh;
  overflow: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.82rem;
  line-height: 1.45;
  padding: 0.35rem 0;
  border-radius: 4px;
  box-sizing: border-box;
  background: var(--color-surface-alt, rgba(0, 0, 0, 0.2));
}

.web-file-view-code-lines.web-stack {
  display: table;
  width: 100%;
  border-collapse: collapse;
  border-spacing: 0;
  gap: 0;
}

.web-file-view-code-line.web-row {
  display: table-row;
  outline: none;
}

.web-file-view-code-line-highlighted.web-row {
  background: color-mix(in srgb, var(--color-warning, #ffd166) 24%, transparent);
}

.web-file-view-code-line-highlighted.web-row:focus-visible {
  outline: 1px solid var(--color-warning, #ffd166);
  outline-offset: -1px;
}

.web-file-view-line-number {
  display: table-cell;
  width: 1%;
  padding: 0 5px 0 0.55rem;
  border-right: 1px solid #999;
  color: #ccc;
  user-select: none;
  text-align: center;
  vertical-align: top;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.web-file-view-code-text.hljs {
  display: table-cell;
  width: auto;
  padding: 0 0.55rem 0 0.65rem;
  background: transparent;
  overflow-wrap: anywhere;
  vertical-align: top;
}

.web-file-view-header.web-row {
  flex-wrap: wrap;
}

.web-file-view-breadcrumb {
  flex: 1;
}

${fileBreadcrumbCss}

${fileOpenTimelineButtonCss}
`.trim(),
};
