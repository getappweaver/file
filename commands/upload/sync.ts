import { readFile } from 'fs/promises';
import { basename } from 'path';

import { gcm } from '@noble/ciphers/aes.js';
import { randomBytes } from '@noble/ciphers/utils.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';
import {
  finalizeEvent,
  getPublicKey,
  nip19,
  nip44,
  SimplePool,
} from 'nostr-tools';

import type { FileShareNostrConfig } from '@src/env';

import { blossomUpload, buildFileNaddr, FILE_KIND } from '../shared/nostr-file';

type FileUploadProps = {
  filePath: string;
  recipientNpub: string;
  nostr: FileShareNostrConfig;
};

export type FileUploadResult = {
  filename: string;
  naddr: string;
  skipped: boolean;
};

export async function fileUpload({
  filePath,
  recipientNpub,
  nostr,
}: FileUploadProps): Promise<FileUploadResult> {
  const decoded = nip19.decode(recipientNpub);

  if (decoded.type !== 'npub') {
    throw new Error(`Expected npub, got: ${decoded.type}`);
  }

  const recipientPubkeyHex = decoded.data as string;
  const fileBytes = new Uint8Array(await readFile(filePath));
  const filename = basename(filePath);
  const plaintextHash = bytesToHex(sha256(fileBytes));
  const privkeyBytes = hexToBytes(nostr.botKeyHex);
  const botPubkey = getPublicKey(privkeyBytes);
  const pool = new SimplePool();
  const relays = nostr.botRelayUrls;

  let prevHash: string | undefined;

  try {
    const existing = await pool.get(relays, {
      kinds: [FILE_KIND],
      authors: [botPubkey],
      '#d': [filename],
      limit: 1,
    });

    if (existing) {
      const remoteHash = existing.tags.find((t) => t[0] === 'hash')?.[1];

      if (remoteHash === plaintextHash) {
        console.log(
          '[file-sync] File unchanged (hash matches remote). Nothing to upload.',
        );

        pool.close(relays);
        const naddr = buildFileNaddr(botPubkey, filename, relays);

        return { filename, naddr, skipped: true };
      }

      if (remoteHash) {
        console.warn(
          `[file-sync] Warning: Remote version differs from your local base.\n  Remote hash: ${remoteHash}\n  Uploading anyway, setting prev=${remoteHash}`,
        );

        prevHash = remoteHash;
      }
    }
  } catch (err) {
    console.warn(
      `[file-sync] Could not fetch existing event (proceeding): ${String(err)}`,
    );
  }

  const aesKey = randomBytes(32);
  const nonce = randomBytes(12);
  const cipher = gcm(aesKey, nonce);
  const encryptedBody = cipher.encrypt(fileBytes);
  const blob = new Uint8Array(12 + encryptedBody.length);
  blob.set(nonce, 0);
  blob.set(encryptedBody, 12);

  const ciphertextHash = bytesToHex(sha256(blob));
  console.log('[file-sync] Uploading to Blossom...');

  const { url: blossomUrl } = await blossomUpload(
    privkeyBytes,
    blob,
    ciphertextHash,
  );

  const conversationKey = nip44.v2.utils.getConversationKey(
    privkeyBytes,
    recipientPubkeyHex,
  );

  const aesKeyHex = bytesToHex(aesKey);
  const encryptedKey = nip44.v2.encrypt(aesKeyHex, conversationKey);

  const tags: string[][] = [
    ['d', filename],
    ['url', blossomUrl],
    ['x', ciphertextHash],
    ['hash', plaintextHash],
    ...(prevHash ? [['prev', prevHash]] : []),
    ['p', recipientPubkeyHex],
  ];

  const event = finalizeEvent(
    {
      kind: FILE_KIND,
      created_at: Math.floor(Date.now() / 1000),
      tags,
      content: encryptedKey,
    },
    privkeyBytes,
  );

  console.log('[file-sync] Publishing Nostr event...');
  await Promise.allSettled(pool.publish(relays, event));
  pool.close(relays);

  const naddr = buildFileNaddr(botPubkey, filename, relays);
  console.log(`[file-sync] Upload complete: ${filename}`);
  console.log(`naddr: ${naddr}`);

  return { filename, naddr, skipped: false };
}
