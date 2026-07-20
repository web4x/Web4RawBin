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

  // Resolve the caller token the SAME way existing endpoints do: x-player-token header, else ?token/?playerToken query.
  static playerTokenFrom(req: http.IncomingMessage): string {
    const h = (req.headers['x-player-token'] as string) || '';
    if (h) return h;
    const q = new URLSearchParams((req.url || '').split('?')[1] || '');
    return q.get('token') || q.get('playerToken') || '';
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
}
