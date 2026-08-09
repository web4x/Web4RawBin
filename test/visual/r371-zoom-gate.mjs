// R33.7.1 — RbPanZoom.setScale (Impl 301b71d4) @390 COMPONENT-harness gate, DET-3x independent (served==HEAD==0.8.28).
// Mount rb-diagram-detail (NOT the authed /model; no self-grant) → drive the REAL RbPanZoom via the component's this.pz.
// AC: (a) zoom-out GROWS the canvas (scale<1, INV-Z1 <1=grown); (b) scale=1 = WHOLE diagram (100%); (c) a user zoom
// PERSISTS (onZoomEnd → POST /api/model/diagram/zoom, MODEL_STORE) and a REMOUNT RESTORES it (:138 setScale(d.zoom)).
// Non-vacuous: (c) restores a value ≠ 1 (proves it's the persisted zoom, not the default). Pollution-safe: the DIAG unit
// is byte-backed-up and restored in finally (persist writes model.zoom to MODEL_STORE; prod scenario/index untouched).
// [test:uuid:99a90d1e-37f3-4925-9049-38b8670d9283] R33.7.1 RbPanZoom.setScale (Impl 301b71d4) @390 DET-3x: zoom-out grows
// canvas (scale<1), scale=1=whole-diagram, and a user zoom PERSISTS (POST /api/model/diagram/zoom) → REMOUNT RESTORES it
// (≠1, non-vacuous). Component-harness (mount rb-diagram-detail, not authed /model); pollution-safe (DIAG byte-restored).
import fs from 'node:fs'; import path from 'node:path';
import { chromium, webkit, devices } from '@playwright/test';
const ENGINE = process.env.WK ? webkit : chromium; // R33 WebKit sweep: WK=1 → real Safari engine @390 (Tron's iPhone)
const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin', BASE = 'https://prod.wo-da.de:4444';
const DIAG = 'faa4acad-41a6-48fc-ad0d-dd0044c123f7';
const DFILE = path.join(ROOT, 'data/model-store/index', ...DIAG.slice(0, 5).split(''), `${DIAG}.scenario.json`);
const DIST = path.join(ROOT, 'src/public/dist');
const BUNDLE = '/dist/' + fs.readdirSync(DIST).filter(f => /^model-.*\.js$/.test(f)).map(f => [f, fs.statSync(path.join(DIST, f)).mtimeMs]).sort((a, b) => b[1] - a[1])[0][0];
const OUT = path.join(ROOT, 'test-results/r371-zoom') + '/'; fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const BASELINE = fs.readFileSync(DFILE, 'utf8');

async function mkPage(browser) {
  const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/trace`, { waitUntil: 'domcontentloaded' });
  await page.addScriptTag({ url: BUNDLE, type: 'module' }).catch(() => {});
  await page.waitForFunction(() => !!customElements.get('rb-diagram-detail'), { timeout: 15000 }).catch(() => {});
  return { ctx, page };
}
async function mountDiagram(page) {
  await page.evaluate((u) => {
    document.body.style.margin = '0'; const old = document.getElementById('dg'); if (old) old.remove();
    const d = document.createElement('rb-diagram-detail');
    d.id = 'dg'; d.setAttribute('ref', `diagram:${u}`); d.setAttribute('uuid', u);
    d.style.cssText = 'display:block;position:fixed;inset:0;background:#0d1117';
    document.body.appendChild(d);
  }, DIAG);
  await page.waitForFunction(() => { const e = document.querySelector('#dg'); return e && e.pz && document.querySelector('#dg .dm-content'); }, { timeout: 12000 }).catch(() => {});
  await sleep(900);
}
const scale = (page) => page.evaluate(() => { const e = document.querySelector('#dg'); return e && e.pz ? e.pz.currentScale : -1; });

async function runOnce(browser, i) {
  fs.writeFileSync(DFILE, BASELINE);
  const { ctx, page } = await mkPage(browser);
  const R = {};
  await mountDiagram(page);
  R.visibleRender = await page.evaluate(() => { const c = document.querySelector('#dg .dm-content'); const r = c && c.getBoundingClientRect(); return !!(r && r.width > 0 && r.height > 0); }); // WebKit visible-render half
  const s0 = await scale(page);

  // (a) zoom-OUT grows the canvas → scale drops below 1 (INV-Z1: <1 = grown canvas)
  await page.evaluate(() => { const s = document.querySelector('#dg .dm-surface'); for (let k = 0; k < 6; k++) s.dispatchEvent(new WheelEvent('wheel', { deltaY: 160, clientX: 195, clientY: 420, bubbles: true, cancelable: true })); });
  await sleep(500);
  const sOut = await scale(page);
  R.zoomOutGrows = sOut < s0 && sOut < 1;
  if (i === 1) await page.screenshot({ path: OUT + '01-zoom-out.png' });

  // (b) scale=1 = whole diagram (100%)
  await page.evaluate(() => document.querySelector('#dg').pz.setScale(1));
  await sleep(200);
  R.oneIsWhole = Math.abs((await scale(page)) - 1) < 0.001;

  // (c) user zoom PERSISTS (onZoomEnd→POST) then a REMOUNT RESTORES it (≠1, non-vacuous)
  await page.evaluate(() => { const s = document.querySelector('#dg .dm-surface'); for (let k = 0; k < 5; k++) s.dispatchEvent(new WheelEvent('wheel', { deltaY: 150, clientX: 195, clientY: 420, bubbles: true, cancelable: true })); });
  await sleep(1200); // let onZoomEnd settle + persistZoom POST complete
  const sPersist = await scale(page);
  await sleep(400);
  await mountDiagram(page);          // REMOUNT → :138 reads d.zoom from MODEL_STORE → setScale(persisted)
  const sRestored = await scale(page);
  R.persisted = Number(sPersist.toFixed(3)); R.restored = Number(sRestored.toFixed(3));
  R.reloadRestores = sPersist < 1 && Math.abs(sRestored - sPersist) < 0.05 && Math.abs(sRestored - 1) > 0.02; // restored the persisted ≠1 value
  if (i === 1) await page.screenshot({ path: OUT + '02-reload-restored.png' });

  await ctx.close();
  return R;
}

const browser = await ENGINE.launch({ headless: true, ...(process.env.WK ? {} : { args: ['--no-sandbox', '--ignore-certificate-errors'] }) });
const runs = [];
try { for (let i = 1; i <= 3; i++) runs.push(await runOnce(browser, i)); }
finally { await browser.close(); fs.writeFileSync(DFILE, BASELINE); console.log(`CLEANUP: ${DIAG.slice(0, 8)} restored=${fs.readFileSync(DFILE, 'utf8') === BASELINE}`); }

console.log('\n===== R33.7.1 zoom @390 iPhone-12 (DET-3x) =====');
runs.forEach((R, i) => console.log(`iter ${i + 1}: ${JSON.stringify(R)}`));
const g = k => runs.length === 3 && runs.every(R => R[k] === true);
const green = g('zoomOutGrows') && g('oneIsWhole') && g('reloadRestores') && g('visibleRender');
console.log(`\n(a) zoom-out grows canvas (<1): ${g('zoomOutGrows') ? 'GREEN' : 'RED'}`);
console.log(`(b) scale=1 whole-diagram: ${g('oneIsWhole') ? 'GREEN' : 'RED'}`);
console.log(`(c) reload restores persisted zoom (≠1): ${g('reloadRestores') ? 'GREEN' : 'RED'}`);
console.log('OVERALL R33.7.1:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
