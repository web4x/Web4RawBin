// R40.45 THE ONE transport→bus bridge (T37.25 live-all-surfaces). ROOT of "live-MVC never worked ~10 iterations":
// only /app (app.ts) opened a WebSocket; /trace, /model, /scenario opened NONE → those surfaces were never in the
// server's wsClients → they never received a unit-changed broadcast → could never live-update from a remote change.
// This module is the single bridge: a unit-changed frame → ViewBus.notify(`type:uuid`) on the ONE bus, so every
// subscribed surface (row/icon/badge/detail/action-bar) re-renders. RawBinClient reuses notifyUnitChanged (one code
// path); the socket-less pages call connectLiveBridge() to open a receive-only socket (bare connect = in wsClients,
// no IDENTIFY needed to RECEIVE broadcasts).
import { ViewBus, viewBusKey } from './trace/ViewBus.js';

// The ONE unit-changed → bus mapping (was inline at RawBinClient:100; extracted so /trace+/model+/scenario share it).
export function notifyUnitChanged(msg: { type?: string; ior?: string; uuid?: string }): void {
  if (!msg || msg.type !== 'unit-changed') return;
  const t = String(msg.ior || '').split(':')[2]?.toLowerCase() || '';
  if (t && msg.uuid) ViewBus.notify(viewBusKey({ type: t, uuid: msg.uuid })); else ViewBus.notify('graph'); // R40.45: notify key via the ONE viewBusKey builder (subscribe sites use the SAME) — no drift; 'graph' = structural create/delete (bare channel)
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
export function connectLiveBridge(): void {
  if (_wired || (window as unknown as { __rawbinClient?: unknown }).__rawbinClient) return; // /app owns the full client
  _wired = true;
  const open = (): void => {
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    setLiveState({ state: 'connecting', at: Date.now() });
    const ws = new WebSocket(`${proto}//${location.host}/`);
    ws.addEventListener('open', () => setLiveState({ state: 'connected', at: Date.now() })); // OBSERVABLE: a real open ws (what the gate asserts)
    ws.addEventListener('message', (ev) => { try { notifyUnitChanged(JSON.parse(ev.data)); } catch { /* non-JSON frame */ } });
    ws.addEventListener('error', () => setLiveState({ state: 'down', cause: 'ws-error', at: Date.now() })); // fail-LOUD: visible not-live state
    ws.addEventListener('close', () => { setLiveState({ state: 'down', cause: 'ws-closed', at: Date.now() }); setTimeout(open, 3000); }); // auto-reconnect
  };
  open();
}
