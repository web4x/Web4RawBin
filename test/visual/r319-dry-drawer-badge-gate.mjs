// [test:uuid:eea279e4-1bae-4119-89e3-307bb252f8b2] R31.3 RbTraceTree.computeBadges (Impl 7e43dda4) — STD-REF badge: node.dataset.childRefCount (stamped at build), colon-immune by construction (NO nodeChildCount map / NO split(':')). Verifies SESSION badge=='2' ('otmuxsession:sess:robbinTeam2', the colon-in-uuid case that read 0 under the retired split patch) + WINDOW badges 2/1 == real child count. GREEN DET-3x @390 served v0.7.99. Paired with the R31.4 drawer /trace-identical bottom-overlay assert (same gate). NOT the retired split patch.
// R31.4/R31.3 DRY-fix REAL gate (AC surface, NOT static), DET-3x @390 iPhone-12 (Tron's device). served==0.7.99.
// (1) DRAWER BOTTOM-OVERLAY like /trace: the DRY client creates rb-detail-drawer#sm-drawer as a flex child of .trace-page
//     (server-manager.ts:20-23) → /trace-identical bottom-overlay by shared CSS; the retired .sm-term-overlay embedded it
//     BELOW the tree (Tron IMG_4605). Fixture mirrors the REAL serverManagerPage() .trace-page shell (server.ts:835) so the
//     shared app.css produces the real geometry; measured via a REAL pane click, and cross-checked vs /trace's own drawer.
// (2) BADGE==real-N via CHILD-REFS (colon-immune): badge reads node.dataset.childRefCount (stamped at build) — NO
//     nodeChildCount map / NO split(':'). Asserts SESSION ('otmuxsession:sess:NAME', the colon-in-uuid case that read 0
//     under the retired split patch) AND WINDOW badges == real child count.
// (3) /trace + /scenario UNREGRESSED (shared rb-trace-tree / rb-detail-drawer).
// Marker (on GREEN) → computeBadges 7e43dda4 (STD-REF badge, R31.3), NOT the retired split patch. Authed VISUALS = Tron device.
import { chromium, devices } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import https from 'node:https';
import fs from 'node:fs';
const HOST = 'prod.wo-da.de', PORT = 4444, BASE = `https://${HOST}:${PORT}`, REPO = '/var/dev/Workspaces/web4x/Web4RawBin', TARGET = '0.7.99';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const httpGet = (p) => new Promise((r) => { const q = https.request({ host: HOST, port: PORT, path: p, method: 'GET', rejectUnauthorized: false }, (res) => { let b = ''; res.on('data', c => b += c); res.on('end', () => r(b)); }); q.on('error', () => r('')); q.end(); });
const smBundle = fs.readdirSync(`${REPO}/src/public/dist`).find(f => /^server-manager-.*\.js$/.test(f));

// REAL-shape roots (mirror server.ts:908): 1 session (colon-uuid), 2 windows (2 + 1 panes)
const ROOTS = [{ uuid: 'sess:robbinTeam2', type: 'otmuxSession', name: 'robbinTeam2', hasChildren: true, children: [
  { uuid: 'win:robbinTeam2:0', type: 'otmuxWindow', name: 'window 0', hasChildren: true, children: [
    { uuid: '%10', type: 'otmuxPane', name: 'robbinTeam2:0.0  —  bash', hasChildren: false },
    { uuid: '%11', type: 'otmuxPane', name: 'robbinTeam2:0.1  —  vim', hasChildren: false } ] },
  { uuid: 'win:robbinTeam2:1', type: 'otmuxWindow', name: 'window 1', hasChildren: true, children: [
    { uuid: '%12', type: 'otmuxPane', name: 'robbinTeam2:1.0  —  htop', hasChildren: false } ] } ] }];
