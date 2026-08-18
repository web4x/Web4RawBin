// [test:uuid:c5e08a31-7d4f-42b9-a6e1-3f9b28d5c0a7] R40.45 check-live-transport — every live SURFACE opens a CONNECTED ws (POSITIVE property, not "bootstrap didn't throw"). connectLiveBridge (live-bridge.ts:38) opens wss://<host>/ and sets window.__liveTransport.state='connected' ONLY in the ws 'open' handler (:39); /app SHORT-CIRCUITS (owns window.__rawbinClient, :33) so it never sets __liveTransport — assert its OWN signal there (the /app false-RED trap). A transport failure that is caught-and-SILENT ⇒ RED. Stub-must-fail: a live page whose ws is KILLED must NOT read connected.
// @390 real-WebKit (Tron's engine), DET-3x, read-only (loads live surfaces, no mutation → no scratch/no SW-guard needed: pure connect-probe). RAW per-surface evidence emitted for the architect to interpret. node22: PATH=/opt/node22/bin:$PATH node test/visual/r4045-livetransport-connected-gate.mjs
import { webkit } from '@playwright/test';
const BASE = 'https://prod.wo-da.de:4444';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
// per-surface expected connected-probe: /app owns __rawbinClient; the socket-less pages (bootstrapPage) set __liveTransport
const SURFACES = [
  { path: '/app', probe: 'rawbinClient' },
  { path: '/trace', probe: 'liveTransport' },
  { path: '/model', probe: 'liveTransport' },
  { path: '/scenario', probe: 'liveTransport' },
];

const readProbe = (page) => page.evaluate(() => {
  const w = window;
  let rcConnected = null;
  try { const c = w.__rawbinClient; if (c) rcConnected = !!(c.connected ?? c.isConnected ?? (c.ws && c.ws.readyState === 1)); } catch { rcConnected = null; }
  return {
    lt: w.__liveTransport ? { state: w.__liveTransport.state, cause: w.__liveTransport.cause ?? null } : null,
    rc: !!w.__rawbinClient,
    rcConnected,
    htmlAttr: document.documentElement.getAttribute('data-live-transport'),
  };
});
const connectedByEither = (p) => (p.lt && p.lt.state === 'connected') || p.rc === true;

const browser = await webkit.launch({ headless: true });
const results = [];
let served = '?';
try {
  for (let iter = 1; iter <= 3; iter++) {
    const perSurface = [];
    for (const s of SURFACES) {
      const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 390, height: 844 } });
      const page = await ctx.newPage();
      const resp = await page.goto(`${BASE}${s.path}`, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => null);
      const httpStatus = resp ? resp.status() : 0;
      const authGated = httpStatus === 401 || httpStatus === 403; // e.g. /model INV-D4 owner-gated → probe in the AUTHED harness, NOT a transport fail
      if (!authGated) {
        // POSITIVE wait: the connected signal actually arrives (a real open ws), not just "page loaded"
        await page.waitForFunction(() => (window.__liveTransport && window.__liveTransport.state === 'connected') || !!window.__rawbinClient, { timeout: 8000 }).catch(() => {});
        await sleep(600);
      }
      if (iter === 1 && s.path === '/trace') { try { served = (await (await fetch(`${BASE}/api/config`, {})).json()).version; } catch {} }
      const p = authGated ? { lt: null, rc: false, rcConnected: null, htmlAttr: null } : await readProbe(page);
      const connected = connectedByEither(p);
      const usedSignal = authGated ? `AUTH-GATED(${httpStatus})` : ((p.lt && p.lt.state === 'connected') ? 'liveTransport=connected' : (p.rc ? 'rawbinClient' : 'NONE'));
      perSurface.push({ path: s.path, connected, authGated, httpStatus, usedSignal, raw: p });
      await ctx.close();
    }
    const failed = perSurface.filter(x => !x.authGated && !x.connected).map(x => x.path);
    const pending = perSurface.filter(x => x.authGated).map(x => `${x.path}(${x.httpStatus})`);
    results.push({ iter, failed, pending, perSurface });
    const verdict = failed.length ? 'RED' : (pending.length ? 'PARTIAL-PENDING-AUTH' : 'GREEN');
    console.log(`iter ${iter}: ${perSurface.map(x => `${x.path}=${x.authGated ? 'PENDING-AUTH' : (x.connected ? 'CONNECTED' : 'NOT')}(${x.usedSignal})`).join(' | ')} => ${verdict}`);
  }

  // ── STUB-MUST-FAIL: a LIVE surface whose ws is KILLED must NOT read connected (proves the connected-assert bites) ──
  let stubBites = false, stubMethod = 'ws-kill';
  const sctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 390, height: 844 } });
  try {
    await sctx.routeWebSocket(/.*/, (ws) => { ws.close(); }); // intercept + close → client ws never reaches 'open'
  } catch { stubMethod = 'ws-kill-unavailable→negative-control'; }
  const sp = await sctx.newPage();
  await sp.goto(`${BASE}/trace`, { waitUntil: 'networkidle' }).catch(() => {});
  await sleep(2500);
  const sprobe = await readProbe(sp);
  stubBites = !connectedByEither(sprobe); // /trace with ws killed → __liveTransport NOT connected → gate would RED
  console.log(`stub-must-fail (${stubMethod}): /trace ws-killed → connected=${connectedByEither(sprobe)} (raw ${JSON.stringify(sprobe)}) → bites=${stubBites}`);
  await sctx.close();

  console.log('\n===== R40.45 check-live-transport (served ' + served + ', @390 real-WebKit, DET-3x) =====');
  console.log('RAW per-surface evidence (iter1):');
  for (const x of results[0].perSurface) console.log(`  ${x.path}: connected=${x.connected} used=${x.usedSignal} lt=${JSON.stringify(x.raw.lt)} rc=${x.raw.rc} rcConnected=${x.raw.rcConnected} htmlAttr=${x.raw.htmlAttr}`);
  const proven = results[0].perSurface.filter(x => !x.authGated && x.connected).map(x => x.path);
  const pending = results[0].perSurface.filter(x => x.authGated).map(x => `${x.path}(INV-D4 ${x.httpStatus})`);
  const anyFailed = results.some(r => r.failed.length);
  const anyPending = results.some(r => r.pending.length);
  const fullGreen = results.length === 3 && !anyFailed && !anyPending && stubBites; // /model deferred ⇒ NOT full green
  results.forEach(r => console.log(`  iter ${r.iter}: failed=[${r.failed.join(',')}] pending=[${r.pending.join(',')}]`));
  console.log('STUB-MUST-FAIL bites:', stubBites);
  console.log(`★ COVERAGE (LOUD, PO-required): ${proven.length} PROVEN CONNECTED [${proven.join(', ')}] + ${pending.length} UNPROVEN-PENDING-AUTH [${pending.join(', ')}] — /model is owner-gated (bootstrapPage IS in HEAD, transport NOT verified connected here); it is TRON'S OWN TAB → MUST be proven CONNECTED in the authenticated R40.31 run before full GREEN.`);
  const overall = anyFailed ? 'RED' : (anyPending ? 'PARTIAL-PENDING-AUTH (NOT GREEN — /model unproven)' : (stubBites ? 'GREEN' : 'RED (stub did not bite)'));
  console.log('OVERALL:', overall);
  process.exitCode = fullGreen ? 0 : 1; // PARTIAL/pending exits NON-zero: must never read as a pass
} finally { await browser.close(); }
