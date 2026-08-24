// R40.22 step-3 — auth-invalidation of the 116 dormant dev/test raw-only Device tokens.
//
// WHY: raw playerToken is the DEFAULT auth at IDENTIFY (server.ts). ~445 tokens leaked in a public
// repo; the 116 Device ownerTokens with NO enrolled device-key are DEV/TEST/DORMANT (req+PO ruled:
// 11 IPs / one 19-day window / dormant, ~0 real users, ~0 Tron). Auth-invalidating them makes those
// leaked copies worthless at the auth path — with ZERO storage touch (the user home data/users/<token>/
// keeps existing; nobody can authenticate with the token). That is why this is doable BEFORE the
// R40.22 storage re-key: refusing a token for auth need not move any file.
//
// SINGLE SOURCE of the revoked-set derivation — imported by BOTH scripts/gen-revoked-tokens.ts (writes
// the frozen list) and scripts/check-revoked-tokens.ts (the CI safety gate) so the two can never drift.
// The running server does NOT derive live; it LOADS the frozen list (data/revoked-tokens.json) so the
// set can never silently WIDEN when a new unenrolled Device unit appears. Reversible: the list is data —
// a mistake is undone by removing an entry (token accepted again); nothing is destroyed.

import fsSync from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// R37.18 SINGLE SOURCE of the revoked-list path — the ONE committed location, resolved relative to THIS
// module so the runtime (server.ts) and the CI gate (check-revoked-tokens.ts) CANNOT diverge. That very
// divergence (server loaded data/revoked-tokens.json [absent] while the list lived here at repo-root) was
// the fail-open bug; both now import this constant, so a third path or a copy step is impossible.
export const REVOKED_LIST_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../revoked-token-hashes.json');

// R40.22 step-3 (A) — the stored list holds SALTED HASHES, never raw tokens (architect f1ab00e21 / PO
// ruling). A fixed-salt SHA-256 of a 128-bit-entropy UUID token CANNOT authenticate and is not
// brute-forceable from the hash ⇒ the list stops being a credential ⇒ safe to TRACK in git
// (deploy-durable) and it does not trip the credential guard. The salt is DOMAIN SEPARATION, not
// secrecy — so it MUST be FIXED and COMMITTED: a per-deploy-random salt would break the list across
// deploys and silently un-revoke everything (the exact failure we guard against). Publishing it costs
// nothing (a UUID is not recoverable from its hash).
export const REVOKED_SALT = 'rb-revoked-token-v1';
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(REVOKED_SALT + '\0' + token).digest('hex');
}

// Minimal structural view of the scenario store (decouples from ScenarioIndex; keeps this unit testable).
export interface UnitSource {
  list(): Iterable<string>;
  get(key: string): { ior: string; model: any } | null | undefined;
}

export interface RevocationScope {
  revoked: string[];       // tokens to auth-invalidate — sorted, deterministic
  enrolled: Set<string>;   // enrolled-N: a token with >=1 Device unit carrying a devicePublicKey
  unenrolled: Set<string>; // tokens whose Device units carry NO devicePublicKey
  fileOwners: Set<string>; // File/WebItem owner tokens — MUST NOT be revoked (invariant-checked)
}

const bare = (s: string): string => String(s || '').replace('ior:instance:', '').split('@')[0].trim();
const hasDeviceKey = (m: any): boolean => !!(m && m.devicePublicKey && String(m.devicePublicKey).trim());

// Derive from ior:class:Device units: a token is ENROLLED if ANY of its Device units carries a
// devicePublicKey; UNENROLLED-ONLY tokens (never keyed) minus enrolled minus the owner = revoked.
// Owner exclusion goes through the injected isOwner predicate so the OWNER_TOKEN literal stays in its
// single ServerManagerGuard home (INV-G2), never duplicated here.
export function computeRevocationScope(idx: UnitSource, isOwner: (t: string) => boolean): RevocationScope {
  const enrolled = new Set<string>();
  const unenrolled = new Set<string>();
  const fileOwners = new Set<string>();
  for (const key of idx.list()) {
    const u = idx.get(key);
    if (!u) continue;
    const m: any = u.model || {};
    if (u.ior === 'ior:class:Device') {
      const t = bare(m.ownerToken);
      if (t) (hasDeviceKey(m) ? enrolled : unenrolled).add(t);
    } else if (u.ior === 'ior:class:File' || u.ior === 'ior:class:WebItem') {
      const o = bare(m.uploaderToken || m.ownerToken);
      if (o && o.length === 36) fileOwners.add(o);
    }
  }
  const revoked = [...unenrolled].filter(t => !enrolled.has(t) && !isOwner(t)).sort();
  return { revoked, enrolled, unenrolled, fileOwners };
}

