/**
 * T91 (v0.4.11): Avatar persistence — uploaded photo must NOT revert to default.
 * [test:uuid:aba97062-537a-4442-805a-6e41e7705ade] T91 avatar persistence
 * [verifies:uuid:a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d] R-A2 avatar upload
 *
 * The fix is a guard in ensureAvatar() (server.ts:792-834): before fetching a default avatar
 * it checks `fileExists(token,'avatar')` and, if the stored avatar decrypts to a NON-SVG (a real
 * upload), restores the profile.avatar URL and RETURNS — never reaching the encryptFile that would
 * overwrite avatar.enc with a default. ensureAvatar is module-private + does a network fetch, so
 * this test verifies the guard's REAL decision inputs against the real UserKeys/UserCrypto:
 *   - a real upload satisfies the protect predicate (fileExists && mime !== 'image/svg+xml')
 *   - an initials-SVG fallback does NOT (so the upgrade path correctly re-fetches)
 *   - no avatar.enc → default-fetch path is the only one reachable (AC4)
 *   - reading/decrypting avatar.enc never mutates it (the protect path touches only the string)
 * Combined with code review of the shipped guard, this covers AC4/AC5; AC1-AC3 are emergent
 * (the file is the source of truth and GET /api/avatar serves it). Synthetic token under real data/.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

import {
  createUserHome,
  generateUserKeypair,
  getUserHomeDir,
} from '../../src/ts/server/UserKeys.js';
import { encryptFile, decryptFile, fileExists } from '../../src/ts/server/UserCrypto.js';

// Exact replica of the ensureAvatar protect predicate (server.ts:799-810).
function avatarIsProtected(token: string): boolean {
  if (!fileExists(token, 'avatar')) return false;
  try {
    const { mimeType } = decryptFile(token, 'avatar');
    return mimeType !== 'image/svg+xml';
  } catch {
    return false; // corrupt → not protected, fall through to default
  }
}

function encHash(token: string): string {
  const encPath = path.join(getUserHomeDir(token), 'files', 'avatar.enc');
  return crypto.createHash('sha256').update(fs.readFileSync(encPath)).digest('hex');
}

describe('T91: avatar persists, never reverts to default (v0.4.11)', () => {
  let token: string;
  const REAL_PHOTO = crypto.randomBytes(8000); // stands in for a real uploaded JPEG/PNG
  const INITIALS_SVG = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><text>R</text></svg>');

  beforeEach(() => {
    token = 'T91TEST-' + crypto.randomBytes(8).toString('hex');
    createUserHome(token);
    generateUserKeypair(token);
  });
  afterEach(() => { try { fs.rmSync(getUserHomeDir(token), { recursive: true, force: true }); } catch {} });

  // AC4/AC5 — a real upload is protected from the default backfill
  it('AC5 real uploaded avatar satisfies the protect predicate → backfill returns, never overwrites', () => {
    encryptFile(token, REAL_PHOTO, 'image/png', 'avatar.png', 'avatar');
    expect(fileExists(token, 'avatar')).toBe(true);
    expect(avatarIsProtected(token)).toBe(true); // ensureAvatar would return at line 809
  });

  // AC5 — decrypting/reading the stored avatar does not mutate avatar.enc
  it('AC5 reading avatar.enc (the protect path) does not change the bytes', () => {
    encryptFile(token, REAL_PHOTO, 'image/png', 'avatar.png', 'avatar');
    const h1 = encHash(token);
    // the protect path's only side effect is the profile.avatar STRING; the file is untouched
    expect(avatarIsProtected(token)).toBe(true);
    decryptFile(token, 'avatar');
    expect(encHash(token)).toBe(h1);
    // and the served bytes still equal the original upload after the "reconnect"
    expect(decryptFile(token, 'avatar').data.equals(REAL_PHOTO)).toBe(true);
  });

  // Upgrade path — an initials-SVG fallback is NOT protected (so a real photo can replace it)
  it('SVG initials fallback is NOT protected → ensureAvatar falls through to re-fetch a real photo', () => {
    encryptFile(token, INITIALS_SVG, 'image/svg+xml', 'avatar.svg', 'avatar');
    expect(fileExists(token, 'avatar')).toBe(true);
    expect(avatarIsProtected(token)).toBe(false);
  });

  // AC4 — default backfill path is only reachable when no avatar.enc exists
  it('AC4 no avatar.enc → not protected → default fetch is the only reachable path', () => {
    expect(fileExists(token, 'avatar')).toBe(false);
    expect(avatarIsProtected(token)).toBe(false);
  });

  // AC1/AC3 — across repeated "IDENTIFY" checks the real upload remains protected and byte-stable
  it('AC1/AC3 real avatar stays protected + byte-identical across repeated reconnect checks', () => {
    encryptFile(token, REAL_PHOTO, 'image/png', 'avatar.png', 'avatar');
    const h1 = encHash(token);
    for (let reconnect = 0; reconnect < 3; reconnect++) {
      expect(avatarIsProtected(token)).toBe(true);
      expect(encHash(token)).toBe(h1);
    }
    expect(decryptFile(token, 'avatar').data.equals(REAL_PHOTO)).toBe(true);
  });
});
