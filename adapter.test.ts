import { describe, expect, test } from 'bun:test';

import { parseFileInvocationFromJsonPayload } from './adapter';

describe('file structured command payloads', () => {
  test('preserves options when a command has no positional arguments', () => {
    const parsed = parseFileInvocationFromJsonPayload({
      alias: 'file',
      prefix: '/',
      subcommand: 'bottomup.generate',
      jsonPayload: {
        arguments: {},
        options: {
          path: 'plugins/file/commands/commit',
          prompt:
            'Check plugins/file/.BOTTOMUP.json for the general idea of the app.',
          enrich: true,
          draft: true,
        },
      },
    });

    expect(parsed).not.toBeNull();
    expect(parsed?.arguments).toEqual({});

    expect(parsed?.options).toEqual({
      path: 'plugins/file/commands/commit',
      prompt:
        'Check plugins/file/.BOTTOMUP.json for the general idea of the app.',
      enrich: true,
      draft: true,
    });
  });
});
