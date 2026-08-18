// R40.31 LANDING-2 — /model proven CONNECTED under the OWNER SESSION (closes gate-1's PARTIAL-PENDING-AUTH; /model is TRON'S
// OWN TAB → required, not optional). Reuses the isolated foundation: sets the sm_session owner cookie in a real-WebKit @390
// context, loads each live surface on the SCRATCH server, and POSITIVELY waits for the CONNECTED signal (a real open ws), not
// "page loaded". Per-surface: /model,/trace,/scenario set window.__liveTransport.state='connected' (live-bridge.ts ws 'open');
// /app SHORT-CIRCUITS (owns window.__rawbinClient) → assert its OWN signal, NEVER __liveTransport (the /app false-RED trap).
// STUB-MUST-FAIL: a NO-COOKIE context → /model must 403 (proves the owner-gate is real AND the cookie is what admits us — a
// green that survives credential removal is meaningless). RAW per-surface JSON for the architect to interpret. node22 + webkit.
import { webkit } from '@playwright/test';
import { setupFoundation } from './r4031-foundation.mjs';

const AUTHED = [
  { path: '/model', probe: 'liveTransport' },    // Tron's own tab — the required close
  { path: '/trace', probe: 'liveTransport' },
  { path: '/scenario', probe: 'liveTransport' },
  { path: '/app', probe: 'rawbinClient' },        // NEVER __liveTransport here
];

const readProbe = (page) => page.evaluate(() => {
  const w = window;
  let rcConnected = null;
  try { const c = w.__rawbinClient; if (c) rcConnected = !!(c.connected ?? c.isConnected ?? (c.ws && c.ws.readyState === 1)); } catch { rcConnected = null; }
  return {
    lt: w.__liveTransport ? { state: w.__liveTransport.state, cause: w.__liveTransport.cause ?? null } : null,
    rc: !!w.__rawbinClient, rcConnected,
    htmlAttr: document.documentElement.getAttribute('data-live-transport'),
  };
});
// POSITIVE connected wait (a real open ws set the signal), per-surface — /app via __rawbinClient, others via __liveTransport
const waitConnected = (page, probe) => page.waitForFunction((pr) => {
  const w = window;
  if (pr === 'rawbinClient') { const c = w.__rawbinClient; return !!c && !!(c.connected ?? c.isConnected ?? (c.ws && c.ws.readyState === 1)); }
  return !!w.__liveTransport && w.__liveTransport.state === 'connected';
}, probe, { timeout: 12000 }).then(() => true).catch(() => false);

const f = await setupFoundation();
const oh = f.ownerHeaders();
const smSession = (/sm_session=([^;]+)/.exec(oh.Cookie || '') || [])[1] || '';
const cookie = { name: 'sm_session', value: smSession, domain: 'localhost', path: '/', httpOnly: true, secure: true };

const browser = await webkit.launch({ headless: true });
const raw = { base: f.base, sessionMinted: f.sessionMinted, ownerIsServerManager: f.ownerIsServerManager, surfaces: {}, stub: {} };
try {
  for (const s of AUTHED) {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 390, height: 844 } });
    await ctx.addCookies([cookie]);
    const page = await ctx.newPage();
    const resp = await page.goto(`${f.base}${s.path}`, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => null);
    const status = resp ? resp.status() : 0;
    const connected = status && status < 400 ? await waitConnected(page, s.probe) : false;
    const probe = status && status < 400 ? await readProbe(page) : null;
    raw.surfaces[s.path] = { status, authGated: status === 401 || status === 403, connected, probe };
    await ctx.close();
  }
  // STUB-MUST-FAIL: no cookie → /model owner-gate must reject (403)
  const nctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 390, height: 844 } });
  const npage = await nctx.newPage();
  const nresp = await npage.goto(`${f.base}/model`, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => null);
  raw.stub.noCookieModelStatus = nresp ? nresp.status() : 0;
  await nctx.close();
} finally {
  await browser.close();
  raw.teardown = await f.teardown();
}

// VERDICT — /model is the required close; /app via its own signal; stub proves the cookie is load-bearing
const m = raw.surfaces['/model'];
const modelConnected = m && !m.authGated && m.connected === true;                 // Tron's tab: authed (not 403) AND real connected
const appOk = raw.surfaces['/app'] && raw.surfaces['/app'].connected === true;     // via __rawbinClient, never __liveTransport
const othersOk = ['/trace', '/scenario'].every((p) => raw.surfaces[p] && raw.surfaces[p].connected === true);
const stubOk = raw.stub.noCookieModelStatus === 403;                                // no-cookie → 403 (cookie is load-bearing)
const prodSafe = raw.teardown.prodUp === true && raw.teardown.leftover === 0;

console.log('=== R40.31 landing-2 RAW per-surface (architect interprets) ===');
console.log(JSON.stringify(raw, null, 2));
console.log('\n=== VERDICT ===');
console.log(`  /model CONNECTED under owner session: ${modelConnected}  (status=${m?.status} connected=${m?.connected})`);
console.log(`  /app own-signal (__rawbinClient, not __liveTransport): ${appOk}`);
console.log(`  /trace + /scenario connected: ${othersOk}`);
console.log(`  STUB-MUST-FAIL no-cookie /model → 403: ${stubOk}  (got ${raw.stub.noCookieModelStatus})`);
console.log(`  teardown prod:4444 untouched + 0 leftover: ${prodSafe}`);
const green = modelConnected && appOk && othersOk && stubOk && prodSafe;
console.log(`\n${green ? '✓ GREEN' : '✗ RED'} — landing-2 /model-connected-under-session`);
process.exit(green ? 0 : 1);
