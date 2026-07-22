import crypto from 'node:crypto';
import type http from 'node:http';

// R31.2 Server-Manager OWNER-GATE — the SINGLE shared guard (architect Method ServerManagerGuard.assertOwner
// 8bb1842f, Class ServerManagerGuard 1d6933c7, off UC serverManager.ownerGuard 40802701 / owner-gate 5bc9683e).
// The OWNER_TOKEN literal lives HERE and ONLY here (INV-G2 — grep-guardable, exactly one location). Used by every
// /api/server-manager/* route (via the server.ts choke-point) AND the terminal ws upgrade — one owner constant,
// one guard, fail-closed. INV-G1 (non-owner refused everywhere) / INV-G2 (single literal) / INV-G3 (rejected ws
// upgrade never opens). Correct-by-construction: callers cannot reach a resource without passing THIS method.
export class ServerManagerGuard {
  // INV-G2: the OWNER_TOKEN literal appears in EXACTLY ONE module location — here.
  private static readonly OWNER_TOKEN = '41ad88c4-4dee-49ac-afcb-8a2026657b2d';

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
}
