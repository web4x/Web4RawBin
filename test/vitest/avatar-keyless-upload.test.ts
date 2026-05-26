/**
 * T92 RE-FIX (v0.5.1, commit 057d491): Avatar upload must JUST SUCCEED — no key error ever.
 *
 * Exercises the REAL shipped server modules (UserKeys + UserCrypto), not a re-implementation,
 * by replicating the exact POST /api/avatar handler sequence (server.ts:328-341):
 *   createUserHome → generateUserKeypair → try encryptFile / catch regenerateUserKeypair + retry
 * across the three key states the architect identified, then asserts the SERVE path
 * (decryptFile of the stored avatar) returns the EXACT uploaded bytes (AC6).
 *
 * Uses a synthetic token under the real data/ dir (DATA_DIR is hardcoded), cleaned up per test.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

import {
  createUserHome,
  generateUserKeypair,
  regenerateUserKeypair,
  getUserHomeDir,
} from '../../src/ts/server/UserKeys.js';
import { encryptFile, decryptFile, fileExists } from '../../src/ts/server/UserCrypto.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Real 200x200 RGB PNG (a genuine decodable image, ~the size of a real upload) ──
function crc32(buf: Buffer): number {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function pngChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}
function makePng(w = 200, h = 200): Buffer {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    const off = y * (w * 3 + 1);
    raw[off] = 0; // no filter
    for (let x = 0; x < w; x++) {
      const p = off + 1 + x * 3;
      raw[p] = (x + y) & 0xff; raw[p + 1] = (x * 2) & 0xff; raw[p + 2] = (y * 2) & 0xff;
    }
  }
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit, color type 2 (RGB)
  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Exact replica of POST /api/avatar handler body (server.ts:328-341) ──
// Returns true on success; throws ONLY if both encrypt attempts fail (catastrophic).
function handleAvatarUpload(token: string, buf: Buffer, mimeType: string, ext: string): boolean {
  createUserHome(token);
  generateUserKeypair(token);
  try {
    encryptFile(token, buf, mimeType, `avatar.${ext}`, 'avatar');
  } catch {
    regenerateUserKeypair(token);
    encryptFile(token, buf, mimeType, `avatar.${ext}`, 'avatar');
  }
  return true;
}

// ── The serve path (server.ts /api/avatar/<token>): decrypt stored avatar ──
function servedAvatarBytes(token: string): Buffer {
  return decryptFile(token, 'avatar').data;
}

describe('T92 RE-FIX: avatar upload just succeeds, no key error (v0.5.1)', () => {
  let token: string;
  const PNG = makePng();
  const idRsa = (t: string) => path.join(getUserHomeDir(t), '.ssh', 'id_rsa');
  const idRsaPub = (t: string) => path.join(getUserHomeDir(t), '.ssh', 'id_rsa.pub');

  beforeEach(() => { token = 'T92TEST-' + crypto.randomBytes(8).toString('hex'); });
  afterEach(() => { try { fs.rmSync(getUserHomeDir(token), { recursive: true, force: true }); } catch {} });

  it('uses a real 200x200 PNG (not a stub) — guards the avatar-verification lesson', () => {
    expect(PNG.length).toBeGreaterThan(2000);
    expect(PNG.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  });

  // AC1/AC2/AC6 — fresh state: no .ssh tree at all
  it('AC2 FRESH state: upload succeeds first try, no throw; served bytes == uploaded', () => {
    expect(fs.existsSync(getUserHomeDir(token))).toBe(false);
    expect(() => handleAvatarUpload(token, PNG, 'image/png', 'png')).not.toThrow();
    expect(fileExists(token, 'avatar')).toBe(true);
    expect(servedAvatarBytes(token).equals(PNG)).toBe(true);
  });

  // AC2 — desynced state: flag would be true but key FILES are missing
  it('AC2 DESYNCED state (flag true / key files missing): upload succeeds, served bytes == uploaded', () => {
    createUserHome(token);
    generateUserKeypair(token);
    fs.rmSync(idRsa(token), { force: true });
    fs.rmSync(idRsaPub(token), { force: true });
    expect(fs.existsSync(idRsaPub(token))).toBe(false);

    expect(() => handleAvatarUpload(token, PNG, 'image/png', 'png')).not.toThrow();
    expect(servedAvatarBytes(token).equals(PNG)).toBe(true);
  });

  // AC3 — present-but-corrupt key: encrypt throws → regenerate + retry once → succeeds
  it('AC3 CORRUPT public key: encrypt throws, server regenerates + retries once → succeeds; served bytes == uploaded', () => {
    createUserHome(token);
    generateUserKeypair(token);
    fs.writeFileSync(idRsaPub(token), 'not-a-real-pem-key-garbage');
    fs.writeFileSync(idRsa(token), 'not-a-real-pem-key-garbage');

    // sanity: the corrupt key really does break a single encrypt attempt
    expect(() => encryptFile(token, PNG, 'image/png', 'avatar.png', 'avatar')).toThrow();

    // the handler's self-heal recovers in the same request, no throw to the user
    expect(() => handleAvatarUpload(token, PNG, 'image/png', 'png')).not.toThrow();
    expect(servedAvatarBytes(token).equals(PNG)).toBe(true);
  });

  // AC1/AC3 — corrupt then a SECOND upload still works (idempotent, no stale key)
  it('AC1 repeat upload after self-heal succeeds with a fresh image', () => {
    createUserHome(token);
    generateUserKeypair(token);
    fs.writeFileSync(idRsaPub(token), 'garbage');
    handleAvatarUpload(token, PNG, 'image/png', 'png');
    const PNG2 = makePng(220, 220);
    expect(() => handleAvatarUpload(token, PNG2, 'image/png', 'png')).not.toThrow();
    expect(servedAvatarBytes(token).equals(PNG2)).toBe(true);
  });

  // AC6 — served bytes are the REAL uploaded photo, never the icon-192 fallback stub
  it('AC6 served avatar is the uploaded photo, not the fallback stub', () => {
    handleAvatarUpload(token, PNG, 'image/png', 'png');
    const served = servedAvatarBytes(token);
    const fallback = fs.readFileSync(path.join(__dirname, '../../src/public/icon-192.png'));
    expect(served.equals(PNG)).toBe(true);
    expect(served.equals(fallback)).toBe(false);
  });
});
