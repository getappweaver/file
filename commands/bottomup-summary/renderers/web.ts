import type { WebAction, WebNodeRoot } from '@src/web/ui-schema';

function saveAction(params: { command: string; state: string }): WebAction {
  return {
    type: 'command',
    command: params.command,
    subcommand: 'bottomup.summary.save',
    arguments: {},
    options: { state: params.state },
    recordInTimeline: false,
    surface: 'modal',
    modalTitle: 'Bottom-up summary',
  };
}

export function renderBottomupSummaryPreview(params: {
  command: string;
  content: string;
  defaultLocation: string;
  state: string;
  format: 'markdown' | 'json';
}): WebNodeRoot {
  return {
    kind: 'ui',
    version: 1,
    meta: {
      command: params.command,
      subcommand: 'bottomup.summary',
      arguments: {},
      options: { draft: true },
    },
    tree: {
      type: 'element',
      tag: 'stack',
      props: { gap: 'md', padding: 'md' },
      children: [
        {
          type: 'element',
          tag: 'text',
          props: {
            className: 'bottomup-summary-preview',
            ui: `hljs-code:${params.format}`,
          },
          children: [{ type: 'text', value: params.content }],
        },
        {
          type: 'element',
          tag: 'form',
          props: {
            className: 'bottomup-summary-save',
            formOptionFieldNames: ['location'],
            action: saveAction({
              command: params.command,
              state: params.state,
            }),
          },
          children: [
            {
              type: 'element',
              tag: 'textField',
              props: {
                formFieldName: 'location',
                value: params.defaultLocation,
                inputPlaceholder: 'Workspace-relative export path',
                ariaLabel: 'Summary export path',
              },
            },
            {
              type: 'element',
              tag: 'button',
              props: { label: 'Save', htmlType: 'submit' },
            },
          ],
        },
        {
          type: 'element',
          tag: 'button',
          props: {
            label: 'Close',
            action: {
              type: 'clientAction',
              action: 'web.closeModal',
              payload: {},
            },
          },
        },
      ],
    },
    stylesheets: [
      {
        id: 'bottomup-summary-preview',
        cssText: `
          .bottomup-summary-preview {
            display: block;
            max-height: 32rem;
            overflow: auto;
            padding: 0.85rem;
            border: 1px solid var(--color-border);
            border-radius: 0.45rem;
            white-space: pre-wrap;
            overflow-wrap: anywhere;
            font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
            font-size: 0.8rem;
            line-height: 1.5;
          }
          .bottomup-summary-save {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            gap: 0.65rem;
            align-items: end;
          }
          @media (max-width: 560px) {
            .bottomup-summary-save { grid-template-columns: 1fr; }
          }
        `,
      },
    ],
    shadowMountOverflow: 'hidden',
  };
}
