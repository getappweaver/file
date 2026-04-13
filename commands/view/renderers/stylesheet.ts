import type { WebStyleSheet } from '@src/web/ui-schema';

export const filePluginViewStylesheet: WebStyleSheet = {
  id: 'file-plugin-view',
  cssText: `
.web-file-view-code.hljs {
  display: block;
  width: 100%;
  max-height: 60vh;
  overflow: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.82rem;
  line-height: 1.45;
  padding: 0.5rem 0.55rem;
  border-radius: 4px;
  box-sizing: border-box;
}
`.trim(),
};
