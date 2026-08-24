import crypto from 'node:crypto';
import fs from 'node:fs';
import type http from 'node:http';

// R31.2 Server-Manager OWNER-GATE — the SINGLE shared guard (architect Method ServerManagerGuard.assertOwner
// 8bb1842f, Class ServerManagerGuard 1d6933c7, off UC serverManager.ownerGuard 40802701 / owner-gate 5bc9683e).
// The OWNER_TOKEN literal lives HERE and ONLY here (INV-G2 — grep-guardable, exactly one location). Used by every
// /api/server-manager/* route (via the server.ts choke-point) AND the terminal ws upgrade — one owner constant,
// one guard, fail-closed. INV-G1 (non-owner refused everywhere) / INV-G2 (single literal) / INV-G3 (rejected ws
// upgrade never opens). Correct-by-construction: callers cannot reach a resource without passing THIS method.
export class ServerManagerGuard {
  // ROTATION (ops 2026-08-24, PO+architect backstopped): the owner token is NO LONGER a tracked literal — the old
  // value leaked into the repo, so it was rotated to an UNTRACKED secret and the leaked value is retired. Sourced
  // (INV-G2 becomes: NO owner-token literal in source) from env RAWBIN_OWNER_TOKEN → else the untracked file
  // /root/.rawbin/owner-token (mode 600) → else a per-boot RANDOM with a LOUD boot log (fail-closed: a missing secret
  // can NEVER fall back to a known/public value; the hardcoded-owner path just goes inert and owner access =
  // protected-identity only). The value is NEVER committed. NOTE: this rotation retires the leaked owner literal; it
  // does NOT change the cold-public-value gate on requireFeatureAccess (the seeded+public protected-id) — that remains
  // and is why the terminal STAYS severed (deferred fix, Tron's call).
  private static readonly OWNER_TOKEN = ServerManagerGuard.loadOwnerToken();
  private static loadOwnerToken(): string {
    const env = (process.env.RAWBIN_OWNER_TOKEN || '').trim();
    if (env) return env;
    try {
      const v = fs.readFileSync(process.env.RAWBIN_OWNER_TOKEN_FILE || '/root/.rawbin/owner-token', 'utf-8').trim();
      if (v) return v;
    } catch { /* fall through to the fail-loud random */ }
    console.error('[boot][owner-token] no RAWBIN_OWNER_TOKEN and no readable /root/.rawbin/owner-token — the hardcoded-owner path is DISABLED (per-boot random); owner access = protected-identity only. Write the untracked secret file to enable it.');
    return crypto.randomBytes(32).toString('hex');
  }

  // R31.2 AC-cookie-only: HEADER-ONLY (x-player-token). The ?token/?playerToken QUERY fallback is REMOVED — a URL
  // token leaks via logs / referrer / history. The Server-Manager credential is the sm_session COOKIE (minted by the
  // owner-gated POST /api/server-manager/session, which sends the token in THIS header); a bare ?token= no longer
  // authenticates → the page/API/ws reject it (cookie-only enforced; tester's ?token=→403 assertion passes).
  static playerTokenFrom(req: http.IncomingMessage): string {
    return (req.headers['x-player-token'] as string) || '';
  }

  // [impl:uuid:335dbf3d-2294-47cb-9beb-1d81a4bf9a94] ServerManagerGuard.assertOwner — the SINGLE shared owner guard
  // (Method 8bb1842f, off UC serverManager.ownerGuard 40802701). Caller must be a LIVE authenticated session AND
  // constant-time-equal THE owner; fail-closed. INV-G1/G2/G3 by construction — used by the /api/server-manager/*
  // HTTP choke-point AND the terminal ws upgrade (one guard, one owner constant).
  static assertOwner(req: http.IncomingMessage, isLiveSession: (token: string) => boolean): { ok: true; token: string } | { ok: false } {
    const token = ServerManagerGuard.playerTokenFrom(req);
    if (!token || !isLiveSession(token)) return { ok: false };                        // must be a LIVE authenticated session
    const a = Buffer.from(token), b = Buffer.from(ServerManagerGuard.OWNER_TOKEN);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return { ok: false };  // and THE owner (constant-time)
    return { ok: true, token };
  }

  // R31.1 owner-accept (architect-locked): constant-time owner check for a token the server has ALREADY verified as
  // a live session (it holds the identified token when building the owner's PROFILE ws message → sets serverManager).
  // Reuses the ONE OWNER_TOKEN literal (INV-G2 =1); no live-session re-check (caller already holds it). This is what
  // fixes the owner-accept RACE — no client whoami round-trip that could fire before the /profile ws identifies.
  static isOwner(token: string): boolean {
    if (!token) return false;
    const a = Buffer.from(token), b = Buffer.from(ServerManagerGuard.OWNER_TOKEN);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }

  // [impl:uuid:765ca93b-aa1f-439a-9377-5c200384a259] ServerManagerGuard.requireFeatureAccess (Method 35e91ba7, off
  // Class ServerManagerGuard 1d6933c7) — R31.8 DATA-DRIVEN feature gate generalizing assertOwner: resolve the caller's
  // REAL authenticated token (resolveToken = cookie→session-token OR live header, injected since the server owns
  // smSessions/tokenToClient), then require token ∈ Feature.allowedUsers (data, NOT a hardcoded literal). Fail-closed
  // (no token, or empty/missing allowedUsers → deny, INV-F5). ★ INV-F6: access is by MEMBERSHIP only — NEVER s.owner,
  // NEVER mere session-presence; a non-owner holding a valid own-session still denies unless in allowedUsers. The
  // hardcoded owner (assertOwner) is reserved for the FeatureManager write-gate root-of-trust, not feature access.
  static requireFeatureAccess(
    req: http.IncomingMessage,
    featureName: string,
    resolveToken: (req: http.IncomingMessage) => string,
    allowedUsersOf: (featureName: string) => string[],
  ): { ok: true; token: string } | { ok: false } {
    const token = resolveToken(req);
    if (!token) return { ok: false };
    if (!allowedUsersOf(featureName).includes(token)) return { ok: false };
    return { ok: true, token };
  }

  // [impl:uuid:a2b8373a-2165-4563-b372-8d4c369cea4b] ServerManagerGuard.seedOwnerInto (Method ba2e94ec, off Class
  // 1d6933c7, UC guard.seedOwnerInto 0f5dc242) — R31.8 bootstrap root-of-trust: idempotently ADD the hardcoded owner
  // token INTO the passed allowedUsers[] in-place and RETURN the array. The token value is NEVER returned bare
  // (least-exposure); co-located with the ONE OWNER_TOKEN literal so the grep-guard stays INV-G2==1. Called by
  // FeatureManager.bootstrapSeed per feature so the owner enters via SEEDED MEMBERSHIP (not a literal-bypass into the
  // data-driven gate). The hardcoded owner is the bootstrap root; from there Tron grants everyone else via FeatureManager.
  static seedOwnerInto(allowedUsers: string[]): string[] {
    if (!allowedUsers.includes(ServerManagerGuard.OWNER_TOKEN)) allowedUsers.push(ServerManagerGuard.OWNER_TOKEN);
    return allowedUsers;
  }
}
