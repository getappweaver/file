import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import { afterEach, describe, expect, test } from 'bun:test';

import { readSourceSnippet, type GenerateEntry } from './fs';

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function entry(content: string | Uint8Array): GenerateEntry {
  const directory = mkdtempSync(join(tmpdir(), 'bottomup-snippet-'));
  temporaryDirectories.push(directory);
  const absolutePath = join(directory, 'source.ts');
  writeFileSync(absolutePath, content);

  return {
    name: 'source.ts',
    absolutePath,
    relativePath: 'source.ts',
    isDirectory: false,
  };
}

describe('readSourceSnippet', () => {
  test('includes changed source up to the 24 KB budget', () => {
    const content = `START\n${'a'.repeat(20_000)}\nEND`;
    const result = readSourceSnippet(entry(content));

    expect(result.truncated).toBe(false);
    expect(result.text).toBe(content);
  });

  test('preserves both ends when a larger source file is truncated', () => {
    const source = `START_SENTINEL\n${'m'.repeat(30_000)}\nEND_SENTINEL`;
    const sourceEntry = entry(source);
    const result = readSourceSnippet(sourceEntry);

    expect(result.truncated).toBe(true);
    expect(result.text).toStartWith('START_SENTINEL');
    expect(result.text).toEndWith('END_SENTINEL');
    expect(result.text).toContain('[... source middle truncated ...]');
    expect(Buffer.byteLength(result.text!)).toBeLessThanOrEqual(24_000);
    expect(readFileSync(sourceEntry.absolutePath, 'utf8')).toBe(source);
  });

  test('detects null bytes beyond the retained head section', () => {
    const content = new Uint8Array(30_000).fill(65);
    content[29_000] = 0;

    expect(readSourceSnippet(entry(content)).text).toBeNull();
  });
});
