import { describe, expect, test } from 'bun:test';

import { parseFileInvocationFromJsonPayload } from './adapter';

describe('file structured command payloads', () => {
  test('preserves options when a command has no positional arguments', () => {
    const parsed = parseFileInvocationFromJsonPayload({
      alias: 'file',
      prefix: '/',
      subcommand: 'tree',
      jsonPayload: {
        arguments: {},
        options: {
          ext: 'ts,md',
          expanded: 'plugins/file',
          reveal: 'plugins/file/README.md',
        },
      },
    });

    expect(parsed).not.toBeNull();
    expect(parsed?.arguments).toEqual({});

    expect(parsed?.options).toEqual({
      ext: 'ts,md',
      expanded: 'plugins/file',
      reveal: 'plugins/file/README.md',
    });
  });
});
