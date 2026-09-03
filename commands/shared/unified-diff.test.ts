import { describe, expect, test } from 'bun:test';

import { createUnifiedDiff } from './unified-diff';

describe('createUnifiedDiff', () => {
  test('shows an inserted JSON block without replacing the whole file', () => {
    const existing = [
      '{',
      '  "coverage": {',
      '    "complete": true',
      '  },',
      '  "summary": null,',
      '  "context": null',
      '}',
    ].join('\n');

    const proposed = [
      '{',
      '  "coverage": {',
      '    "complete": true',
      '  },',
      '  "summary": {',
      '    "version": 1,',
      '    "value": "Compact summary"',
      '  },',
      '  "context": null',
      '}',
    ].join('\n');

    const diff = createUnifiedDiff({
      relativePath: '.BOTTOMUP.json',
      existing,
      proposed,
    });

    expect(diff).toContain('-  "summary": null,');
    expect(diff).toContain('+  "summary": {');
    expect(diff).toContain('+    "value": "Compact summary"');
    expect(diff).toContain('   "context": null');
    expect(diff).not.toContain('-  "coverage": {');
    expect(diff).not.toContain('+  "coverage": {');
  });

  test('creates separate contextual hunks for distant changes', () => {
    const existing = Array.from(
      { length: 20 },
      (_, index) => `line ${index + 1}`,
    );

    const proposed = [...existing];
    proposed[1] = 'changed near start';
    proposed[18] = 'changed near end';

    const diff = createUnifiedDiff({
      relativePath: 'file.txt',
      existing: existing.join('\n'),
      proposed: proposed.join('\n'),
      context: 2,
    });

    expect(diff.match(/^@@ /gm)).toHaveLength(2);
    expect(diff).not.toContain(' line 10');
    expect(diff).toContain('-line 2');
    expect(diff).toContain('+changed near end');
  });

  test('returns an empty patch for identical content', () => {
    expect(
      createUnifiedDiff({
        relativePath: 'file.txt',
        existing: 'same\n',
        proposed: 'same\n',
      }),
    ).toBe('');
  });
});
