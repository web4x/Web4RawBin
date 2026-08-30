// R37.27 fact-1 (iOS-Safari BFCache/freeze) — the ONE shared transport-lifecycle helper (architect design 0b9aa6dc7),
// used by BOTH the /trace live-bridge AND the /app RawBinClient so the foreground re-sync CANNOT drift between two copies.
// [impl:uuid:PENDING] — marker attaches on req mint of R37.27 (no fabricated uuid; single-minter's lane).
//
// MEASURED (robbin-tester r4064b, DET-3x @390): Tron's "current-sprint pin updates only after reload" is iOS-Safari-
// SPECIFIC — the GENERAL render-gap is ELIMINATED (passive client flipped from the broadcast ALONE on desktop-WebKit).
// iOS Safari SUSPENDS a backgrounded tab's WebSocket (freeze/BFCache): no 'close' fires, timers are frozen → the socket
// never auto-reconnects, and any unit-changed broadcast received-by-the-server during background is LOST to this client
// (there is no replay). So the view stays stale until a manual reload re-opens the socket AND re-fetches state.
//
// This helper, on FOREGROUND (visibilitychange→visible OR a bfcache pageshow with event.persisted):
//   (1) verify-or-reconnect — if the socket is not OPEN, reopen NOW (do not wait the frozen backoff timer; idempotent),
//   (2) ★ RE-SYNC = REFETCH current authoritative state — the LOAD-BEARING half (= what a manual reload does): a real
//       network read of the truth, NEVER trusting the in-memory DOM (a missed broadcast is gone),
//   (3) FAIL-LOUD on resync failure (the caller emits a visible down/reconnecting state) — never a silent half-resync.
// NO UA-sniff: the mitigation is general-correct — a redundant foreground refetch on a healthy desktop socket is harmless.
export interface TransportLifecycle {
  isOpen(): boolean;                   // the socket's readyState === OPEN
  reconnect(): void | Promise<void>;   // reopen NOW, idempotent (never dup an already OPEN/CONNECTING socket)
  resync(): Promise<void>;             // REFETCH current authoritative state; THROW on failure → routed to onResyncError
  onResyncError(cause: string): void;  // FAIL-LOUD (emit a visible down/reconnecting state — never silent)
}

function errMsg(e: unknown): string { return String((e as { message?: string })?.message || e); }

/**
 * Wire foreground re-sync for ONE transport. Returns a teardown that removes the listeners (for tests / client destroy).
 * The fire path is: verify-or-reconnect (fail-loud on throw) → resync/refetch (fail-loud on reject). Both guarded so a
 * throw in either half becomes an OBSERVABLE state, never an unhandled rejection or a silent no-op.
 */
export function wireTransportResync(t: TransportLifecycle): () => void {
  const fire = (): void => {
    try { if (!t.isOpen()) void t.reconnect(); } catch (e) { t.onResyncError(`reconnect: ${errMsg(e)}`); }
    void t.resync().catch((e) => t.onResyncError(`resync: ${errMsg(e)}`));
  };
  const onVis = (): void => { if (document.visibilityState === 'visible') fire(); };
  const onShow = (e: Event): void => { if ((e as PageTransitionEvent).persisted) fire(); }; // bfcache restore only (a normal load already fetched)
  document.addEventListener('visibilitychange', onVis);
  window.addEventListener('pageshow', onShow);
  return () => { document.removeEventListener('visibilitychange', onVis); window.removeEventListener('pageshow', onShow); };
}
