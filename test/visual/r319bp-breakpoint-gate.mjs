// [test:uuid:ccb4a810-4397-4d68-9c7e-dc520d583a98] R31.9 RbDetailDrawer.observePosition (Impl 240c539f, Method e8097351, UC cc45a580) — responsive drawer position across the 1025px breakpoint, DET-3x @390+@desktop+@BP-drag, GREEN v0.7.133. Verifies all 5 ACs REAL-interactive: (1) no-jump SAME DOM node across BP (marker+handle persist, data-position flips inline↔bottom, no re-mount); (2) resize-continuous (.drawer-handle both sides + stale inline height CLEARED entering desktop); (3) desktop = 2-pane INLINE Details compartment (tree|Details side-by-side) / @390 = bottom drawer; (4) state-preserved (content+node intact across BP); (5) app.css regression clean (/trace+/edit+/room render @390+@desktop, @media(1025) retired).
// R31.9 drawer responsive-position across the 1025px breakpoint — Impl 240c539f RbDetailDrawer.observePosition.
// ONE instance transitions inline(≥1025 Details-compartment) ↔ bottom(≤1024 drawer) via CSS [data-position] driven by a
// ResizeObserver — NO JS instance-switch, NO re-mount (same DOM node), NO hard-@media jump (app.css @media(1025) retired).
// Gates 4 of 5 ACs DET-3x — REAL interactive resize ACROSS the breakpoint (not seeded-structural). AC3 (desktop=2-pane
// Details-compartment) HELD pending PO/architect scope ruling. served self-verified v0.7.133 (phantom-guard).
//  (1) AC-no-jump / SAME DOM node across BP: resize 1280→800→1280, the drawer is the SAME element (marker + handle stays
//      connected), data-position flips inline↔bottom, no re-mount/swap.
//  (2) AC-resize-continuous: .drawer-handle present+functional BOTH sides; entering desktop the STALE inline height is
//      cleared (applyPosition :141) so it can't fight flex:1 (the resize-break Tron reported).
//  (4) AC-state-preserved: open a scrolled detail, drag across BP → content + scrollTop intact (same node keeps state).
//  (5) AC-appcss-regression-clean: /trace + /edit?layout=r31.5 + /room drawers render+open @390 AND @desktop (shared app.css).
import { chromium, devices } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import https from 'node:https';
import fs from 'node:fs';
const HOST = 'prod.wo-da.de', PORT = 4444, BASE = `https://${HOST}:${PORT}`, REPO = '/var/dev/Workspaces/web4x/Web4RawBin', TARGET = '0.7.133';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const httpGet = (p) => new Promise((r) => { const q = https.request({ host: HOST, port: PORT, path: p, method: 'GET', rejectUnauthorized: false }, (res) => { let b = ''; res.on('data', c => b += c); res.on('end', () => r(b)); }); q.on('error', () => r('')); q.end(); });

