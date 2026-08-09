// R33.7.1 CANVAS-GROW — RbPanZoom.onCanvasGrow/applyCanvasGrow (v0.8.31 fix 749b36335) @390, DET-3x independent.
// ★ The space-problem test the PO demanded — assert the SVG CANVAS DIMENSIONS GROW IN PX on zoom-out (surface scrollWidth/
// height + .dm-svg px INCREASE), and BOXES KEEP THEIR VISUAL PX SIZE. A scale-only pass (currentScale<1) = FALSE-GREEN (the
// exact miss last time): CSS-shrink makes boxes tiny with no new room. The fix: growMode → at scale<1 the host grows the SVG
// (width/height=base/scale, viewBox grows 1:1 → 1 unit=1px) so the surface (overflow:auto) native-scrolls a BIGGER canvas and
// boxes render at the SAME px. UNREGRESSED: magnify (>=1) = CSS scale + canvas reset to base; persist→remount restore.
// GUARD the CLIENT BUNDLE (SW rawbin-v0.8.31 == committed model-*.js), NOT /api/config (client-only fix, lags).
// [test:uuid:7c3e9a10-4d21-4f8b-9a6e-1b52c8d70f34] R33.7.1 canvas-GROW RbDiagramDetail.applyCanvasGrow (Impl eb468578, DISTINCT
// from setScale 301b71d4 — avoids scale-vs-canvas conflation) @390 DET-3x: zoom-out GROWS the SVG canvas in PX (svgW/scroll-area
// ↑ ~1/scale, 390→876) while a box does NOT shrink (160→180, scale-only would halve to ~80); magnify>=1 resets intrinsic dims
// (svg.style.width='' + overflow:hidden) + CSS-scales; persist→restore unregressed. Measures PX (scale-only = the space false-green).
import fs from 'node:fs'; import path from 'node:path';
import { chromium, devices } from '@playwright/test';
const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin', BASE = 'https://prod.wo-da.de:4444';
const DIAG = 'faa4acad-41a6-48fc-ad0d-dd0044c123f7';
const DFILE = path.join(ROOT, 'data/model-store/index', ...DIAG.slice(0, 5).split(''), `${DIAG}.scenario.json`);
const DIST = path.join(ROOT, 'src/public/dist');
const BUNDLE = '/dist/' + fs.readdirSync(DIST).filter(f => /^model-.*\.js$/.test(f)).map(f => [f, fs.statSync(path.join(DIST, f)).mtimeMs]).sort((a, b) => b[1] - a[1])[0][0];
const SWCACHE = (fs.readFileSync(path.join(ROOT, 'src/public/sw.js'), 'utf8').match(/CACHE_NAME\s*=\s*'([^']+)'/) || [])[1];
const OUT = path.join(ROOT, 'test-results/r371b-grow') + '/'; fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const BASELINE = fs.readFileSync(DFILE, 'utf8');
console.log(`bundle=${BUNDLE} SW=${SWCACHE} (client-bundle guard, not /api/config)`);

