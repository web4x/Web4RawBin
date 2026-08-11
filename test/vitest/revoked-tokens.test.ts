/**
 * R40.22 step-3 — stub-must-fail for the 116-token auth-invalidation. Exercises the REAL module
 * (src/ts/server/revoked-tokens.ts) — not a replica — so a regression in the actual code trips these.
 *
 * BOTH DIRECTIONS asserted (design-pii-containment-by-construction.md §step-3):
 *   - a revoked token → isRevoked TRUE  (IDENTIFY would `break` before authenticated=true)
 *   - a NON-revoked / enrolled / owner token → isRevoked FALSE (never over-reject — proves fail-open)
 * Plus: derivation correctness (enrolled excluded, owner excluded, |revoked| by construction) and
 * loadRevokedTokens fail-open on a missing/malformed file.
 */
import { describe, it, expect } from 'vitest';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { computeRevocationScope, loadRevokedTokens, isRevoked, type UnitSource } from '../../src/ts/server/revoked-tokens.js';

// Tiny in-memory scenario store: enrolled tokens carry a devicePublicKey; unenrolled do not.
function mkIdx(units: Array<{ ior: string; model: any }>): UnitSource {
  const m = new Map<string, { ior: string; model: any }>();
  units.forEach((u, i) => m.set(String(i), u));
  return { list: () => m.keys(), get: (k: string) => m.get(k) };
}
const dev = (ownerToken: string, key?: string) => ({ ior: 'ior:class:Device', model: { ownerToken, devicePublicKey: key || '' } });
const OWNER = '41ad88c4-4dee-49ac-afcb-8a2026657b2d';
const isOwner = (t: string) => t === OWNER;

describe('R40.22 step-3: revoked-token derivation', () => {
  it('revokes unenrolled-only tokens; excludes enrolled, owner', () => {
    const idx = mkIdx([
      dev('unenrolled-A'),                    // → revoked
      dev('unenrolled-B'),                    // → revoked
      dev('enrolled-C', 'PUBKEY_C'),          // enrolled → NOT revoked
      dev('mixed-D'), dev('mixed-D', 'PK_D'), // one keyed device ⇒ enrolled ⇒ NOT revoked
      dev(OWNER),                             // Tron, unenrolled here → excluded by isOwner
    ]);
    const scope = computeRevocationScope(idx, isOwner);
    expect(scope.revoked).toEqual(['unenrolled-A', 'unenrolled-B']); // sorted, deterministic
    expect(scope.enrolled.has('enrolled-C')).toBe(true);
    expect(scope.enrolled.has('mixed-D')).toBe(true);
    expect(scope.revoked).not.toContain('mixed-D');   // a token enrolled on ANY device is never revoked
    expect(scope.revoked).not.toContain(OWNER);        // owner never revoked
  });

  it('a File-owner token that is unenrolled surfaces so the gate can catch it (not silently revoked away)', () => {
    // If a File-owner were unenrolled it WOULD land in revoked — that is intentional so the gate's
    // `revoked ∩ File-owners == 0` invariant fails LOUD instead of silently over/under-revoking.
    const idx = mkIdx([
      { ior: 'ior:class:File', model: { uploaderToken: 'file-owner-X'.padEnd(36, '0') } },
      dev('file-owner-X'.padEnd(36, '0')),
    ]);
    const scope = computeRevocationScope(idx, isOwner);
    expect(scope.fileOwners.has('file-owner-X'.padEnd(36, '0'))).toBe(true);
    expect(scope.revoked).toContain('file-owner-X'.padEnd(36, '0')); // gate would then RED on the intersection
  });
});

describe('R40.22 step-3: isRevoked — both directions (stub-must-fail)', () => {
  const revoked = new Set(['dead-token-1', 'dead-token-2']);
  it('REJECTS a revoked token', () => {
    expect(isRevoked('dead-token-1', revoked)).toBe(true);
  });
  it('ACCEPTS (fail-open) any unlisted token — never over-reject', () => {
    expect(isRevoked('a-valid-live-token', revoked)).toBe(false);
    expect(isRevoked(OWNER, revoked)).toBe(false);
    expect(isRevoked('', revoked)).toBe(false);
  });
});

describe('R40.22 step-3: loadRevokedTokens — fail-open', () => {
  const tmp = path.join(os.tmpdir(), `revoked-test-${process.pid}`);
  it('missing file → empty set (nobody revoked)', () => {
    expect(loadRevokedTokens(path.join(tmp, 'nope.json')).size).toBe(0);
  });
  it('loads a bare array', () => {
    fs.mkdirSync(tmp, { recursive: true });
    const f = path.join(tmp, 'arr.json');
    fs.writeFileSync(f, JSON.stringify(['t1', 't2', ' t3 ']));
    const s = loadRevokedTokens(f);
    expect(s.has('t1')).toBe(true); expect(s.has('t3')).toBe(true); expect(s.size).toBe(3);
  });
  it('loads { revoked: [...] }', () => {
    const f = path.join(tmp, 'obj.json');
    fs.writeFileSync(f, JSON.stringify({ count: 2, revoked: ['x', 'y'] }));
    expect(loadRevokedTokens(f).size).toBe(2);
  });
  it('malformed JSON → empty set (fail-open, no throw)', () => {
    const f = path.join(tmp, 'bad.json');
    fs.writeFileSync(f, '{not json');
    expect(loadRevokedTokens(f).size).toBe(0);
  });
});