// Load the FROZEN revoked HASH list. FAIL-OPEN: a missing / unreadable / malformed / empty file yields an
// empty set ⇒ NOBODY is revoked (we never over-reject a valid token). Accepts a bare array or
// { revoked: [...] } of SHA-256 hex hashes. Fail-open on absence is deliberate: under-protection is
// recoverable (re-run the generator); over-rejection would be a mass lockout. (The absent/short case is
// separately made LOUD-when-armed by revokedArmedHealth — the opposite failure direction.)
export function loadRevokedTokens(pathStr: string): Set<string> {
  const set = new Set<string>();
  try {
    if (!fsSync.existsSync(pathStr)) return set;
    const data = JSON.parse(fsSync.readFileSync(pathStr, 'utf-8'));
    const list: unknown[] = Array.isArray(data)
      ? data
      : (data && Array.isArray(data.revoked) ? data.revoked : []);
    for (const h of list) if (typeof h === 'string' && h.trim()) set.add(h.trim());
  } catch { /* fail-open */ }
  return set;
}

// (b) PRESENCE-AWARE load — distinguishes an ABSENT/UNREADABLE list from a legitimately-EMPTY one. This is
// the fix for the exact bug: loaded-0-because-absent looked identical to no-revocations-exist. `present` is
// false only when the file is missing or unparseable; an empty-but-valid file is present:true, tokens:∅.
export function loadRevokedListStatus(pathStr: string): { tokens: Set<string>; present: boolean } {
  if (!fsSync.existsSync(pathStr)) return { tokens: new Set(), present: false };
  try {
    const data = JSON.parse(fsSync.readFileSync(pathStr, 'utf-8'));
    const list: unknown[] = Array.isArray(data) ? data : (data && Array.isArray(data.revoked) ? data.revoked : []);
    const tokens = new Set<string>();
    for (const h of list) if (typeof h === 'string' && h.trim()) tokens.add(h.trim());
    return { tokens, present: true };
  } catch { return { tokens: new Set(), present: false }; } // unreadable/corrupt = NOT present (loud when armed)
}

// The auth decision at IDENTIFY. Hashes the presented token and checks the HASH set. Fail-open for every
// unlisted token by construction (a Set miss = false). One SHA-256 per IDENTIFY — negligible.
export function isRevoked(token: string, revokedHashes: Set<string>): boolean {
  return revokedHashes.has(hashToken(token));
}

// The measured, ruling-backed target count. Any drift trips the generator AND the CI gate LOUD.
export const EXPECTED_REVOKED_COUNT = 116;

// R40.22 step-3 ARM flag. FALSE = INERT (the kill is not activated → an absent/empty list is EXPECTED,
// quiet fail-open). Flip to true ONLY together with a materialized list at EXPECTED_REVOKED_COUNT so
// arming and the list land atomically (the CI gate refuses ARMED-without-a-full-list). Held for the
// architect 7-point + PO GO — this const flip IS the arm act.
// ARMED 2026-08-11: architect 5/5 (bb8250f7b) + req independent joint verify + PO GO. Materialized list
// revoked-token-hashes.json = 116 salted hashes (sha256 e187d7a6…), disjoint from enrolled-79/Tron/File-owners.
export const REVOKED_ARMED = true;

// TWO OPPOSITE FAILURE DIRECTIONS IN ONE MECHANISM (failure-direction-by-consequence):
//   • fail-OPEN for an UNLISTED token — never lock out a valid client (see isRevoked);
//   • fail-LOUD when the WHOLE LIST is absent/short WHILE ARMED — otherwise the revocation silently
//     evaporates on a fresh deploy and the 116 leaked tokens authenticate again (the incident reopens).
// Returns an error string when unhealthy, else null. `armed` is a param (defaulting to the const) purely
// so both directions are unit-testable without rebuilding.
export function revokedArmedHealth(loadedCount: number, armed: boolean = REVOKED_ARMED): string | null {
  if (!armed) return null; // not armed → inert; a missing list here is intended, not a fault
  if (loadedCount !== EXPECTED_REVOKED_COUNT) {
    return `revoked-tokens ARMED but loaded ${loadedCount} (expected ${EXPECTED_REVOKED_COUNT}) — revocation is NOT enforced; refusing to report healthy.`;
  }
  return null;
}
