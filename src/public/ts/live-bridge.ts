// R40.45 THE ONE transport→bus bridge (T37.25 live-all-surfaces). ROOT of "live-MVC never worked ~10 iterations":
// only /app (app.ts) opened a WebSocket; /trace, /model, /scenario opened NONE → those surfaces were never in the
// server's wsClients → they never received a unit-changed broadcast → could never live-update from a remote change.
// This module is the single bridge: a unit-changed frame → ViewBus.notify(`type:uuid`) on the ONE bus, so every
// subscribed surface (row/icon/badge/detail/action-bar) re-renders. RawBinClient reuses notifyUnitChanged (one code
// path); the socket-less pages call connectLiveBridge() to open a receive-only socket (bare connect = in wsClients,
// no IDENTIFY needed to RECEIVE broadcasts).
import { ViewBus, viewBusKey } from './trace/ViewBus.js';
import { isSyntheticRef } from './trace/synthetic-ref.js'; // R37.21 Part 2 piece-2: synthetic-ref uuids key on the REF STRING
import { wireTransportResync } from './transport-lifecycle.js'; // R37.27 fact-1: shared iOS-suspend foreground re-sync (both transports)

// The ONE unit-changed → bus mapping (was inline at RawBinClient:100; extracted so /trace+/model+/scenario share it).
export function notifyUnitChanged(msg: { type?: string; ior?: string; uuid?: string }): void {
  if (!msg || msg.type !== 'unit-changed') return;
  const t = String(msg.ior || '').split(':')[2]?.toLowerCase() || '';
  if (!msg.uuid) { ViewBus.notify('graph'); return; } // structural create/delete (bare channel)
  // R37.21 Part 2 piece-2 (architect canonical key): a SYNTHETIC-ref uuid (dir:/rawbin:/roomcoll:/project:/…) keys on the
  // REF STRING — viewBusKey('dir:src/foo')='dir:src/foo' — so subscribe==notify BY CONSTRUCTION (the tree node's uuid IS
  // the full ref, the server emits shownRef as the uuid; NO type-mapping, folder-vs-collection can't diverge). A REAL uuid
  // (no colon) keeps the {type,uuid} form — pin/CR unaffected. R37.12 one-builder-both-sides, the ONE input = the ref string.
  const key = isSyntheticRef(String(msg.uuid)) ? viewBusKey(String(msg.uuid)) : (t ? viewBusKey({ type: t, uuid: msg.uuid }) : 'graph');
  ViewBus.notify(key);
}

// R40.45 OBSERVABLE transport state (fail-LOUD, architect guard 451f3cfcc): a human (devtools) AND a gate/test can read
// whether THIS page's live transport is actually CONNECTED — never a normal-looking-dead page. window.__liveTransport +
// a data-live-transport attr on <html> carry {state, cause}. The transport-connection gate asserts state==='connected'
// (a real open ws), NOT merely 'bootstrap ran without throwing'.
type LiveState = { state: 'connecting' | 'connected' | 'down'; cause?: string; at: number };
function setLiveState(s: LiveState): void {
  try {
    (window as unknown as { __liveTransport?: LiveState }).__liveTransport = s;
    document.documentElement.setAttribute('data-live-transport', s.cause ? `${s.state}:${s.cause}` : s.state);
  } catch { /* pre-DOM / non-browser */ }
}

// Open a RECEIVE-ONLY ws on a page that has no full RawBinClient (/trace, /model, /scenario) so it joins wsClients and
// its surfaces live-update off the broadcast. Idempotent + guarded: /app already has the full client → skip.
let _wired = false;
let _ws: WebSocket | null = null;
export function connectLiveBridge(): void {
  if (_wired || (window as unknown as { __rawbinClient?: unknown }).__rawbinClient) return; // /app owns the full client
  _wired = true;
  const open = (): void => {
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    setLiveState({ state: 'connecting', at: Date.now() });
    const ws = new WebSocket(`${proto}//${location.host}/`);
    _ws = ws;
    ws.addEventListener('open', () => setLiveState({ state: 'connected', at: Date.now() })); // OBSERVABLE: a real open ws (what the gate asserts)
    ws.addEventListener('message', (ev) => { try { notifyUnitChanged(JSON.parse(ev.data)); } catch { /* non-JSON frame */ } });
    ws.addEventListener('error', () => setLiveState({ state: 'down', cause: 'ws-error', at: Date.now() })); // fail-LOUD: visible not-live state
    ws.addEventListener('close', () => { setLiveState({ state: 'down', cause: 'ws-closed', at: Date.now() }); setTimeout(open, 3000); }); // auto-reconnect
  };
  open();

  // R37.27 fact-1 (iOS-Safari BFCache/freeze) — wire the SHARED foreground re-sync (transport-lifecycle.ts; RawBinClient
  // uses the SAME helper — one code path, no drift). Tron's /trace pin is the LOAD-BEARING case: resync REFETCHES the
  // authoritative CurrentSprint state over HTTP (state-independent → catches a frozen-but-OPEN socket too), then drives
  // the pin subscribers (rb-trace-tree.renderCurrentSprintEagerLazy + rb-detail-drawer.refreshCurrentSlot re-FETCH on the
  // key) to re-derive — never trusting the possibly-stale in-memory DOM.
  const CS_PIN = 'current-sprint-singleton-0000-000000000001';
  wireTransportResync({
    isOpen: () => !!_ws && _ws.readyState === WebSocket.OPEN,
    reconnect: () => { if (!_ws || _ws.readyState >= WebSocket.CLOSING) open(); },   // reopen only when definitively dead (2/3) → no dup sockets
    resync: async () => {
      const r = await fetch(`/api/ior/ior:instance:${CS_PIN}`);                       // REFETCH authoritative pin state — a real read that FAILS LOUD if offline
      if (!r.ok) throw new Error(`CurrentSprint refetch HTTP ${r.status}`);
      ViewBus.notify(viewBusKey({ type: 'CurrentSprint', uuid: CS_PIN }));            // subscribers re-derive from fresh server state (Tron's exact complaint)
      ViewBus.notify('graph');                                                        // structural surfaces (rows/badges) missed while backgrounded re-sync too
    },
    onResyncError: (cause) => setLiveState({ state: 'down', cause: `resync:${cause}`, at: Date.now() }), // FAIL-LOUD: visible not-live state, never a silent half-resync
  });
}
