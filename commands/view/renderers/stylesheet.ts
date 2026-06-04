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
  overflow: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.82rem;
  line-height: 1.45;
  padding: 0.35rem 0;
  border-radius: 4px;
  box-sizing: border-box;
  background: var(--color-surface-alt, rgba(0, 0, 0, 0.2));
}

.web-file-view-code--edit {
  width: 100%;
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

a.web-file-view-line-number {
  text-decoration: none;
  cursor: copy;
}

a.web-file-view-line-number:hover,
a.web-file-view-line-number:focus-visible {
  color: var(--color-link, #8ab4f8);
  text-decoration: underline;
}

.web-file-view-code-text.hljs {
  display: table-cell;
  width: auto;
  padding: 0 0.55rem 0 0.65rem;
  background: transparent;
  overflow-wrap: anywhere;
  vertical-align: top;
}

.web-file-view-code--edit .web-editable-text__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  min-width: 100%;
}

.web-file-view-code--edit .web-editable-text__grid--with-gutter {
  grid-template-columns: max-content minmax(0, 1fr);
}

.web-file-view-code--edit .web-editable-text__gutter {
  grid-column: 1;
  grid-row: 1;
  padding: 0 5px 0 0.55rem;
  border-right: 1px solid #999;
  color: #ccc;
  user-select: none;
  text-align: center;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.web-file-view-code--edit .web-editable-text__line-number {
  box-sizing: border-box;
  min-width: 2ch;
}

.web-file-view-code--edit .web-editable-text__line-number.is-active {
  color: var(--color-warning, #ffd166);
}

.web-file-view-code--edit .web-editable-text__editor {
  grid-column: 2;
  grid-row: 1;
  min-width: 20rem;
  padding: 0 0.55rem 0 0.65rem;
  color: var(--color-text, inherit);
  caret-color: var(--color-warning, #ffd166);
  outline: none;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.web-file-view-code--edit .web-editable-text__mirror {
  grid-column: 2;
  grid-row: 1;
  min-width: 20rem;
  padding: 0 0.55rem 0 0.65rem;
  overflow-wrap: anywhere;
  pointer-events: none;
  visibility: hidden;
  white-space: pre-wrap;
}

.web-file-view-code--edit .web-editable-text__mirror-line {
  min-height: 1lh;
}

.web-file-view-code--edit .web-editable-text__editor:focus-visible {
  background: color-mix(in srgb, var(--color-warning, #ffd166) 10%, transparent);
  outline: 1px solid var(--color-warning, #ffd166);
  outline-offset: -1px;
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
