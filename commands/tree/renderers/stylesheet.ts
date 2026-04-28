import type { WebStyleSheet } from '@src/web/ui-schema';

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

.web-file-tree-nav-sep {
  opacity: 0.45;
  user-select: none;
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
`.trim(),
};
