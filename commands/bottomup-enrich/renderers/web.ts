import type { WebAction, WebNode, WebNodeRoot } from '@src/web/ui-schema';

import type { EnrichResult } from '../types';

type EnrichDraft = Extract<EnrichResult, { type: 'draft' }>;

function action(params: {
  command: string;
  subcommand: string;
  options: Record<string, unknown>;
}): WebAction {
  return {
    type: 'command',
    command: params.command,
    subcommand: params.subcommand,
    arguments: {},
    options: params.options,
    recordInTimeline: false,
    surface: 'modal',
    modalTitle: 'Bottom-up enrichment draft',
  };
}

function revisionForm(command: string, draft: EnrichDraft): WebNode {
  return {
    type: 'element',
    tag: 'form',
    props: {
      className: 'bottomup-enrich-revision',
      formOptionFieldNames: ['prompt'],
      action: action({
        command,
        subcommand: 'bottomup.enrich.revise',
        options: { state: draft.state },
      }),
    },
    children: [
      {
        type: 'element',
        tag: 'textArea',
        props: {
          formFieldName: 'prompt',
          inputPlaceholder: 'Describe how the enrichment should change…',
          maxRows: 8,
        },
      },
      {
        type: 'element',
        tag: 'button',
        props: { label: 'Revise', htmlType: 'submit' },
      },
    ],
  };
}

export function renderBottomupEnrichDraft(params: {
  command: string;
  draft: EnrichDraft;
}): WebNodeRoot {
  return {
    kind: 'ui',
    version: 1,
    meta: {
      command: params.command,
      subcommand: 'bottomup.enrich',
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
          props: { weight: 'bold', size: 'lg' },
          children: [
            {
              type: 'text',
              value: `${params.draft.updated.length} proposed enrichment change(s)`,
            },
          ],
        },
        {
          type: 'element',
          tag: 'diffPatch',
          props: {
            className: 'bottomup-enrich-diff',
            diffPatch: params.draft.diff,
          },
        },
        revisionForm(params.command, params.draft),
        {
          type: 'element',
          tag: 'row',
          props: { gap: 'sm' },
          children: [
            {
              type: 'element',
              tag: 'button',
              props: {
                label: 'Accept',
                tone: 'success',
                action: action({
                  command: params.command,
                  subcommand: 'bottomup.enrich.accept',
                  options: { state: params.draft.state },
                }),
              },
            },
            {
              type: 'element',
              tag: 'button',
              props: {
                label: 'Decline',
                tone: 'danger',
                action: {
                  type: 'clientAction',
                  action: 'web.closeModal',
                  payload: {},
                },
              },
            },
          ],
        },
      ],
    },
    stylesheets: [
      {
        id: 'bottomup-enrich-draft',
        cssText: `
          .bottomup-enrich-diff {
            max-height: 28rem;
            font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
            font-size: 0.78rem;
            line-height: 1.45;
          }
          .bottomup-enrich-revision { display: grid; gap: 0.65rem; }
        `,
      },
    ],
    shadowMountOverflow: 'hidden',
  };
}
