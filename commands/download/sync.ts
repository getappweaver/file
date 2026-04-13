import { access, readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';

import { gcm } from '@noble/ciphers/aes.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';
import { nip19, nip44, SimplePool } from 'nostr-tools';

import type { FileShareNostrConfig } from '@src/env';

import { blossomDownload, FILE_KIND } from '../shared/nostr-file';

type FileDownloadProps = {
  naddr: string;
  nostr: FileShareNostrConfig;
  filePath: string;
};

export type FileDownloadResult = {
  filename: string;
  path: string;
  skipped: boolean;
};

export async function fileDownload(
  opts: FileDownloadProps,
): Promise<FileDownloadResult> {
  const { naddr, nostr, filePath } = opts;
  const decoded = nip19.decode(naddr);

  if (decoded.type !== 'naddr') {
    throw new Error(`Expected naddr, got: ${decoded.type}`);
  }

  const {
    kind,
    pubkey: senderPubkeyHex,
    identifier: filename,
    relays: hintRelays,
  } = decoded.data;

  if (kind !== FILE_KIND) {
    throw new Error(`Expected kind ${FILE_KIND}, got: ${kind}`);
  }

  const privkeyBytes = hexToBytes(nostr.botKeyHex);
  const pool = new SimplePool();
  const allRelays = [...(hintRelays ?? []), ...nostr.botRelayUrls];
  const uniqueRelays = [...new Set(allRelays)];

  const event = await pool.get(uniqueRelays, {
    kinds: [FILE_KIND],
    authors: [senderPubkeyHex],
    '#d': [filename],
    limit: 1,
  });

  pool.close(uniqueRelays);

  if (!event) {
    throw new Error(`No event found for file: ${filename}`);
  }

  const url = event.tags.find((t) => t[0] === 'url')?.[1];
  const ciphertextHashTag = event.tags.find((t) => t[0] === 'x')?.[1];
  const plaintextHashTag = event.tags.find((t) => t[0] === 'hash')?.[1];
  const prevTag = event.tags.find((t) => t[0] === 'prev')?.[1];

  if (!url) {
    throw new Error('Event missing url tag');
  }

  if (!ciphertextHashTag) {
    throw new Error('Event missing x tag');
  }

  if (!plaintextHashTag) {
    throw new Error('Event missing hash tag');
  }

  const outputPath = resolve(filePath, filename);
  const incomingPath = `${outputPath}.incoming`;

  let skipWrite = false;
  let writeToIncoming = false;

  try {
    await access(outputPath);
    const existingBytes = new Uint8Array(await readFile(outputPath));
    const localFileHash = bytesToHex(sha256(existingBytes));

    if (localFileHash === plaintextHashTag) {
      console.log(`[file-sync] File is already up to date: ${filename}`);
      skipWrite = true;
    } else if (!prevTag) {
      console.log(
        `[file-sync] First upload of ${filename}, overwriting local copy.`,
      );
    } else if (localFileHash === prevTag) {
      console.log(`[file-sync] Clean fast-forward, overwriting: ${filename}`);
    } else {
      console.warn(
        `[file-sync] Conflict detected. Local file diverged from uploader's base.\n  Remote saved as: ${filename}.incoming\n  Resolve manually.`,
      );

      writeToIncoming = true;
    }
  } catch {
    // File does not exist.
  }

  if (skipWrite) {
    return { filename, path: outputPath, skipped: true };
  }

  console.log('[file-sync] Downloading blob from Blossom...');
  const blob = await blossomDownload(privkeyBytes, url);
  const actualHash = bytesToHex(sha256(blob));

  if (actualHash !== ciphertextHashTag) {
    throw new Error(
      `Blob integrity check failed. Expected: ${ciphertextHashTag}, got: ${actualHash}`,
    );
  }

  const conversationKey = nip44.v2.utils.getConversationKey(
    privkeyBytes,
    senderPubkeyHex,
  );

  const aesKeyHex = nip44.v2.decrypt(event.content, conversationKey);
  const aesKey = hexToBytes(aesKeyHex);
  const nonce = blob.slice(0, 12);
  const ciphertext = blob.slice(12);
  const fileBytes = gcm(aesKey, nonce).decrypt(ciphertext);
  const targetPath = writeToIncoming ? incomingPath : outputPath;

  await writeFile(targetPath, fileBytes);
  console.log(`[file-sync] Download complete: ${targetPath}`);

  return { filename, path: targetPath, skipped: false };
}
