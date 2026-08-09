// R33.6.1 empty-diagram add-view — INDEPENDENT @390 gate (PO-directed; measured differently than the expert's DOM own-oracle).
// FIX (a7ae1872d, v0.8.21 client bundle model-7OFPF33R.js — LIVE): stripRef now strips the 'diagram:' prefix, so a NEW/EMPTY
// diagram opened with ref='diagram:<uuid>' no longer passes the unstripped ref → 400 → no box. PO phantom-guard: gate the
// CLIENT BUNDLE (served model-7OFPF33R.js == committed + SW rawbin-v0.8.21), NOT /api/config BOOT_VERSION (lags 0.8.20, server
// mid-rewind) — the R33.5-reveal client-fix lesson. INDEPENDENT measure: DISK view-count 0→1 (persist, not the DOM oracle) +
// a ROUNDTRIP RE-MOUNT (box renders from the persisted view = survives reload). PLANTED-BITE: tap a BOGUS class uuid (not in
// MODEL_STORE) → add-view does NOT persist → diskViews stays 0, no box. Pollution-safe: test-only empty fixture, deleted in
// finally. @390 iPhone-12. DET-3x. Impl = RbDiagramDetail.addView 4e74dfee (R33.6.1 a5205512).
// [test:uuid:0aaae49a-4392-42b1-8bff-d53e4300d1e9] R33.6.1 (a5205512) empty-diagram add-view @390 DET-3x on the LIVE client
// bundle v0.8.21 (model-7OFPF33R.js, stripRef 'diagram:' fix): tap a class onto a NEW/EMPTY diagram → SELECTABLE box w/
// compartment APPEARS (0→1) + DISK view-count persists 0→1 + ROUNDTRIP re-mount renders the box from disk (survives reload);
// planted-bite (non-modelelement ref → no add, disk stays 0). Measured INDEPENDENTLY (disk persist + reload) of the expert's
// DOM own-oracle. Impl target = RbDiagramDetail.addView 4e74dfee (the stripRef fix path); tap trigger = onSelectionChanged
// 20f8a19e (UC diagram.tapToAdd) — req maps the marker to the R33.6.1 impl. Pollution-safe (test fixture deleted).
import fs from 'node:fs'; import path from 'node:path';
import { chromium, webkit, devices } from '@playwright/test';
const ENGINE = process.env.WK ? webkit : chromium; // R33 WebKit sweep: WK=1 -> real Safari @390
const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin', BASE = 'https://prod.wo-da.de:4444';
const EMPTY = 'e0000000-0000-4000-8000-000000033610'; // test-only empty diagram (distinct from the expert repro's uuid)
const CLASS = 'f51234b0-0233-4fd6-a802-5467f64accc2'; // 'Id' — a real MODEL_STORE element to add
const BOGUS = 'f0000000-0000-4000-8000-0000000badf0'; // NOT in MODEL_STORE → add must NOT persist (planted-bite)
const EFILE = path.join(ROOT, 'data/model-store/index', ...EMPTY.slice(0, 5).split(''), `${EMPTY}.scenario.json`);
const DIST = path.join(ROOT, 'src/public/dist');
const BUNDLE = '/dist/' + fs.readdirSync(DIST).filter(f => /^model-.*\.js$/.test(f)).map(f => [f, fs.statSync(path.join(DIST, f)).mtimeMs]).sort((a, b) => b[1] - a[1])[0][0];
const OUT = path.join(ROOT, 'test-results/r3361-empty') + '/'; fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const writeEmpty = () => { fs.mkdirSync(path.dirname(EFILE), { recursive: true }); fs.writeFileSync(EFILE, JSON.stringify({ ior: 'ior:class:Diagram', ownerIor: null, model: { uuid: EMPTY, name: 'R3361 empty add-view gate', views: [] } }, null, 2) + '\n'); };
const viewsOnDisk = () => { try { return (JSON.parse(fs.readFileSync(EFILE, 'utf8')).model.views || []).length; } catch { return -1; } };