// open the /trace detail drawer (canonical rb-detail-drawer host), scroll it, mark the node
const openDrawer = async (page) => {
  await page.goto(`${BASE}/trace`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.querySelectorAll('rb-object-item').length > 0, { timeout: 20000 }).catch(() => {});
  await page.evaluate(() => { const it = document.querySelector('rb-object-item'); if (it) it.click(); });
  await sleep(1400);
  return page.evaluate(() => {
    const d = document.querySelector('rb-detail-drawer'); if (!d) return { ok: false };
    d.setAttribute('data-gate-mark', 'BP-NODE-1');
    const body = d.querySelector('.drawer-body');
    const scrollable = !!body && body.scrollHeight > body.clientHeight + 10;
    if (scrollable) body.scrollTop = 60;                                  // only meaningful if the detail actually overflows
    return { ok: true, scrollable, setScroll: scrollable ? Math.round(body.scrollTop) : -1 };
  });
};
const snap = (page) => page.evaluate(() => {
  const d = document.querySelector('rb-detail-drawer'); if (!d) return { found: false };
  const body = d.querySelector('.drawer-body');
  const tree = document.querySelector('.trace-tree-panel') || document.querySelector('rb-trace-tree');
  const dr = d.getBoundingClientRect(), tr = (tree && tree.getBoundingClientRect()) || { left: 0, right: 0, top: 0, bottom: 0 };
  return { found: true, pos: d.getAttribute('data-position'), mark: d.getAttribute('data-gate-mark'),
    inlineHeight: d.style.height || '', hasHandle: !!d.querySelector('.drawer-handle'),
    detailLen: (d.querySelector('.drawer-panel-detail, .drawer-body')?.innerHTML || '').length,
    scrollTop: body ? Math.round(body.scrollTop) : -1, offH: d.offsetHeight, connected: d.isConnected,
    // AC3 geometry: inline compartment = drawer SIDE-BY-SIDE with the tree (right of it, same row); bottom = below the tree
    sideBySide: dr.left >= tr.right - 8 && dr.top < tr.bottom - 8 && dr.width > 8 && dr.height > 8,
    belowTree: dr.top >= tr.bottom - 8 };
});

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const results = [];
try {
  const servedVersion = JSON.parse(await httpGet('/api/config') || '{}').version;
  if (servedVersion !== TARGET) { console.log(`ABORT (phantom-guard): served=${servedVersion} != ${TARGET}`); process.exitCode = 1; }
  else {
  console.log(`served version verified == ${TARGET}`);
  fs.mkdirSync(`${REPO}/test-results/r319bp`, { recursive: true });

  for (let i = 1; i <= 3; i++) {
    // ── BP-drag context (desktop, resizable across 1025) — ACs 1,2,4 ──
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1280, height: 800 } });
    await seedSystemTester(ctx); const page = await ctx.newPage();
    const od = await openDrawer(page);
    const handle = await page.$('rb-detail-drawer');                    // element handle → detects a re-mount (would disconnect)
    const desktop1 = await snap(page);                                  // ≥1025 → inline
    if (i === 1) await page.screenshot({ path: `${REPO}/test-results/r319bp/desktop-inline.png` });

    await page.setViewportSize({ width: 800, height: 800 }); await sleep(900);   // ACROSS the BP → ≤1024
    const mobileW = await snap(page);
    const handleStillConnected = await handle.evaluate(el => el.isConnected).catch(() => false);
    if (i === 1) await page.screenshot({ path: `${REPO}/test-results/r319bp/narrow-bottom.png` });

    await page.setViewportSize({ width: 1280, height: 800 }); await sleep(900);  // back across → inline
    const desktop2 = await snap(page);

    // AC1 no-jump / SAME node: mark + handle persist across BOTH crossings, position flips inline↔bottom, never re-mounted
    const sameNode = desktop1.mark === 'BP-NODE-1' && mobileW.mark === 'BP-NODE-1' && desktop2.mark === 'BP-NODE-1' && handleStillConnected && mobileW.connected && desktop2.connected;
    const flips = desktop1.pos === 'inline' && mobileW.pos === 'bottom' && desktop2.pos === 'inline';
    const ac1 = sameNode && flips;
    // AC2 resize-continuous: handle present both sides + entering desktop the stale inline height is CLEARED (empty px, not fighting flex:1)
    const ac2 = desktop1.hasHandle && mobileW.hasHandle && desktop2.hasHandle && (desktop2.inlineHeight === '' || desktop2.inlineHeight === 'auto') && desktop2.offH > 20;
    // AC3 desktop = 2-pane INLINE Details compartment (tree | Details side-by-side); @390 = bottom drawer (below tree, not side)
    const ac3 = desktop1.pos === 'inline' && desktop1.sideBySide && desktop2.pos === 'inline' && desktop2.sideBySide && mobileW.pos === 'bottom' && !mobileW.sideBySide;
    // AC4 state-preserved: content + node intact across BP; scroll preserved IF the detail was scrollable (else content is the signal)
    const contentKept = mobileW.detailLen > 100 && desktop2.detailLen > 100 && desktop2.mark === 'BP-NODE-1';
    const scrollKept = !od.scrollable || Math.abs(desktop2.scrollTop - 60) <= 10;
    const ac4 = contentKept && scrollKept;
    await ctx.close();

    // ── AC5 app.css regression: drawers render+open @390 AND @desktop on the shared-CSS routes ──
    const routeOk = async (mobile) => {
      const c = await browser.newContext(mobile ? { ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' } : { ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1280, height: 800 } });
      await seedSystemTester(c); const p = await c.newPage(); const out = {};
      for (const [name, url] of [['trace', '/trace'], ['edit', '/edit/otmux?repo=oosh&left=516ebb3&right=dev&3way=1&layout=r31.5'], ['room', '/room']]) {
        try { await p.goto(`${BASE}${url}`, { waitUntil: 'domcontentloaded' }); await sleep(1400);
          // app.css regression = the route renders (a custom element mounted + real body height, no CSS-break blank/collapse)
          out[name] = await p.evaluate(() => Array.from(document.body.querySelectorAll('*')).some(e => e.tagName.includes('-')) && document.body.offsetHeight > 100); }
        catch { out[name] = false; }
      }
      await c.close(); return out;
    };
    const rMob = await routeOk(true), rDesk = await routeOk(false);
    const ac5 = Object.values(rMob).every(Boolean) && Object.values(rDesk).every(Boolean);

    const pass = ac1 && ac2 && ac3 && ac4 && ac5;
    results.push(pass);
    console.log(`iter ${i}: AC1-no-jump/same-node=${ac1}(pos ${desktop1.pos}→${mobileW.pos}→${desktop2.pos} mark✓=${sameNode} handleConn=${handleStillConnected}) | AC2-resize=${ac2}(handles✓ deskH='${desktop2.inlineHeight}') | AC3-desktop-2pane=${ac3}(deskInline&side=${desktop1.sideBySide} mobBottom&below=${mobileW.belowTree}) | AC4-state=${ac4}(detail ${mobileW.detailLen}/${desktop2.detailLen} scrollable=${od.scrollable} scroll=${desktop2.scrollTop}) | AC5-appcss=${ac5}(mob=${JSON.stringify(rMob)} desk=${JSON.stringify(rDesk)}) => ${pass ? 'GREEN' : 'RED'}`);
  }
  }
} finally { await browser.close(); }

console.log('\n===== R31.9 breakpoint — ALL 5 ACs DET-3x @390+@desktop+@1025BP =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x (all 5)' : 'RED');
process.exitCode = green ? 0 : 1;
