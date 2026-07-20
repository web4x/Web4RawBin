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

  // [impl marker PENDING] — Method 8bb1842f has implementations:[] EMPTY. An [impl:uuid:…] marker credits ONLY off an
  // ior:class:Implementation unit (cf. 640f8428/2de3411f = "…impl"), NEVER a Method uuid. Once an Impl unit is minted
  // + wired under Method 8bb1842f, place [impl:uuid:<that Impl>] on the line below. Do NOT use 8bb1842f (the Method).
  // The single shared owner guard: caller must be a LIVE authenticated session AND constant-time-equal THE owner. Fail-closed.
  static assertOwner(req: http.IncomingMessage, isLiveSession: (token: string) => boolean): { ok: true; token: string } | { ok: false } {
    const token = ServerManagerGuard.playerTokenFrom(req);
    if (!token || !isLiveSession(token)) return { ok: false };                        // must be a LIVE authenticated session
    const a = Buffer.from(token), b = Buffer.from(ServerManagerGuard.OWNER_TOKEN);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return { ok: false };  // and THE owner (constant-time)
    return { ok: true, token };
  }
}
