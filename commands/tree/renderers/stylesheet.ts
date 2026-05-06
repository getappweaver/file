import type { WebStyleSheet } from '@src/web/ui-schema';

import {
  fileBreadcrumbCss,
  fileOpenTimelineButtonCss,
} from '../../shared/web-breadcrumb';

export const filePluginTreeStylesheet: WebStyleSheet = {
  id: 'file-plugin-tree',
  cssText: `
.web-file-tree-modal-layout.web-stack {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.web-file-tree-modal-layout > .web-box.web-file-tree-block {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.web-file-tree-modal-layout > .web-row.web-file-tree-controls {
  flex-shrink: 0;
}

.web-file-tree-block {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.82rem;
  line-height: 1.45;
  padding: 0.35rem 0.5rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  overflow-x: auto;
}

.web-file-tree-block > .web-node.web-tree {
  gap: 0.06rem;
}

.web-file-tree-children.web-stack {
  gap: 0.06rem;
}

.web-file-tree-line.web-row {
  gap: 0.35rem;
  flex-wrap: nowrap;
  align-items: center;
  min-width: 0;
}

.web-file-tree-glyph-line {
  white-space: pre;
  user-select: none;
  flex-shrink: 0;
  color: inherit;
  opacity: 0.78;
}

.web-file-tree-link-wrap {
  min-width: 0;
}

.web-file-tree-path {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.78rem;
}

.web-file-tree-controls.web-row {
  flex-wrap: wrap;
  margin-top: 0.2rem;
}

.web-file-tree-breadcrumb {
  flex: 1;
}

.web-file-tree-nav-sep {
  opacity: 0.45;
  user-select: none;
}

.web-button.web-file-advanced-search-button,
.web-button.web-file-timeline-diff-button {
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

.web-button.web-file-advanced-search-button::before,
.web-button.web-file-timeline-diff-button::before {
  content: '';
  display: block;
  width: 0.82rem;
  height: 0.82rem;
  background: currentColor;
  mask: url("data:image/svg+xml,%3Csvg viewBox='0 0 1024 1024' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M476 399.1c0-3.9-3.1-7.1-7-7.1h-42c-3.8 0-7 3.2-7 7.1V484h-84.5c-4.1 0-7.5 3.1-7.5 7v42c0 3.8 3.4 7 7.5 7H420v84.9c0 3.9 3.2 7.1 7 7.1h42c3.9 0 7-3.2 7-7.1V540h84.5c4.1 0 7.5-3.2 7.5-7v-42c0-3.9-3.4-7-7.5-7H476v-84.9zM560.5 704h-225c-4.1 0-7.5 3.2-7.5 7v42c0 3.8 3.4 7 7.5 7h225c4.1 0 7.5-3.2 7.5-7v-42c0-3.8-3.4-7-7.5-7zm-7.1-502.6c-6-6-14.1-9.4-22.6-9.4H192c-17.7 0-32 14.3-32 32v704c0 17.7 14.3 32 32 32h512c17.7 0 32-14.3 32-32V397.3c0-8.5-3.4-16.6-9.4-22.6L553.4 201.4zM664 888H232V264h282.2L664 413.8V888zm190.2-581.4L611.3 72.9c-6-5.7-13.9-8.9-22.2-8.9H296c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h277l219 210.6V824c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8V329.6c0-8.7-3.5-17-9.8-23z'/%3E%3C/svg%3E") center / contain no-repeat;
  -webkit-mask: url("data:image/svg+xml,%3Csvg viewBox='0 0 1024 1024' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M476 399.1c0-3.9-3.1-7.1-7-7.1h-42c-3.8 0-7 3.2-7 7.1V484h-84.5c-4.1 0-7.5 3.1-7.5 7v42c0 3.8 3.4 7 7.5 7H420v84.9c0 3.9 3.2 7.1 7 7.1h42c3.9 0 7-3.2 7-7.1V540h84.5c4.1 0 7.5-3.2 7.5-7v-42c0-3.9-3.4-7-7.5-7H476v-84.9zM560.5 704h-225c-4.1 0-7.5 3.2-7.5 7v42c0 3.8 3.4 7 7.5 7h225c4.1 0 7.5-3.2 7.5-7v-42c0-3.8-3.4-7-7.5-7zm-7.1-502.6c-6-6-14.1-9.4-22.6-9.4H192c-17.7 0-32 14.3-32 32v704c0 17.7 14.3 32 32 32h512c17.7 0 32-14.3 32-32V397.3c0-8.5-3.4-16.6-9.4-22.6L553.4 201.4zM664 888H232V264h282.2L664 413.8V888zm190.2-581.4L611.3 72.9c-6-5.7-13.9-8.9-22.2-8.9H296c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h277l219 210.6V824c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8V329.6c0-8.7-3.5-17-9.8-23z'/%3E%3C/svg%3E") center / contain no-repeat;
}

.web-button.web-file-advanced-search-button:hover,
.web-button.web-file-timeline-diff-button:hover,
.web-button.web-file-timeline-diff-button:focus-visible,
.web-button.web-file-advanced-search-button:focus-visible {
  background: var(--color-accent, #8ecae6) !important;
  color: #000;
  box-shadow: 3px 3px 0 var(--color-panel-shadow, rgba(0, 0, 0, 0.7));
  transform: none;
}

.web-button.web-file-advanced-search-button:active,
.web-button.web-file-timeline-diff-button:active {
  background: color-mix(in srgb, var(--color-accent, #8ecae6) 72%, #000) !important;
  box-shadow: 1px 1px 0 var(--color-panel-shadow, rgba(0, 0, 0, 0.7));
  transform: translate(2px, 2px);
}

.web-button.web-file-timeline-diff-button {
  background: color-mix(in srgb, var(--color-warning, #f2cc60) 86%, transparent) !important;
}

.web-button.web-file-timeline-diff-button::before {
  mask: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M160 64h192v48H160V64Zm-48 96h288v48H112v-48Zm48 96h192v48H160v-48Zm-48 96h288v48H112v-48Z'/%3E%3C/svg%3E") center / contain no-repeat;
  -webkit-mask: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M160 64h192v48H160V64Zm-48 96h288v48H112v-48Zm48 96h192v48H160v-48Zm-48 96h288v48H112v-48Z'/%3E%3C/svg%3E") center / contain no-repeat;
}

.web-button.web-file-timeline-diff-button:hover,
.web-button.web-file-timeline-diff-button:focus-visible {
  background: var(--color-warning, #f2cc60) !important;
}

.web-button.web-tree-link {
  display: block;
  background: transparent !important;
  box-shadow: none !important;
  padding: 0 !important;
  margin: 0;
  border: none;
  border-radius: 0;
  color: inherit;
  text-decoration: none;
  text-align: left;
  min-height: 0;
  transform: none !important;
  vertical-align: baseline;
  font: inherit;
  cursor: pointer;
  max-width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.web-button.web-tree-link:hover,
.web-button.web-tree-link:focus-visible {
  background: transparent !important;
  box-shadow: none !important;
  text-decoration: underline;
  transform: none !important;
}

.web-button.web-tree-link:active {
  background: transparent !important;
  box-shadow: none !important;
  transform: none !important;
}

.web-tree-link-dir {
  color: var(--color-accent, #8ecae6);
}

.web-tree-link-file {
  color: inherit;
}

/* Git filename + badge share one tone per row (see web-file-tree-line-git-*). */
.web-tree-link-git-modified {
  color: #d7ba7d;
}

.web-tree-link-git-added,
.web-tree-link-git-untracked {
  color: #73c991;
}

.web-tree-link-git-deleted,
.web-tree-link-git-conflicted {
  color: var(--color-danger, #f48771);
}

.web-tree-link-git-renamed {
  color: var(--color-info, #75beff);
}

.web-file-tree-line.web-file-tree-line-git-modified .web-button.web-tree-link,
.web-file-tree-line.web-file-tree-line-git-modified .web-node.web-badge,
.web-file-tree-line.web-file-tree-line-git-modified .web-button.web-tree-git-badge-button {
  color: #d7ba7d;
}

.web-file-tree-line.web-file-tree-line-git-added .web-button.web-tree-link,
.web-file-tree-line.web-file-tree-line-git-added .web-node.web-badge,
.web-file-tree-line.web-file-tree-line-git-added .web-button.web-tree-git-badge-button,
.web-file-tree-line.web-file-tree-line-git-untracked .web-button.web-tree-link,
.web-file-tree-line.web-file-tree-line-git-untracked .web-node.web-badge,
.web-file-tree-line.web-file-tree-line-git-untracked .web-button.web-tree-git-badge-button {
  color: #73c991;
}

.web-file-tree-line.web-file-tree-line-git-renamed .web-button.web-tree-link,
.web-file-tree-line.web-file-tree-line-git-renamed .web-node.web-badge,
.web-file-tree-line.web-file-tree-line-git-renamed .web-button.web-tree-git-badge-button {
  color: var(--color-info, #75beff);
}

.web-file-tree-line.web-file-tree-line-git-deleted .web-button.web-tree-link,
.web-file-tree-line.web-file-tree-line-git-deleted .web-node.web-badge,
.web-file-tree-line.web-file-tree-line-git-deleted .web-button.web-tree-git-badge-button,
.web-file-tree-line.web-file-tree-line-git-conflicted .web-button.web-tree-link,
.web-file-tree-line.web-file-tree-line-git-conflicted .web-node.web-badge,
.web-file-tree-line.web-file-tree-line-git-conflicted .web-button.web-tree-git-badge-button {
  color: var(--color-danger, #f48771);
}

.web-file-tree-line.web-file-tree-line-git-deleted .web-button.web-tree-link {
  text-decoration: line-through;
}

.web-file-tree-line.web-file-tree-line-git-deleted
  .web-button.web-tree-link:hover,
.web-file-tree-line.web-file-tree-line-git-deleted
  .web-button.web-tree-link:focus-visible {
  text-decoration: line-through underline;
}

.web-tree-link-nav {
  color: var(--color-text-muted, #a8a8a8);
}

.web-button.web-tree-link.web-tree-link-nav:hover,
.web-button.web-tree-link.web-tree-link-nav:focus-visible {
  color: var(--color-text);
}

.web-node.web-badge.web-tree-git-badge,
.web-button.web-tree-git-badge-button {
  flex-shrink: 0;
  min-width: 1.2rem;
  padding: 0;
  border: none;
  background: transparent;
  box-shadow: none;
  font-size: 0.72rem;
  font-weight: 700;
  line-height: 1;
  text-align: center;
  justify-content: center;
}

.web-button.web-tree-git-badge-button {
  min-height: 0;
  cursor: pointer;
}

.web-button.web-tree-git-badge-button:hover,
.web-button.web-tree-git-badge-button:focus-visible {
  text-decoration: underline;
  transform: none !important;
}

.web-tree-git-badge.web-tree-git-modified {
  color: #d7ba7d;
}

.web-tree-git-badge.web-tree-git-added,
.web-tree-git-badge.web-tree-git-untracked {
  color: #73c991;
}

.web-tree-git-badge.web-tree-git-deleted,
.web-tree-git-badge.web-tree-git-conflicted {
  color: var(--color-danger, #f48771);
}

.web-tree-git-badge.web-tree-git-renamed {
  color: var(--color-info, #75beff);
}

${fileBreadcrumbCss}

${fileOpenTimelineButtonCss}
`.trim(),
};
