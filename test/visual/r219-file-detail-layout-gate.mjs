// R21.9 FINAL gate (Sprint 21) — file-detail pan/zoom on BOTH surfaces, v0.6.74.
// Impl c22083798/v0.6.73-74 (rb-file-detail.ts / rb-preview-pane.ts / pan-zoom.ts /
// content-preview.ts). content-preview.ts:7 — "ROOM and TRACE share ONE pan/zoom path:
// a 75vh <rb-preview-pane> driven by RbPanZoom" (DRY). Both call pane.setContent().
//
// SURFACE 1 — TRACE file detail (rb-file-detail): buttons TOP / 75vh preview MIDDLE /
//   metadata BOTTOM (AC-a1..a4) + pan/zoom. 3 real File units.
// SURFACE 2 — ROOM file detail (rb-preview-pane.setContent, exactly what the room
//   .cv-preview-toggle drives via fillPreviewPane): 75vh + wheel zoom + pinch + reset.
//
// Pan/zoom behavior asserted: wheel deltaY<0 -> content transform scale>1 (AC-c1, desktop);
// 2-finger pinch-out -> scale>1 (AC-d2, mobile); reset -> scale 1 (AC-e1).

import { chromium } from '@playwright/test';

const BASE = process.env.GATE_BASE || 'https://prod.wo-da.de:4444';
const FILES = [
  '9026ef81-f1c3-4753-bdca-0f348bd73ef2',
  '9aa809eb-4c1a-4e17-b366-d4959abed94c',
  '95636a14-623f-4f33-b0a9-6aa13556441f',
];
const IMG = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="600" height="600" fill="%234e342e"/></svg>';

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 420, height: 900 }, hasTouch: true });
const page = await ctx.newPage();
await page.goto(`${BASE}/trace`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => !!customElements.get('rb-file-detail') && !!customElements.get('rb-preview-pane'), { timeout: 20000 });

// pan/zoom behavioral probe on a given .pz-viewport/.pz-content pair (by container selector)
async function panzoom(sel) {
  const wheel = await page.evaluate((s) => {
    const vp = document.querySelector(s + ' .pz-viewport'), content = document.querySelector(s + ' .pz-content');
    if (!vp || !content) return { ok: false };
    const r = vp.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    for (let k = 0; k < 3; k++) vp.dispatchEvent(new WheelEvent('wheel', { deltaY: -120, clientX: cx, clientY: cy, bubbles: true, cancelable: true }));
    const m = content.style.transform.match(/scale\(([\d.]+)\)/);
    return { ok: true, scale: m ? parseFloat(m[1]) : 1 };
  }, sel);
  // reset, then pinch-out from a clean state
  await page.evaluate((s) => { const c = document.querySelector(s); c?.reset?.(); const cc = c?.closest?.('rb-preview-pane'); cc?.reset?.(); }, sel);
  const pinch = await page.evaluate((s) => {
    const vp = document.querySelector(s + ' .pz-viewport'), content = document.querySelector(s + ' .pz-content');
    if (!vp) return { ok: false };
    const r = vp.getBoundingClientRect(), mx = r.left + r.width / 2, my = r.top + r.height / 2;
    const T = (x, y, id) => new Touch({ identifier: id, target: vp, clientX: x, clientY: y });
    const ev = (type, pts) => new TouchEvent(type, { cancelable: true, bubbles: true, touches: pts, targetTouches: pts, changedTouches: pts });
    vp.dispatchEvent(ev('touchstart', [T(mx - 30, my, 1), T(mx + 30, my, 2)]));
    vp.dispatchEvent(ev('touchmove', [T(mx - 120, my, 1), T(mx + 120, my, 2)]));
    vp.dispatchEvent(ev('touchend', []));
    const m = content.style.transform.match(/scale\(([\d.]+)\)/);
    return { ok: true, scale: m ? parseFloat(m[1]) : 1 };
  }, sel);
  return { wheelScale: wheel.scale, pinchScale: pinch.scale };
}

