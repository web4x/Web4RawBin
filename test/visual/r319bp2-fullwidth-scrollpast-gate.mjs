// [test:uuid:f444ffa6-0be2-42c3-a40d-6668c85ff6c7] R31.9 round-2 full-width + scroll-past (ACs 4fcc23a14 full-width + 80448203a scroll-past) — GREEN DET-3x v0.7.134 @390+desktop, /trace AND Server Manager (DRY shared rb-detail-drawer). app.css:398 data-position=bottom → position:static;width:100% (reverted fixed-overlay): (a) drawer ~100vw full-width; (b) in-flow BELOW tree → last item reachable/not occluded (scroll-past); (c) grab-bar drag grows drawer; (d) non-regression = R31.9 round-1 wins hold (same DOM node across 1025 BP + desktop inline compartment). Credits the R31.9 drawer-position impl (observePosition 240c539f / applyPosition — req's call).
// R31.9 round-2 fix (v0.7.134, app.css:398 rb-detail-drawer[data-position='bottom']{position:static;width:100%} — reverted
// the fixed-overlay). RE-GATE @390 + intermediate + desktop, on /trace AND Server Manager (DRY shared rb-detail-drawer):
//  (a) FULL-WIDTH: mobile bottom drawer spans ~100vw (was content-width narrow) — AC 4fcc23a14.
//  (b) SCROLL-PAST: drawer is in-flow (position:static) BELOW the tree → the tree's LAST item is reachable/not occluded — AC 80448203a.
//  (c) RESIZE: drag .drawer-handle → drawer height GROWS (pre-R31.9 behavior preserved).
//  (d) NON-REGRESSION: R31.9 round-1 wins hold — SAME DOM node across the 1025px BP (no re-mount) + desktop = inline compartment.
// DET-3x. served self-verified v0.7.134 (phantom-guard).
import { chromium, devices } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import https from 'node:https';
import fs from 'node:fs';
const HOST = 'prod.wo-da.de', PORT = 4444, BASE = `https://${HOST}:${PORT}`, REPO = '/var/dev/Workspaces/web4x/Web4RawBin', TARGET = '0.7.134';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const httpGet = (p) => new Promise((r) => { const q = https.request({ host: HOST, port: PORT, path: p, method: 'GET', rejectUnauthorized: false }, (res) => { let b = ''; res.on('data', c => b += c); res.on('end', () => r(b)); }); q.on('error', () => r('')); q.end(); });
const smBundle = fs.readdirSync(`${REPO}/src/public/dist`).find(f => /^server-manager-.*\.js$/.test(f));
const ROOTS = [{ uuid: 'sess:robbinTeam2', type: 'otmuxSession', name: 'robbinTeam2', hasChildren: true, children: [
  { uuid: 'win:robbinTeam2:0', type: 'otmuxWindow', name: 'window 0', hasChildren: true, children: [
    { uuid: '%10', type: 'otmuxPane', name: 'robbinTeam2:0.0  —  bash', hasChildren: false },
    { uuid: '%11', type: 'otmuxPane', name: 'robbinTeam2:0.1  —  vim', hasChildren: false } ] } ] }];
const SM_STYLE = `body{margin:0;background:#0d1117;color:#e6edf3;display:flex;flex-direction:column;height:100dvh;overflow:hidden}header{padding:12px 16px;background:#161b22;display:flex;gap:12px}.trace-page{height:auto;flex:1;min-height:0}#err{padding:12px}`;
const SM_SHELL = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/app.css"><style>${SM_STYLE}</style></head><body><header><h1>Server Manager</h1></header><div class="trace-page"><div class="trace-tree-panel"><rb-trace-tree id="sm-tree"></rb-trace-tree><div id="err"></div></div></div><script type="module" src="/dist/${smBundle}"></script></body></html>`;

