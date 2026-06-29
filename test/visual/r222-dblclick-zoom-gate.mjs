// R22.2 gate — desktop double-CLICK toggles pan/zoom like double-TAP: dblclick zooms 2x
// at the point, dblclick again resets to 1x. Mirrors pan-zoom.ts doubleTapToggle (AC-d3)
// onto the mouse `dblclick` event. Target: v0.6.76.
//
// Surface: the shared 75vh rb-preview-pane (RbPanZoom) used by BOTH room + trace previews.
// Mount it, setContent an image, dispatch dblclick at viewport center:
//   1st dblclick -> content transform scale ~2 (zoom-about-point)
//   2nd dblclick -> scale ~1 (reset)
// DET-3x. On v0.6.75 (no dblclick handler) this is RED (scale stays 1) — the measured baseline.

import { chromium } from '@playwright/test';

const BASE = process.env.GATE_BASE || 'https://prod.wo-da.de:4444';
const IMG = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="600" height="600" fill="%234e342e"/></svg>';

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const page = await (await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 480, height: 900 } })).newPage();
await page.goto(`${BASE}/trace`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => !!customElements.get('rb-preview-pane'), { timeout: 20000 });

const scaleOf = () => page.evaluate(() => {
  const c = document.querySelector('rb-preview-pane.__r222 .pz-content');
  const m = c && c.style.transform.match(/scale\(([\d.]+)\)/);
  return m ? parseFloat(m[1]) : 1;
});
const dblclickCenter = () => page.evaluate(() => {
  const vp = document.querySelector('rb-preview-pane.__r222 .pz-viewport');
  const r = vp.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  // a faithful dblclick: paired mousedown/up + click, then the dblclick
  for (const type of ['mousedown', 'mouseup', 'click', 'mousedown', 'mouseup', 'click', 'dblclick'])
    vp.dispatchEvent(new MouseEvent(type, { clientX: cx, clientY: cy, bubbles: true, cancelable: true, view: window }));
});

const results = [];
for (let run = 1; run <= 3; run++) {
  await page.evaluate((img) => {
    document.querySelectorAll('.__r222').forEach(e => e.remove());
    const p = document.createElement('rb-preview-pane'); p.className = '__r222';
    document.body.appendChild(p);
    p.setContent(`<img src="${img}" style="width:100%;height:100%;object-fit:contain">`);
  }, IMG);
  await page.waitForTimeout(250);

  const s0 = await scaleOf();                 // expect 1
  await dblclickCenter(); await page.waitForTimeout(200);
  const s1 = await scaleOf();                 // expect ~2 (zoom in)
  await dblclickCenter(); await page.waitForTimeout(200);
  const s2 = await scaleOf();                 // expect ~1 (reset)

  const zoomOk = s1 > 1.5;                     // 2x (allow tolerance)
  const resetOk = Math.abs(s2 - 1) < 0.05;
  const pass = Math.abs(s0 - 1) < 0.01 && zoomOk && resetOk;
  results.push(pass);
  console.log(`run ${run}: s0=${s0.toFixed(2)} -> dblclick -> s1=${s1.toFixed(2)} (zoom2x=${zoomOk}) -> dblclick -> s2=${s2.toFixed(2)} (reset1x=${resetOk}) => ${pass ? 'GREEN' : 'RED'}`);
}
await browser.close();

console.log('\n=== VERDICT R22.2 (DET-3x) ===');
results.forEach((p, i) => console.log(`  run ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED (expected on <v0.6.76 — no dblclick handler yet)');
process.exit(green ? 0 : 1);
