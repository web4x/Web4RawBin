// R40.45 SHARED PAGE-BOOTSTRAP (PO spec e2c3f4387, architect 4d0bd01f2) — every live page routes through this so a
// live surface gets its transport→bus bridge (ws + the ONE unit-changed→ViewBus notify) BY DEFAULT, not by remembering
// to opt in. ROOT it fixes: app.ts/trace-page/model/scenario-view were separate DRY-by-copy entries and only /app opened
// a ws → /trace + /model were socket-less → never received a broadcast → "live-MVC never worked ~10 iterations" on
// exactly the surfaces Tron uses. DECLARED-NOT-DEFAULTED: a page that legitimately needs NO live transport passes
// { transport: false } — an explicit declaration, never a silent default. A NEW live page that forgets to bootstrap is
// caught by check-live-transport (the grep-lint BACKSTOP), so socket-less can't ship again.
import { connectLiveBridge } from './live-bridge.js';

export interface PageBootstrapOpts {
  transport?: boolean; // default true = open the ws→ONE-bus bridge; false = DECLARED opt-out (a page with no live units)
}

// bootstrapPage — the ONE entry every page-entry calls. Idempotent (connectLiveBridge self-guards + /app's full RawBinClient
// short-circuits it). Additional shared shell init can extend here later without touching each page.
export function bootstrapPage(opts: PageBootstrapOpts = {}): void {
  if (opts.transport === false) return; // declared opt-out
  // FAIL-SAFE (guard 2): a ws failure degrades ONLY live-update on THIS page — never throws out of the shared bootstrap (a
  // throwing shared bootstrap = ALL surfaces dead at once). FAIL-LOUD (guard 451f3cfcc): the catch must NOT be silent — a
  // swallowed failure = a normal-looking page that live-updates nothing = the same bug quieter. So: (a) a boot ERROR naming
  // the page + cause; (b) an OBSERVABLE not-live state (window.__liveTransport + <html data-live-transport>) a human AND the
  // gate can read. (connectLiveBridge sets 'connected' on a real open ws — what the transport-connection gate asserts.)
  try {
    connectLiveBridge();
  } catch (e) {
    const page = (typeof location !== 'undefined' ? location.pathname : '?');
    const cause = String((e as Error)?.message || e);
    console.error(`[page-bootstrap] ★ LIVE TRANSPORT FAILED on ${page} — page boots WITHOUT live-update. cause: ${cause}`);
    try {
      (window as unknown as { __liveTransport?: unknown }).__liveTransport = { state: 'down', cause: `boot-failed:${cause}`, at: Date.now() };
      document.documentElement.setAttribute('data-live-transport', 'down:boot-failed');
    } catch { /* pre-DOM */ }
  }
}
