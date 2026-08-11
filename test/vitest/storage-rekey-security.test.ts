/**
 * R40.22 storage re-key — SECURITY DEMONSTRATIONS (architect+PO: verifiable, not asserted).
 *   TEST 1: the load-bearing property — a storageId can NEVER authenticate to a home. READ is MAP-ONLY, so
 *           an attacker presenting a leaked storageId as their playerToken resolves to '' = NO HOME. This is
 *           what makes "a leaked storageId path segment is harmless BY CONSTRUCTION" TRUE (the `||token`
 *           fallback would have made it FALSE — a leaked storageId → the owner's home).
 *   TEST 2: rotation touches 0 path bytes — it is a pure KEY-SWAP (map[new]=map[old]; del old); the storageId
 *           VALUE is invariant → the home dir is unmoved. (The full post-rekey byte-diff==0 is the live window
 *           test; this proves the mechanism.)
 */
import { describe, it, expect } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import { resolveHomeKey, rotateToken, type StorageMap } from '../../src/ts/server/storage-id.js';

const OWNER_TOKEN = 'owner-token-A';
const SID = 'storage-id-X';

describe('R40.22 TEST 1: READ is map-only — a storageId cannot authenticate to a home', () => {
  const sm: StorageMap = { path: path.join(os.tmpdir(), `sec-${process.pid}.json`), map: { [OWNER_TOKEN]: SID } };
  it('legit token resolves to its OWN storageId home', () => {
    expect(resolveHomeKey(OWNER_TOKEN, { mint: false }, true, sm)).toBe(SID);
  });
  it('★ attacker presenting a leaked storageId as playerToken → "" = NO HOME (0 access)', () => {
    expect(resolveHomeKey(SID, { mint: false }, true, sm)).toBe(''); // storageId is a map VALUE, never a KEY
  });
  it('unknown/new token → "" = no home (no rooms yet; write mints later)', () => {
    expect(resolveHomeKey('never-seen', { mint: false }, true, sm)).toBe('');
  });
  it('INERT (REKEY_APPLIED=false) → returns the token unchanged (current behavior)', () => {
    expect(resolveHomeKey('anything', { mint: false }, false, sm)).toBe('anything');
  });
});

describe('R40.22 TEST 2: rotation is a pure key-swap (storageId invariant → 0 path bytes)', () => {
  it('rotate swaps the KEY, keeps the storageId VALUE → home unmoved', () => {
    const sm: StorageMap = { path: path.join(os.tmpdir(), `rot-${process.pid}.json`), map: { 'old-tok': SID } };
    expect(rotateToken('old-tok', 'new-tok', sm)).toBe(SID);      // same storageId
    expect(sm.map['new-tok']).toBe(SID);                          // new key → same home
    expect(sm.map['old-tok']).toBeUndefined();                    // old key gone
  });
  it('rotate of an unknown token is a no-op (null)', () => {
    const sm: StorageMap = { path: path.join(os.tmpdir(), `rot2-${process.pid}.json`), map: {} };
    expect(rotateToken('nope', 'x', sm)).toBeNull();
  });
});
