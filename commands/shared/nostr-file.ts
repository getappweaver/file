import { finalizeEvent, nip19 } from 'nostr-tools';

const BLOSSOM_URL = 'https://blossom-01.uid.ovh/';
export const FILE_KIND = 34343;

export function buildBlossomAuth(
  privkey: Uint8Array,
  verb: 'upload' | 'get' | 'delete',
  blobSha256?: string,
): string {
  const tags: string[][] = [
    ['t', verb],
    ['expiration', String(Math.floor(Date.now() / 1000) + 300)],
  ];

  if (blobSha256) {
    tags.push(['x', blobSha256]);
  }

  const event = finalizeEvent(
    {
      kind: 24242,
      created_at: Math.floor(Date.now() / 1000),
      tags,
      content: verb,
    },
    privkey,
  );

  return 'Nostr ' + btoa(JSON.stringify(event));
}

export async function blossomUpload(
  privkey: Uint8Array,
  blob: Uint8Array,
  hash: string,
): Promise<{ url: string; sha256: string }> {
  const auth = buildBlossomAuth(privkey, 'upload', hash);

  const res = await fetch(`${BLOSSOM_URL}/upload`, {
    method: 'PUT',
    headers: {
      Authorization: auth,
      'Content-Type': 'application/octet-stream',
      'X-SHA-256': hash,
    },
    body: blob as unknown as BodyInit,
  });

  if (!res.ok) {
    const reason = res.headers.get('X-Reason') ?? res.statusText;
    throw new Error(`Blossom upload failed ${res.status}: ${reason}`);
  }

  const descriptor = (await res.json()) as { url: string; sha256: string };

  return { url: descriptor.url, sha256: descriptor.sha256 };
}

export async function blossomDownload(
  privkey: Uint8Array,
  url: string,
): Promise<Uint8Array> {
  const sha256Hash = url.split('/').pop()!.split('.')[0];
  const auth = buildBlossomAuth(privkey, 'get', sha256Hash);

  const res = await fetch(url, {
    headers: { Authorization: auth },
  });

  if (!res.ok) {
    throw new Error(`Blossom download failed ${res.status}: ${url}`);
  }

  return new Uint8Array(await res.arrayBuffer());
}

export function buildFileNaddr(
  pubkey: string,
  filename: string,
  relays: string[],
): string {
  return nip19.naddrEncode({
    kind: FILE_KIND,
    pubkey,
    identifier: filename,
    relays: relays.slice(0, 3),
  });
}
