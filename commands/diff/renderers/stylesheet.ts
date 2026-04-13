import type { WebStyleSheet } from '@src/web/ui-schema';

export const filePluginDiffStylesheet: WebStyleSheet = {
  id: 'file-plugin-diff',
  cssText: `
.web-file-diff-block {
  max-height: 60vh;
  overflow: auto;
  padding: 0.5rem 0.55rem;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.2);
  box-sizing: border-box;
}

.web-file-diff-lines.web-stack {
  gap: 0;
}

.web-file-diff-line {
  display: block;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.8rem;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
}

.web-file-diff-line-header {
  color: var(--color-text-muted, #a8a8a8);
}

.web-file-diff-line-hunk {
  color: var(--color-accent, #8ecae6);
}

.web-file-diff-line-add {
  color: var(--color-success, #73c991);
}

.web-file-diff-line-remove {
  color: var(--color-danger, #f48771);
}

.web-file-diff-line-context {
  color: var(--color-text, #d4d4d4);
  opacity: 0.82;
}
`.trim(),
};
