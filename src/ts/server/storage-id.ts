// R40.22 storage re-key — REGROWTH-KILL runtime (design 03287719c; architect design-check requirements).
//
// After the migration re-keys existing homes token→storageId, NEW uploads/homes must ALSO key by the
// opaque never-auth `storageId`, else the leak re-grows (new tracked unitLinks embed the raw token). This
// module supplies the runtime mapping. It is INERT until REKEY_APPLIED flips (with the migration, atomically
// in the one window) — pre-flip the call sites keep using the raw token (current behavior, zero change).
//
// ★ tokenToStorageId MAP = CRITICAL INFRA (req 2): keys are raw tokens = CREDENTIALS → the file is
//   GITIGNORED, never tracked. Loaded once at boot, persisted synchronously on every mint. A LOST map
//   orphans every storageId-keyed home (no token→home resolution) ⇒ it MUST be in the durability backup
//   (the re-key window backs up data/users + content + THIS map together).
// ★ the map IS the ROTATION SURFACE (req 3): rotating a token later is a KEY-SWAP — map[newToken] =
//   map[oldToken]; delete map[oldToken] — the storageId value is invariant ⇒ "rotation touches only auth,
//   0 path/file bytes." (rotateToken below models it; not called until the rotation ladder step.)

import fsSync from 'node:fs';
import crypto from 'node:crypto';

// Flip to true ATOMICALLY WITH the migration (the one window's step 5). While false → INERT: call sites use
// the raw token (current behavior). While true → new homes/uploads key by storageId + the fail-loud map
// guard is active. Committed const so it is deploy-durable + reviewable, same shape as REVOKED_ARMED.
export const REKEY_APPLIED = false;

export interface StorageMap { path: string; map: Record<string, string>; }

export function loadStorageMap(pathStr: string): Record<string, string> {
  try { if (fsSync.existsSync(pathStr)) { const d = JSON.parse(fsSync.readFileSync(pathStr, 'utf-8')); if (d && typeof d === 'object' && !Array.isArray(d)) return d; } } catch { /* fall through */ }
  return {};
}

// getOrMintStorageId — REUSE if present (stable: one storageId per token, forever), else MINT a fresh
// opaque uuid (never-auth, never == a token, never reused). CONCURRENCY-SAFE (req 1): the check-then-mint
// is fully SYNCHRONOUS — no await between reading sm.map[token] and writing it — so under Node's
// single-threaded execution two racing uploads for the SAME new token cannot interleave to mint two
// storageIds (the second call sees the first's entry). Persist is a synchronous writeFileSync (mints are
// rare — only a token never seen before).
export function getOrMintStorageId(token: string, sm: StorageMap): string {
  const existing = sm.map[token];
  if (existing) return existing;                                   // REUSE — stable + injective
  const sid = crypto.randomUUID();                                 // MINT — opaque, never-auth
  sm.map[token] = sid;
  fsSync.writeFileSync(sm.path, JSON.stringify(sm.map, null, 2));  // persist synchronously (atomic w.r.t. JS turn)
  return sid;
}

// ROTATION (req 3) — a KEY-SWAP, not a re-mint: the home (keyed by storageId) is untouched, only the auth
// token changes. 0 path/file bytes move. Not invoked until the rotation ladder step; modeled here so the
// map is designed for it. Returns the (unchanged) storageId, or null if the old token is unknown.
export function rotateToken(oldToken: string, newToken: string, sm: StorageMap): string | null {
  const sid = sm.map[oldToken];
  if (!sid) return null;
  sm.map[newToken] = sid;          // same storageId — home unmoved
  delete sm.map[oldToken];
  fsSync.writeFileSync(sm.path, JSON.stringify(sm.map, null, 2));
  return sid;
}

// FAIL-LOUD (req 4): once REKEY_APPLIED, storageId-keyed homes exist on disk; if the map is empty/absent
// then token→home resolution is broken → refuse-healthy (like the revoked-list loud-absence). Do NOT
// silently mint-fresh — that would orphan the existing home. Returns an error string when unhealthy.
export function storageMapHealth(mapSize: number, applied: boolean = REKEY_APPLIED): string | null {
  if (applied && mapSize === 0) {
    return `tokenToStorageId map is EMPTY/absent while REKEY_APPLIED — token→home resolution is broken; refusing healthy (a lost map orphans every storageId-keyed home). Restore the map from the durability backup.`;
  }
  return null;
}
