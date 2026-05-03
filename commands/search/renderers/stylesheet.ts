import type { WebStyleSheet } from '@src/web/ui-schema';

import {
  fileBreadcrumbCss,
  fileOpenTimelineButtonCss,
} from '../../shared/web-breadcrumb';

export const filePluginSearchStylesheet: WebStyleSheet = {
  id: 'file-plugin-search',
  cssText: `
.web-file-search-header.web-row {
  flex-wrap: wrap;
}

.web-file-search-breadcrumb {
  flex: 1;
}

.web-file-search-results.web-stack {
  gap: 0.35rem;
}

.web-file-search-result.web-box {
  padding: 0.35rem 0.45rem;
  background: rgba(0, 0, 0, 0.16);
  border-radius: 4px;
}

.web-file-search-file-matches.web-stack {
  gap: 0.2rem;
  margin-top: 0.3rem;
}

.web-file-search-match.web-box {
  cursor: pointer;
  padding: 0.25rem 0.35rem;
  background: transparent;
}

.web-file-search-match.web-box:hover,
.web-file-search-match.web-box:focus-visible {
  background: color-mix(in srgb, var(--color-warning, #ffd166) 18%, transparent);
}

.web-file-search-match-header.web-row {
  flex-wrap: nowrap;
  align-items: baseline;
  gap: 0.5rem;
}

.web-button.web-file-search-path {
  display: block;
  flex: 1;
  min-width: 0;
  padding: 0 !important;
  border: none;
  border-radius: 0;
  background: transparent !important;
  box-shadow: none !important;
  color: var(--color-accent, #8ecae6);
  font: inherit;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.78rem;
  text-align: left;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  transform: none !important;
}

.web-button.web-file-search-path:hover,
.web-button.web-file-search-path:focus-visible {
  text-decoration: underline;
  transform: none !important;
}

.web-file-search-location {
  flex-shrink: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.74rem;
}

.web-file-search-line {
  display: block;
  margin-top: 0.2rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.8rem;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
}

${fileBreadcrumbCss}

${fileOpenTimelineButtonCss}
`.trim(),
};