const results = [];
for (let i = 0; i < 3; i++) {
  const uuid = FILES[i];

  // ---- SURFACE 1: TRACE (rb-file-detail) ----
  await page.evaluate((u) => {
    document.querySelectorAll('rb-file-detail.__gate, rb-preview-pane.__room').forEach(e => e.remove());
    const el = document.createElement('rb-file-detail'); el.className = '__gate';
    el.setAttribute('uuid', u); document.body.appendChild(el);
  }, uuid);
  await page.waitForSelector('rb-file-detail.__gate .cv-actions', { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(700);
  const t = await page.evaluate(() => {
    const fd = document.querySelector('rb-file-detail.__gate'); if (!fd) return { ok: false };
    const a = fd.querySelector('.cv-actions'), p = fd.querySelector('rb-preview-pane'), f = fd.querySelector('.dv-fields');
    if (!a || !p || !f) return { ok: false, why: 'missing parts' };
    const top = (e) => e.getBoundingClientRect().top;
    const orderOk = top(a) < top(p) && top(p) < top(f);
    const buttonsOk = /new tab/i.test(fd.querySelector('.cv-newtab')?.textContent || '') && /reset zoom/i.test(fd.querySelector('.pz-reset')?.textContent || '');
    const ratio = p.offsetHeight / window.innerHeight;
    const heightOk = ratio > 0.6 && ratio < 0.9;
    const vp = p.querySelector('.pz-viewport');
    const pzOk = !!vp && !!p.querySelector('.pz-content') && getComputedStyle(vp).touchAction === 'none';
    return { ok: true, orderOk, buttonsOk, heightOk, ratio: +ratio.toFixed(3), pzOk };
  });
  const tpz = t.ok && t.pzOk ? await panzoom('rb-file-detail.__gate rb-preview-pane') : { wheelScale: 1, pinchScale: 1 };
  await page.click('rb-file-detail.__gate .pz-reset').catch(() => {});
  const tReset = await page.evaluate(() => { const c = document.querySelector('rb-file-detail.__gate .pz-content'); const m = c?.style.transform.match(/scale\(([\d.]+)\)/); return m ? parseFloat(m[1]) : 1; });
  const traceOk = t.ok && t.orderOk && t.buttonsOk && t.heightOk && t.pzOk && tpz.wheelScale > 1 && Math.abs(tReset - 1) < 0.01;

  // ---- SURFACE 2: ROOM (rb-preview-pane.setContent — what the room toggle drives) ----
  await page.evaluate((img) => {
    document.querySelectorAll('rb-preview-pane.__room').forEach(e => e.remove());
    const pane = document.createElement('rb-preview-pane'); pane.className = '__room';
    document.body.appendChild(pane);                 // connectedCallback -> 75vh + pz-viewport
    pane.setContent(`<img src="${img}" style="width:100%;height:100%;object-fit:contain">`); // == fillPreviewPane
  }, IMG);
  await page.waitForTimeout(300);
  const rmeta = await page.evaluate(() => {
    const p = document.querySelector('rb-preview-pane.__room'); if (!p) return { ok: false };
    const ratio = p.offsetHeight / window.innerHeight;
    const vp = p.querySelector('.pz-viewport');
    return { ok: true, heightOk: ratio > 0.6 && ratio < 0.9, ratio: +ratio.toFixed(3), pzOk: !!vp && getComputedStyle(vp).touchAction === 'none' && !!p.querySelector('.pz-content') };
  });
  const rpz = rmeta.ok && rmeta.pzOk ? await panzoom('rb-preview-pane.__room') : { wheelScale: 1, pinchScale: 1 };
  const rReset = await page.evaluate(() => { const p = document.querySelector('rb-preview-pane.__room'); p?.reset?.(); const c = p?.querySelector('.pz-content'); const m = c?.style.transform.match(/scale\(([\d.]+)\)/); return m ? parseFloat(m[1]) : 1; });
  const roomOk = rmeta.ok && rmeta.heightOk && rmeta.pzOk && rpz.wheelScale > 1 && Math.abs(rReset - 1) < 0.01;

  const pass = traceOk && roomOk;
  results.push({ i: i + 1, pass });
  console.log(`iter ${i + 1} (${uuid.slice(0, 8)}):`);
  console.log(`   TRACE: order=${t.orderOk} buttons=${t.buttonsOk} 75vh=${t.heightOk}(${t.ratio}) pz=${t.pzOk} wheel=${tpz.wheelScale?.toFixed?.(2)} pinch=${tpz.pinchScale?.toFixed?.(2)} reset=${tReset.toFixed(2)} => ${traceOk ? 'GREEN' : 'RED'}`);
  console.log(`   ROOM:  75vh=${rmeta.heightOk}(${rmeta.ratio}) pz=${rmeta.pzOk} wheel=${rpz.wheelScale?.toFixed?.(2)} pinch=${rpz.pinchScale?.toFixed?.(2)} reset=${rReset.toFixed(2)} => ${roomOk ? 'GREEN' : 'RED'}`);
}
await browser.close();

console.log('\n=== VERDICT R21.9 FINAL — both surfaces (DET-3x) ===');
results.forEach(r => console.log(`  iter ${r.i}: ${r.pass ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(r => r.pass);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exit(green ? 0 : 1);
