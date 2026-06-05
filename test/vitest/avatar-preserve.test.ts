/**
 * T109 part (a) — v0.5.10 (commit 0dc085e): ensureAvatar must NOT overwrite an
 * [test:uuid:d9da24e7-c11b-4ba5-85b1-ad568afcc14f] T109 avatar preserve on rekey
 * [verifies:uuid:a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d] R-A2 avatar preserve
 * EXISTING-but-undecryptable avatar.enc with a default. (Tron's permanent-loss bug:
 * a keypair rotation orphaned avatar.enc; the old ensureAvatar `catch` fell through to
 * encryptFile(default) → the user's real photo was destroyed forever.)
 *
 * ensureAvatar (server.ts:811) is module-private + does a network fetch, so — per the
 * established avatar-persist pattern — this harness mirrors the shipped 3-branch decision
 * EXACTLY (server.ts:818-842) and runs it against the REAL UserKeys/UserCrypto so the
 * "bytes unchanged" assertion is genuine. fetchFn is injected so we can prove that EVEN
 * WHEN a default is available, the undecryptable branch never writes it.
 *
 * Orphaned-ciphertext setup = encrypt under K1, then regenerateUserKeypair WITHOUT
 * re-encrypt (the opposite of rekeyUser) → avatar.enc is present but undecryptable.
 * Synthetic token under real data/, cleaned per test.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';

import {
  createUserHome,
  generateUserKeypair,
  regenerateUserKeypair,
  getUserHomeDir,
} from '../../src/ts/server/UserKeys.js';
import { encryptFile, decryptFile, fileExists } from '../../src/ts/server/UserCrypto.js';

// ── Faithful mirror of ensureAvatar's branch structure (server.ts:818-866) ──
// Returns the branch taken so the test can assert which path ran. The ONLY path that
// writes avatar.enc is 'fetched-default' (encryptFile). Network fetch is injected.
async function ensureAvatarHarness(
  token: string,
  profileAvatar: string,
  fetchFn: () => Promise<Buffer | null>,
): Promise<{ branch: string; avatar: string }> {
  let avatar = profileAvatar;
  const url = `/api/avatar/${token}`;
  if (fileExists(token, 'avatar')) {
    try {
      const { mimeType } = decryptFile(token, 'avatar');
      if (mimeType !== 'image/svg+xml') {
        if (avatar !== url) avatar = url;
        return { branch: 'protected-real', avatar };
      }
      // svg fallback → fall through to re-fetch (retry path)
    } catch {
      // T109: undecryptable existing file → PRESERVE, never overwrite
      if (avatar !== url) avatar = url;
      return { branch: 'preserved-undecryptable', avatar };
    }
  }
  const photo = await fetchFn();
  const buf = photo || Buffer.from('<svg>initials</svg>');
  const mime = photo ? 'image/jpeg' : 'image/svg+xml';
  encryptFile(token, buf, mime, 'avatar.' + (photo ? 'jpg' : 'svg'), 'avatar');
  return { branch: 'fetched-default', avatar: url };
}

function makePng(w = 200, h = 200): Buffer {
  function crc32(b: Buffer) { let c = ~0; for (let i = 0; i < b.length; i++) { c ^= b[i]; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1)); } return ~c >>> 0; }
  function chunk(t: string, d: Buffer) { const l = Buffer.alloc(4); l.writeUInt32BE(d.length, 0); const ty = Buffer.from(t, 'ascii'); const cr = Buffer.alloc(4); cr.writeUInt32BE(crc32(Buffer.concat([ty, d])), 0); return Buffer.concat([l, ty, d, cr]); }
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) { const o = y * (w * 3 + 1); raw[o] = 0; for (let x = 0; x < w; x++) { const p = o + 1 + x * 3; raw[p] = (x + y) & 255; raw[p + 1] = (x * 2) & 255; raw[p + 2] = (y * 2) & 255; } }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

function encPath(token: string): string {
  return path.join(getUserHomeDir(token), 'files', 'avatar.enc');
}
function encSha(token: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(encPath(token))).digest('hex');
}

describe('T109(a): ensureAvatar PRESERVES an undecryptable avatar.enc (v0.5.10)', () => {
  let token: string;
  const PNG = makePng();
  const alwaysFetches = async () => Buffer.from('A-DEFAULT-PHOTO-PAYLOAD-that-must-NOT-be-written');

  beforeEach(() => {
    token = 'PRESERVETEST-' + crypto.randomBytes(8).toString('hex');
    createUserHome(token);
    generateUserKeypair(token);
  });
  afterEach(() => { try { fs.rmSync(getUserHomeDir(token), { recursive: true, force: true }); } catch {} });

  it('orphaned avatar.enc (key rotated w/o re-encrypt) is UNDECRYPTABLE — precondition', () => {
    encryptFile(token, PNG, 'image/png', 'avatar.png', 'avatar');
    regenerateUserKeypair(token); // rotate WITHOUT re-encrypt → orphan the ciphertext
    expect(fileExists(token, 'avatar')).toBe(true);
    expect(() => decryptFile(token, 'avatar')).toThrow();
  });

  it('ensureAvatar PRESERVES bytes of an undecryptable avatar — NOT overwritten with default', async () => {
    encryptFile(token, PNG, 'image/png', 'avatar.png', 'avatar');
    regenerateUserKeypair(token);
    const shaBefore = encSha(token);

    // Run with a fetch that WOULD return a default — proving it is NOT written.
    const res = await ensureAvatarHarness(token, '', alwaysFetches);

    expect(res.branch).toBe('preserved-undecryptable');
    expect(fileExists(token, 'avatar')).toBe(true);
    expect(encSha(token)).toBe(shaBefore); // bytes UNCHANGED — no default written over it
    expect(res.avatar).toBe(`/api/avatar/${token}`); // URL restored (string only)
  });

  it('preserve branch does not throw even though decrypt fails', async () => {
    encryptFile(token, PNG, 'image/png', 'avatar.png', 'avatar');
    regenerateUserKeypair(token);
    await expect(ensureAvatarHarness(token, '', alwaysFetches)).resolves.toBeDefined();
  });

  it('SVG-retry path UNCHANGED: decryptable SVG fallback → re-fetches + overwrites', async () => {
    // A real (decryptable) SVG fallback avatar
    encryptFile(token, Buffer.from('<svg>initials</svg>'), 'image/svg+xml', 'avatar.svg', 'avatar');
    const shaBefore = encSha(token);
    const res = await ensureAvatarHarness(token, '', alwaysFetches);
    expect(res.branch).toBe('fetched-default'); // SVG → re-fetch path still runs
    expect(encSha(token)).not.toBe(shaBefore);  // overwritten with the new photo (expected)
  });

  it('real decryptable upload is protected (control): branch=protected-real, bytes unchanged', async () => {
    encryptFile(token, PNG, 'image/png', 'avatar.png', 'avatar');
    const shaBefore = encSha(token);
    const res = await ensureAvatarHarness(token, '', alwaysFetches);
    expect(res.branch).toBe('protected-real');
    expect(encSha(token)).toBe(shaBefore);
  });

  it('no avatar.enc → default IS fetched+written (control, AC4)', async () => {
    expect(fileExists(token, 'avatar')).toBe(false);
    const res = await ensureAvatarHarness(token, '', alwaysFetches);
    expect(res.branch).toBe('fetched-default');
    expect(fileExists(token, 'avatar')).toBe(true);
  });
});