async function mkPage(browser) {
  const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/trace`, { waitUntil: 'domcontentloaded' });
  await page.addScriptTag({ url: BUNDLE, type: 'module' }).catch(() => {});
  await page.waitForFunction(() => !!customElements.get('rb-diagram-detail'), { timeout: 15000 }).catch(() => {});
  return { ctx, page };
}
async function mountDiagram(page) {
  await page.evaluate((u) => { const old = document.getElementById('dg'); if (old) old.remove(); const d = document.createElement('rb-diagram-detail'); d.id = 'dg'; d.setAttribute('ref', `diagram:${u}`); d.setAttribute('uuid', u); d.style.cssText = 'display:block;position:fixed;inset:0;background:#0d1117'; document.body.appendChild(d); }, DIAG);
  await page.waitForFunction(() => { const e = document.querySelector('#dg'); return e && e.pz && document.querySelector('#dg .dm-box') && document.querySelector('#dg .dm-svg'); }, { timeout: 12000 }).catch(() => {});
  await sleep(900);
}
// px snapshot: surface scroll-area + svg px + FIRST box VISUAL size (getBoundingClientRect) + content transform + scale
const snap = (page) => page.evaluate(() => {
  const e = document.querySelector('#dg'), surf = e.querySelector('.dm-surface'), svg = e.querySelector('.dm-svg'), box = e.querySelector('.dm-box');
  const br = box.getBoundingClientRect();
  return { scale: e.pz.currentScale, scrollW: surf.scrollWidth, scrollH: surf.scrollHeight, svgW: svg.getBoundingClientRect().width, svgStyleW: svg.style.width, overflow: surf.style.overflow, boxW: Math.round(br.width), boxH: Math.round(br.height), transform: getComputedStyle(e.querySelector('.dm-content')).transform };
});

async function runOnce(browser, i) {
  fs.writeFileSync(DFILE, BASELINE);
  const { ctx, page } = await mkPage(browser);
  const R = {};
  await mountDiagram(page);
  await page.evaluate(() => document.querySelector('#dg').pz.setScale(1)); await sleep(250);
  const base = await snap(page);

  // (a) ZOOM-OUT to 0.5 → SVG canvas GROWS IN PX (svgW/scrollW ~1/scale) + box does NOT SHRINK (scale-only would halve it)
  await page.evaluate(() => document.querySelector('#dg').pz.setScale(0.5)); await sleep(400);
  const out = await snap(page);
  R.canvasGrewPx = out.svgW > base.svgW * 1.4 || out.scrollW > base.scrollW * 1.4; // SVG px / scroll-area grew ~1/scale (≈2×)
  R.boxDoesntShrink = out.boxW >= base.boxW * 0.8 && out.boxH >= base.boxH * 0.8; // NOT scale-only (that would give ~0.5× = box halved)
  R.px = `base svgW=${base.svgW} sW=${base.scrollW} boxW=${base.boxW} → out svgW=${out.svgW} sW=${out.scrollW} boxW=${out.boxW}`;
  if (i === 1) await page.screenshot({ path: OUT + '01-zoom-out-grown.png' });

  // (b) MAGNIFY (>=1) UNREGRESSED: CSS scale (transform≠identity) + SVG canvas RESET to base (grow path only <1)
  await page.evaluate(() => document.querySelector('#dg').pz.setScale(2)); await sleep(300);
  const mag = await snap(page);
  R.magnifyCss = mag.transform !== 'none' && mag.transform !== base.transform; // content CSS-scaled at >=1
  R.canvasResetOnMagnify = mag.svgStyleW === '' && mag.overflow === 'hidden'; // intrinsic SVG dims reset to base (grow cleared); magnify is CSS-transform only. (getBoundingClientRect reflects the 2× CSS transform, so measure the STYLE not the rendered box.)
  R.magPx = `svgStyleW='${mag.svgStyleW}' overflow=${mag.overflow} transform=${(mag.transform || '').slice(0, 16)}`;

  // (c) PERSIST → REMOUNT RESTORE (unregressed): user wheel-zoom settles → onZoomEnd persists → remount restores
  await page.evaluate(() => document.querySelector('#dg').pz.setScale(1)); await sleep(150);
  await page.evaluate(() => { const s = document.querySelector('#dg .dm-surface'); for (let k = 0; k < 6; k++) s.dispatchEvent(new WheelEvent('wheel', { deltaY: 150, clientX: 195, clientY: 420, bubbles: true, cancelable: true })); });
  await sleep(1300); const sPersist = (await snap(page)).scale; await sleep(300);
  await mountDiagram(page); const sRestored = (await snap(page)).scale;
  R.persistRestores = sPersist < 1 && Math.abs(sRestored - sPersist) < 0.06 && Math.abs(sRestored - 1) > 0.02;
  R.persistPx = `persist=${sPersist} restored=${sRestored}`;

  await ctx.close();
  return R;
}

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const runs = [];
try { for (let i = 1; i <= 3; i++) runs.push(await runOnce(browser, i)); }
finally { await browser.close(); fs.writeFileSync(DFILE, BASELINE); console.log(`CLEANUP restored=${fs.readFileSync(DFILE, 'utf8') === BASELINE}`); }

console.log('\n===== R33.7.1 CANVAS-GROW @390 iPhone-12 (DET-3x) =====');
runs.forEach((R, i) => console.log(`iter ${i + 1}: ${JSON.stringify(R)}`));
const g = k => runs.length === 3 && runs.every(R => R[k] === true);
const green = g('canvasGrewPx') && g('boxDoesntShrink') && g('magnifyCss') && g('canvasResetOnMagnify') && g('persistRestores');
console.log(`\n(a) CANVAS GROWS IN PX on zoom-out (not scale-only): ${g('canvasGrewPx') && g('boxDoesntShrink') ? 'GREEN' : 'RED'}`);
console.log(`(b) magnify>=1 CSS-scale + canvas reset (unregressed): ${g('magnifyCss') && g('canvasResetOnMagnify') ? 'GREEN' : 'RED'}`);
console.log(`(c) persist→restore (unregressed): ${g('persistRestores') ? 'GREEN' : 'RED'}`);
console.log('OVERALL R33.7.1 canvas-grow:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
