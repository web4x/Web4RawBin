/**
 * AVATAR FIX v0.5.9 (commit 75053e4): avatar survives a keypair regen.
 *
 * Root cause (avatar-fallback-rootcause.captured.md): a keypair rotation left avatar.enc
 * wrapped under the OLD RSA key → decryptFile failed → /api/avatar fell back to the SVG
 * initials. FIX: rekeyUser(token) decrypts every file with the CURRENT key FIRST, rotates
 * the keypair, then re-wraps each with the NEW key. Avatar stays decryptable, same bytes.
 *
 * Exercises the REAL shipped modules (UserKeys + UserCrypto), synthetic token under the
 * real data/ dir (DATA_DIR hardcoded in modules), cleaned up per test.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';

import {
  createUserHome,
  generateUserKeypair,
  getUserHomeDir,
} from '../../src/ts/server/UserKeys.js';
import { encryptFile, decryptFile, fileExists, rekeyUser } from '../../src/ts/server/UserCrypto.js';

// ── Real 200x200 RGB PNG (genuine decodable image) ──
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
    raw[off] = 0;
    for (let x = 0; x < w; x++) {
      const p = off + 1 + x * 3;
      raw[p] = (x + y) & 0xff; raw[p + 1] = (x * 2) & 0xff; raw[p + 2] = (y * 2) & 0xff;
    }
  }
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([sig, pngChunk('IHDR', ihdr), pngChunk('IDAT', zlib.deflateSync(raw)), pngChunk('IEND', Buffer.alloc(0))]);
}

describe('Avatar survives keypair regen — rekeyUser (v0.5.9)', () => {
  let token: string;
  const PNG = makePng();
  const idRsa = (t: string) => path.join(getUserHomeDir(t), '.ssh', 'id_rsa');

  beforeEach(() => {
    token = 'REKEYTEST-' + crypto.randomBytes(8).toString('hex');
    createUserHome(token);
    generateUserKeypair(token);
  });
  afterEach(() => { try { fs.rmSync(getUserHomeDir(token), { recursive: true, force: true }); } catch {} });

  it('guard: uses a real 200x200 PNG, not a stub', () => {
    expect(PNG.length).toBeGreaterThan(2000);
    expect(PNG.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  });

  it('avatar decrypts to SAME bytes AFTER rekeyUser (no decrypt-fail, no SVG fallback)', () => {
    // (1) upload avatar — avatar.enc wrapped with key K1
    encryptFile(token, PNG, 'image/png', 'avatar.png', 'avatar');
    expect(fileExists(token, 'avatar')).toBe(true);
    const before = decryptFile(token, 'avatar').data;
    expect(before.equals(PNG)).toBe(true);
    const k1 = fs.readFileSync(idRsa(token), 'utf-8');

    // (2) rotate the keypair
    const res = rekeyUser(token);

    // key actually rotated
    const k2 = fs.readFileSync(idRsa(token), 'utf-8');
    expect(k2).not.toBe(k1);

    // (3) avatar still decrypts, SAME bytes, with the NEW key
    expect(fileExists(token, 'avatar')).toBe(true);
    const after = decryptFile(token, 'avatar');
    expect(after.data.equals(PNG)).toBe(true);
    expect(after.mimeType).toBe('image/png');
  });

  it('rekeyUser returns {reEncrypted>=1, lost:0} for a decryptable avatar', () => {
    encryptFile(token, PNG, 'image/png', 'avatar.png', 'avatar');
    const res = rekeyUser(token);
    expect(res.reEncrypted).toBeGreaterThanOrEqual(1);
    expect(res.lost).toBe(0);
  });

  it('multiple files all survive rekey (avatar + a second file)', () => {
    encryptFile(token, PNG, 'image/png', 'avatar.png', 'avatar');
    const doc = Buffer.from('a second encrypted file payload');
    encryptFile(token, doc, 'text/plain', 'note.txt', 'note');

    const res = rekeyUser(token);
    expect(res.reEncrypted).toBe(2);
    expect(res.lost).toBe(0);

    expect(decryptFile(token, 'avatar').data.equals(PNG)).toBe(true);
    expect(decryptFile(token, 'note').data.equals(doc)).toBe(true);
  });

  it('idempotent: rekey twice still yields the same avatar bytes', () => {
    encryptFile(token, PNG, 'image/png', 'avatar.png', 'avatar');
    rekeyUser(token);
    rekeyUser(token);
    expect(decryptFile(token, 'avatar').data.equals(PNG)).toBe(true);
  });

  it('edge: a file unrecoverable under the current key is counted lost + skipped (no throw)', () => {
    encryptFile(token, PNG, 'image/png', 'avatar.png', 'avatar');
    // Corrupt the avatar ciphertext so decrypt with the current key fails
    const filesDir = path.join(getUserHomeDir(token), 'files');
    const encName = fs.readdirSync(filesDir).find(f => f.endsWith('.enc') && !f.includes('meta'))
      || fs.readdirSync(filesDir).find(f => f.endsWith('.enc'));
    if (encName) {
      const p = path.join(filesDir, encName);
      const buf = fs.readFileSync(p);
      buf[0] ^= 0xff; buf[buf.length - 1] ^= 0xff;
      fs.writeFileSync(p, buf);
    }
    // rekey must not throw; the corrupt file is counted lost, not re-encrypted
    let res: { reEncrypted: number; lost: number } | undefined;
    expect(() => { res = rekeyUser(token); }).not.toThrow();
    expect(res!.lost).toBeGreaterThanOrEqual(1);
  });
});
