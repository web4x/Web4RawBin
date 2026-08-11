/**
 * R40.22 storage re-key — SECURITY DEMONSTRATIONS (architect+PO: verifiable, not asserted). Quiesce gates.
 *   (1) a storageId can NEVER authenticate to a home — READ is MAP-ONLY, returns NULL (not '') for no-home.
 *   (2) rotation is a pure KEY-SWAP (storageId VALUE invariant → home unmoved → 0 path bytes). [unit; the
 *       at-scale live post-rekey byte-diff==0 is a separate window gate.]
 *   (4) no-home can NEVER resolve to a directory — homePathFor THROWS on null/empty/traversal, so the
 *       falsy-but-path-joinable '' hole (path.join(root,'')=users ROOT=every home) is IMPOSSIBLE by
 *       construction, not guarded per-site. (Gate 3 = grep-proof 0-bypass, in the migration/CI increment.)
 */
import { describe, it, expect } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import { resolveHomeKey, rotateToken, homePathFor, type StorageMap } from '../../src/ts/server/storage-id.js';

const OWNER_TOKEN = 'owner-token-A';
const SID = 'storage-id-X';
const USERS = '/data/users';

describe('R40.22 GATE 1: READ map-only — a storageId cannot authenticate to a home', () => {
  const sm: StorageMap = { path: path.join(os.tmpdir(), `sec-${process.pid}.json`), map: { [OWNER_TOKEN]: SID } };
  it('legit token → its OWN storageId home', () => { expect(resolveHomeKey(OWNER_TOKEN, { mint: false }, true, sm)).toBe(SID); });
  it('★ attacker storageId-as-playerToken → NULL = no home', () => { expect(resolveHomeKey(SID, { mint: false }, true, sm)).toBeNull(); });
  it('unknown/new token → NULL (no rooms yet)', () => { expect(resolveHomeKey('never-seen', { mint: false }, true, sm)).toBeNull(); });
  it('INERT → token unchanged', () => { expect(resolveHomeKey('anything', { mint: false }, false, sm)).toBe('anything'); });
});

describe('R40.22 GATE 2: rotation is a pure key-swap (storageId invariant → 0 path bytes)', () => {
  it('rotate swaps KEY, keeps storageId VALUE → home unmoved', () => {
    const sm: StorageMap = { path: path.join(os.tmpdir(), `rot-${process.pid}.json`), map: { 'old-tok': SID } };
    expect(rotateToken('old-tok', 'new-tok', sm)).toBe(SID);
    expect(sm.map['new-tok']).toBe(SID);
    expect(sm.map['old-tok']).toBeUndefined();
  });
});

describe('R40.22 GATE 4: no-home cannot resolve to a directory (structural, not guarded)', () => {
  it('★ homePathFor(null) THROWS — never a silent users-root read', () => { expect(() => homePathFor(USERS, null, 'rooms')).toThrow(); });
  it('★ homePathFor("") THROWS — the exact falsy-joinable hole made impossible', () => { expect(() => homePathFor(USERS, '', 'rooms')).toThrow(); });
  it('homePathFor(traversal) THROWS', () => { expect(() => homePathFor(USERS, '../etc', 'x')).toThrow(); });
  it('valid key builds the correct path', () => { expect(homePathFor(USERS, 'sid-X', 'rooms')).toBe(path.join(USERS, 'sid-X', 'rooms')); });
});