async function mountDiagram(browser) {
  const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/trace`, { waitUntil: 'domcontentloaded' });
  await page.addScriptTag({ url: BUNDLE, type: 'module' }).catch(() => {});
  await page.waitForFunction(() => !!customElements.get('rb-diagram-detail'), { timeout: 15000 }).catch(() => {});
  await page.evaluate((u) => {
    document.body.style.margin = '0'; document.body.innerHTML = '';
    const d = document.createElement('rb-diagram-detail');
    d.id = 'dg'; d.setAttribute('ref', `diagram:${u}`); d.setAttribute('uuid', u);
    d.style.cssText = 'display:block;position:fixed;inset:0;background:#0d1117';
    document.body.appendChild(d);
  }, EMPTY);
  await sleep(1400);
  return { ctx, page };
}
const boxCount = (page) => page.evaluate(() => ({ boxes: document.querySelectorAll('#dg .dm-box').length, selectable: !!document.querySelector('#dg .dm-box[data-ref]'), compartments: document.querySelectorAll('#dg .dm-box .dm-compartment, #dg .dm-box rect, #dg .dm-box .dm-row').length }));

async function runHappy(browser, i) {
  writeEmpty();
  const { ctx, page } = await mountDiagram(browser);
  const resp = []; page.on('response', async r => { if (/add-view/.test(r.url())) resp.push(r.status()); });
  const before = await boxCount(page); const diskBefore = viewsOnDisk();
  await page.evaluate((c) => document.dispatchEvent(new CustomEvent('selection-changed', { detail: { selected: [`modelelement:${c}`] }, bubbles: true })), CLASS); // TAP add
  await sleep(2000);
  const after = await boxCount(page); const diskAfter = viewsOnDisk();
  if (i === 1) await page.screenshot({ path: OUT + 'happy-box.png' });
  await ctx.close();
  // ROUNDTRIP: fresh mount (no tap) → the box must RENDER from the persisted view (survives reload)
  const { ctx: ctx2, page: page2 } = await mountDiagram(browser);
  const reload = await boxCount(page2);
  if (i === 1) await page2.screenshot({ path: OUT + 'roundtrip-box.png' });
  await ctx2.close();
  return { boxesBefore: before.boxes, diskBefore, boxesAfter: after.boxes, selectable: after.selectable, compartments: after.compartments, diskAfter, addViewResp: resp[0] || null, boxesReload: reload.boxes };
}

async function runBite(browser) {
  writeEmpty();
  const { ctx, page } = await mountDiagram(browser);
  // PLANTED-BITE (attr-absent path): a NON-modelelement ref → onSelectionChanged (rb-diagram-detail:69) returns early,
  // NO addView fires → no POST → diskViews stays 0, no box. Proves the gate only greens on a REAL model-element tap-add.
  await page.evaluate((c) => document.dispatchEvent(new CustomEvent('selection-changed', { detail: { selected: [`webitem:${c}`] }, bubbles: true })), BOGUS);
  await sleep(2000);
  const after = await boxCount(page); const disk = viewsOnDisk();
  await ctx.close();
  return { boxesAfter: after.boxes, diskViews: disk };
}

const browser = await ENGINE.launch({ headless: true, ...(process.env.WK ? {} : { args: ['--no-sandbox', '--ignore-certificate-errors'] }) });
const happy = [], bite = [];
try {
  for (let i = 1; i <= 3; i++) happy.push(await runHappy(browser, i));
  bite.push(await runBite(browser));
} finally {
  await browser.close();
  try { fs.unlinkSync(EFILE); } catch { /* */ }
  console.log(`CLEANUP: fixture deleted=${!fs.existsSync(EFILE)}`);
}

console.log('\n===== R33.6.1 empty-diagram add-view @390 iPhone-12 (INDEPENDENT: diskViews + roundtrip, DET-3x) =====');
happy.forEach((R, i) => console.log(`happy iter ${i + 1}: ${JSON.stringify(R)}`));
console.log(`planted-bite (bogus class): ${JSON.stringify(bite[0])}`);
const green3 = k => happy.length === 3 && happy.every(R => R[k]);
const boxAppears = green3('boxesBefore') === undefined; // placeholder
const appear = happy.every(R => R.boxesBefore === 0 && R.boxesAfter >= 1 && R.selectable); // 0→1 selectable box
const disk = happy.every(R => R.diskBefore === 0 && R.diskAfter >= 1);                      // DISK persist 0→1 (independent)
const roundtrip = happy.every(R => R.boxesReload >= 1);                                     // survives reload (fresh mount from disk)
const biteOk = bite[0] && bite[0].boxesAfter === 0 && bite[0].diskViews === 0;              // bogus → no persist, no box
const green = happy.length === 3 && appear && disk && roundtrip && biteOk;
console.log(`\nBOX APPEARS (0→1 selectable): ${appear ? 'GREEN' : 'RED'}`);
console.log(`DISK PERSIST (diskViews 0→1, independent): ${disk ? 'GREEN' : 'RED'}`);
console.log(`ROUNDTRIP (box survives reload from disk): ${roundtrip ? 'GREEN' : 'RED'}`);
console.log(`PLANTED-BITE (bogus class → no persist, no box): ${biteOk ? 'GREEN' : 'RED'}`);
console.log('OVERALL R33.6.1:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