// measure the OPEN bottom drawer @390 vs the tree
const measureMobile = (page) => page.evaluate(() => {
  const d = document.querySelector('rb-detail-drawer'); if (!d) return { found: false };
  const tree = document.querySelector('.trace-tree-panel') || document.querySelector('rb-trace-tree');
  const items = document.querySelectorAll('rb-object-item'); const last = items[items.length - 1];
  const dr = d.getBoundingClientRect(), lr = last ? last.getBoundingClientRect() : null;
  return { found: true, pos: d.getAttribute('data-position'), cssPos: getComputedStyle(d).position,
    w: Math.round(dr.width), h: Math.round(dr.height), top: Math.round(dr.top), vw: window.innerWidth, vh: window.innerHeight,
    handle: !!d.querySelector('.drawer-handle'),
    lastItemBottom: lr ? Math.round(lr.bottom) : -1, lastItemVisible: lr ? (lr.bottom <= window.innerHeight + 2 && lr.top >= -2 && lr.height > 0) : false,
    lastNotOccluded: lr ? lr.top <= dr.top + 4 : false };  // last tree item is at/above the drawer top (drawer in-flow BELOW), not covered
});
const openTraceDrawer = async (page) => {
  await page.goto(`${BASE}/trace`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.querySelectorAll('rb-object-item').length > 0, { timeout: 20000 }).catch(() => {});
  await page.evaluate(() => { const it = document.querySelector('rb-object-item'); if (it) it.click(); });
  await sleep(1300);
};

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const results = [];
try {
  const sv = JSON.parse(await httpGet('/api/config') || '{}').version;
  if (sv !== TARGET) { console.log(`ABORT (phantom-guard): served=${sv} != ${TARGET}`); process.exitCode = 1; }
  else {
  console.log(`served version verified == ${TARGET}`);
  fs.mkdirSync(`${REPO}/test-results/r319bp2`, { recursive: true });

  for (let i = 1; i <= 3; i++) {
    // ── /trace @390: (a) full-width, (b) scroll-past, (c) resize ──
    const mCtx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
    await seedSystemTester(mCtx); const mp = await mCtx.newPage();
    await openTraceDrawer(mp);
    await mp.evaluate(() => { const t = document.querySelector('.trace-tree-panel'); if (t) t.scrollTop = t.scrollHeight; }); await sleep(400); // scroll tree to LAST item
    const m1 = await measureMobile(mp);
    if (i === 1) await mp.screenshot({ path: `${REPO}/test-results/r319bp2/trace-390-fullwidth.png` });
    const traceFullWidth = m1.found && m1.w >= m1.vw - 4 && m1.cssPos === 'static';     // (a) ~100vw + static (the fix)
    const traceScrollPast = m1.found && m1.cssPos === 'static' && m1.lastItemVisible && m1.lastNotOccluded; // (b) in-flow, last item reachable/not covered
    // (c) resize: drag the grab-bar UP → drawer grows
    let traceResize = false;
    const hb = await mp.evaluate(() => { const h = document.querySelector('rb-detail-drawer .drawer-handle'); if (!h) return null; const r = h.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    if (hb) { const h0 = m1.h; await mp.mouse.move(hb.x, hb.y); await mp.mouse.down(); await mp.mouse.move(hb.x, hb.y - 130, { steps: 8 }); await mp.mouse.up(); await sleep(400);
      const h1 = (await measureMobile(mp)).h; traceResize = h1 > h0 + 15; }
    await mCtx.close();

    // ── Server Manager @390 (DRY): (a) full-width on the shared drawer ──
    const sCtx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
    await seedSystemTester(sCtx); const sp = await sCtx.newPage();
    await sp.route((u) => u.pathname === '/server-manager', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: SM_SHELL }));
    await sp.route('**/api/server-manager/whoami**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"owner":true}' }));
    await sp.route('**/api/server-manager/tree**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, roots: ROOTS }) }));
    await sp.goto(`${BASE}/server-manager`, { waitUntil: 'networkidle' });
    await sp.waitForFunction(() => document.querySelectorAll('rb-object-item[ref^="otmuxsession:"]').length > 0, { timeout: 20000 }).catch(() => {});
    await sp.evaluate(() => { const p = document.querySelector('rb-object-item[ref^="otmuxpane:"]') || document.querySelector('rb-object-item'); if (p) p.click(); }); await sleep(1200);
    const sm = await measureMobile(sp);
    const smFullWidth = sm.found && sm.w >= sm.vw - 4 && sm.cssPos === 'static';
    await sCtx.close();

    // ── /trace desktop BP (d) NON-REGRESSION: same node across 1025 + desktop inline compartment ──
    const dCtx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1280, height: 800 } });
    await seedSystemTester(dCtx); const dp = await dCtx.newPage();
    await openTraceDrawer(dp);
    await dp.evaluate(() => { const d = document.querySelector('rb-detail-drawer'); if (d) d.setAttribute('data-gate-mark', 'BP2'); });
    const handle = await dp.$('rb-detail-drawer');
    const g = () => dp.evaluate(() => { const d = document.querySelector('rb-detail-drawer'); const tree = document.querySelector('.trace-tree-panel') || document.querySelector('rb-trace-tree'); const dr = d.getBoundingClientRect(), tr = (tree && tree.getBoundingClientRect()) || { right: 0, bottom: 0 }; return { pos: d.getAttribute('data-position'), mark: d.getAttribute('data-gate-mark'), side: dr.left >= tr.right - 8 && dr.top < tr.bottom - 8 }; });
    const dInline = await g();
    await dp.setViewportSize({ width: 800, height: 800 }); await sleep(800); const dBottom = await g();
    const conn = await handle.evaluate(el => el.isConnected).catch(() => false);
    await dp.setViewportSize({ width: 1280, height: 800 }); await sleep(800); const dInline2 = await g();
    const nonRegression = dInline.pos === 'inline' && dInline.side && dBottom.pos === 'bottom' && dInline2.pos === 'inline' && dInline2.side
      && dInline.mark === 'BP2' && dBottom.mark === 'BP2' && dInline2.mark === 'BP2' && conn;
    await dCtx.close();

    const pass = traceFullWidth && traceScrollPast && traceResize && smFullWidth && nonRegression;
    results.push(pass);
    console.log(`iter ${i}: /trace[a-fullwidth=${traceFullWidth}(w${m1.w}/vw${m1.vw} css=${m1.cssPos}) b-scrollpast=${traceScrollPast}(lastVis=${m1.lastItemVisible} notOccl=${m1.lastNotOccluded}) c-resize=${traceResize}] | SM[a-fullwidth=${smFullWidth}(w${sm.w}/vw${sm.vw} css=${sm.cssPos})] | d-nonRegression=${nonRegression}(${dInline.pos}→${dBottom.pos}→${dInline2.pos} sameNode=${dInline2.mark === 'BP2' && conn}) => ${pass ? 'GREEN' : 'RED'}`);
  }
  }
} finally { await browser.close(); }

console.log('\n===== R31.9 round-2 full-width + scroll-past (DET-3x, /trace + SM) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
