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

// Load the FROZEN revoked list. FAIL-OPEN: a missing / unreadable / malformed / empty file yields an
// empty set ⇒ NOBODY is revoked (we never over-reject a valid token). Accepts a bare array or
// { revoked: [...] }. This fail-open on absence is deliberate: under-protection is recoverable
// (re-run the generator), over-rejection would be a mass lockout.
export function loadRevokedTokens(pathStr: string): Set<string> {
  const set = new Set<string>();
  try {
    if (!fsSync.existsSync(pathStr)) return set;
    const data = JSON.parse(fsSync.readFileSync(pathStr, 'utf-8'));
    const list: unknown[] = Array.isArray(data)
      ? data
      : (data && Array.isArray(data.revoked) ? data.revoked : []);
    for (const t of list) if (typeof t === 'string' && t.trim()) set.add(t.trim());
  } catch { /* fail-open */ }
  return set;
}

// The auth decision at IDENTIFY. Fail-open for every unlisted token by construction (a Set miss = false).
export function isRevoked(token: string, revoked: Set<string>): boolean {
  return revoked.has(token);
}

// The measured, ruling-backed target count. Any drift trips the generator AND the CI gate LOUD.
export const EXPECTED_REVOKED_COUNT = 116;