// faithful mirror of serverManagerPage() (server.ts:835) — the .trace-page structure is what makes the drawer overlay
const SM_STYLE = `body{font-family:system-ui,sans-serif;margin:0;background:#0d1117;color:#e6edf3;display:flex;flex-direction:column;height:100dvh;overflow:hidden}`
  + `header{padding:12px 16px;background:#161b22;border-bottom:1px solid #30363d;display:flex;align-items:center;gap:12px}`
  + `h1{font-size:1rem;margin:0;flex:1}button{background:#238636;color:#fff;border:0;border-radius:6px;padding:6px 12px}`
  + `.trace-page{height:auto;flex:1;min-height:0}#err{color:#f85149;padding:12px 16px}`;
const SHELL = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">`
  + `<link rel="stylesheet" href="/app.css"><style>${SM_STYLE}</style></head><body>`
  + `<header><h1>Server Manager</h1><button id="refresh">Refresh</button></header>`
  + `<div class="trace-page"><div class="trace-tree-panel"><rb-trace-tree id="sm-tree"></rb-trace-tree><div id="err"></div></div></div>`
  + `<script type="module" src="/dist/${smBundle}"></script></body></html>`;

const badge = (page, refPrefix, nth = 0) => page.evaluate(([p, n]) => { const it = document.querySelectorAll(`rb-object-item[ref^="${p}"]`)[n]; const b = it && it.querySelector('.oi-badge'); return b ? b.textContent.trim() : null; }, [refPrefix, nth]);
const clickExpand = (page, refPrefix, nth = 0) => page.evaluate(([p, n]) => { const it = document.querySelectorAll(`rb-object-item[ref^="${p}"]`)[n]; const ex = it && it.querySelector('.oi-expand'); if (ex) ex.click(); return !!ex; }, [refPrefix, nth]);
// "OVERLAYS like /trace" = the .trace-page rb-detail-drawer CSS (app.css:277 → position:static !important flex child of
// .trace-page, a Details panel — NOT a position:fixed sheet). So the AC is a STRUCTURAL MATCH to /trace's own drawer,
// not an absolute 'is fixed'. Discriminating: catches drawer-appended-to-body, wrong position, or pushed-below-fold.
const measure = (page) => page.evaluate(() => {
  const d = document.querySelector('.trace-page rb-detail-drawer') || document.querySelector('rb-detail-drawer');
  const tree = document.querySelector('.trace-tree-panel') || document.querySelector('rb-trace-tree');
  if (!d) return { found: false };
  const dr = d.getBoundingClientRect(), tr = (tree && tree.getBoundingClientRect()) || { top: 0, bottom: 0 }, vh = window.innerHeight;
  const parentTracePage = d.parentElement?.closest?.('.trace-page') === d.parentElement || /trace-page/.test(d.parentElement?.className || '');
  return { found: true, pos: getComputedStyle(d).position, parentCls: d.parentElement?.className || '', inTracePage: parentTracePage,
    sameTracePageAsTree: !!(tree && d.parentElement && tree.closest('.trace-page') === d.parentElement),
    dTop: Math.round(dr.top), dBottom: Math.round(dr.bottom), dH: Math.round(dr.height), treeBottom: Math.round(tr.bottom), vh: Math.round(vh),
    visibleInViewport: dr.height > 4 && dr.top < vh && dr.bottom > 0, belowFold: dr.bottom > vh + 8 };
});

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const results = [];
try {
  const servedVersion = JSON.parse(await httpGet('/api/config') || '{}').version;
  if (servedVersion !== TARGET) { console.log(`ABORT (phantom-guard): served=${servedVersion} != ${TARGET}`); process.exitCode = 1; }
  else {
  console.log(`served version verified == ${TARGET}`);

  fs.mkdirSync(`${REPO}/test-results/r319`, { recursive: true });
  // /trace REFERENCE: open its drawer for real = the ground-truth "like /trace" geometry we must match + unregressed
  const refCtx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  await seedSystemTester(refCtx); const rp = await refCtx.newPage();
  await rp.goto(`${BASE}/trace`, { waitUntil: 'networkidle' });
  await rp.waitForFunction(() => document.querySelectorAll('rb-object-item').length > 0, { timeout: 20000 }).catch(() => {});
  const traceNodes = await rp.evaluate(() => document.querySelectorAll('rb-object-item').length);
  await rp.evaluate(() => { const it = document.querySelector('rb-object-item'); if (it) it.click(); }); await sleep(1400);
  const traceGeo = await measure(rp);
  await rp.screenshot({ path: `${REPO}/test-results/r319/trace-drawer-390.png` });
  await rp.goto(`${BASE}/scenario`, { waitUntil: 'networkidle' }); await sleep(1500);
  const scenarioOk = await rp.evaluate(() => { const a = document.getElementById('scenario-app'); return document.querySelectorAll('rb-object-item').length > 0 || (!!a && a.children.length > 0); });
  await refCtx.close();
  console.log(`  /trace REF drawer: ${JSON.stringify(traceGeo)} | /scenario renders=${scenarioOk}`);

  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
    await seedSystemTester(ctx);
    const page = await ctx.newPage();
    await page.route((u) => u.pathname === '/server-manager', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: SHELL }));
    await page.route('**/api/server-manager/whoami**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"owner":true}' }));
    await page.route('**/api/server-manager/tree**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, roots: ROOTS }) }));
    await page.goto(`${BASE}/server-manager`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.querySelectorAll('rb-object-item[ref^="otmuxsession:"]').length > 0, { timeout: 20000 }).catch(() => {});
    await sleep(600);

    // (2) BADGE via child-refs — SESSION (colon-in-uuid, was 0 under split patch) + WINDOW
    const sessBadge = await badge(page, 'otmuxsession:');
    await clickExpand(page, 'otmuxsession:'); await sleep(400);
    const win0 = await badge(page, 'otmuxwindow:', 0), win1 = await badge(page, 'otmuxwindow:', 1);
    const badgesOk = sessBadge === '2' && win0 === '2' && win1 === '1';

    // real click a pane → drawer mounts rb-terminal-detail
    await clickExpand(page, 'otmuxwindow:', 0); await sleep(400);
    await page.evaluate(() => { const p = document.querySelector('rb-object-item[ref^="otmuxpane:"]'); if (p) p.click(); });
    await sleep(1300);

    // (1) DRAWER GEOMETRY — STRUCTURAL MATCH to /trace (the AC = "like /trace"): in .trace-page, same position as
    // /trace's drawer, visible in-viewport, NOT pushed below the fold (the v0.7.97 embedded-below bug). + terminal mounted.
    const hasTerminal = await page.evaluate(() => !!document.querySelector('#sm-drawer rb-terminal-detail, .trace-page rb-detail-drawer rb-terminal-detail'));
    const geo = await measure(page);
    if (i === 1) await page.screenshot({ path: `${REPO}/test-results/r319/sm-drawer-390.png` });
    const matchesTrace = geo.found && hasTerminal && geo.inTracePage && geo.sameTracePageAsTree
      && geo.visibleInViewport && !geo.belowFold
      && (traceGeo.found ? geo.pos === traceGeo.pos : geo.pos === 'static'); // same layout mode as /trace's own drawer
    await page.keyboard.press('Escape'); await sleep(200);
    await ctx.close();

    const pass = badgesOk && matchesTrace;
    results.push(pass);
    console.log(`iter ${i}: badges(child-ref)=${badgesOk}(sess=${sessBadge} w0=${win0} w1=${win1}) | term=${hasTerminal} LIKE-/trace=${matchesTrace}(pos=${geo.pos}/ref=${traceGeo.pos} inTracePage=${geo.inTracePage} sameAsTree=${geo.sameTracePageAsTree} visible=${geo.visibleInViewport} belowFold=${geo.belowFold} dTop=${geo.dTop} dBottom=${geo.dBottom} vh=${geo.vh}) => ${pass ? 'GREEN' : 'RED'}`);
  }
  const unregressed = traceNodes > 0 && scenarioOk;
  console.log(`\n/trace+/scenario UNREGRESSED: ${unregressed}`);
  if (!unregressed) results.push(false);
  }
} finally { await browser.close(); }

console.log('\n===== R31.4/R31.3 DRY-fix (drawer-overlay + child-ref badge, DET-3x @390) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length >= 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
console.log('NOTE: interactive RW/pty + authed drawer/badge VISUALS = Tron device (owner cookie).');
process.exitCode = green ? 0 : 1;
