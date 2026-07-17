// [test:uuid:9e4c1a67-3b82-4d05-a1f6-2c7e5b90d834] R30.34 responsive connector SPLINE — INDEPENDENT PIXEL gate (screenshot + pixel sampling, NEVER DOM-count; measured differently from the expert's orientation-probe). renderConnectorRibbons (5051b2a4) draws ONE continuous spline per change Local→Result→Repo: HORIZONTAL sweep on desktop (>820px, both inter-pane gutters filled) / VERTICAL left-margin flow when stacked (≤820px). fill-opacity 0.30 (the rejected boxes were 0.28 = near-identical, Tron called faint a defect).
// Asserts (DET-3x, both orientations): (1) STRUCTURE — desktop: a COLORED ribbon is present in BOTH the L↔C and C↔R gutters (spline sweeps ACROSS); mobile 390px: panes STACK (center below local) and a colored ribbon flows DOWN the left margin. (2) PROMINENCE — our ribbon-fill pixel vs its gutter bg, compared to the Rider TARGET's ribbon-vs-bg (diagrams/R30.32-TARGET-rider-merge-connectors.png): report both numbers + verdict (as-prominent vs FAINTER). Ribbon detection uses a CHROMA filter (max−min channel > 25) so gray line-number text is never mistaken for a colored ribbon. SystemTester-only, read-only.
import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import fs from 'fs';
const BASE = 'https://prod.wo-da.de:4444';
const DEEP = `${BASE}/edit/otmux?repo=oosh&left=516ebb3&right=dev&3way=1`;
const TARGET = new URL('../../scrum.pmo/sprints/sprint-30-traceability-improvement/diagrams/R30.32-TARGET-rider-merge-connectors.png', import.meta.url).pathname;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// scan a vertical column; among COLORED pixels (chroma>25) find the one most distant from the column median (bg) → the ribbon.
const sampleCol = (page, dataUrl, x, y0, y1) => page.evaluate(async ({ dataUrl, x, y0, y1 }) => {
  const img = new Image(); img.src = dataUrl; await img.decode();
  const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
  const ctx = cv.getContext('2d'); ctx.drawImage(img, 0, 0);
  const px = [];
  for (let y = y0; y < y1; y += 2) { if (x < 0 || x >= img.width || y < 0 || y >= img.height) continue; const p = ctx.getImageData(x, y, 1, 1).data; px.push([p[0], p[1], p[2]]); }
  if (px.length < 8) return null;
  const med = [0, 1, 2].map(i => { const s = px.map(p => p[i]).sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; });
  const chroma = (p) => Math.max(p[0], p[1], p[2]) - Math.min(p[0], p[1], p[2]);
  let best = null, bestD = 0;
  for (const p of px) { if (chroma(p) < 25) continue; const d = Math.sqrt((p[0]-med[0])**2 + (p[1]-med[1])**2 + (p[2]-med[2])**2); if (d > bestD) { bestD = d; best = p; } }
  return { ribbon: best, bg: med, prom: Math.round(bestD), n: px.length };
}, { dataUrl, x, y0, y1 });

async function ourOrientation(browser, width) {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width, height: 1000 } });
  await seedSystemTester(ctx); const page = await ctx.newPage();
  await page.goto(DEEP, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => { const e = document.querySelector('rb-diff-editor'); return e?.left?.content?.length > 0 && e?.right?.content?.length > 0 && e['edLocal'] && e['edCenter'] && e['edRemote']; }, { timeout: 20000 }).catch(() => {});
  await page.waitForFunction(() => { const s = document.querySelector('rb-diff-editor .de-ribbons'); return s && s.querySelectorAll('path').length > 0; }, { timeout: 20000 }).catch(() => {});
  await sleep(1800);
  const geo = await page.evaluate(() => { const e = document.querySelector('rb-diff-editor'); const m = (x) => { const r = e['mount'](x).getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom }; }; return { L: m('local'), C: m('center'), R: m('remote'), vh: innerHeight }; });
  const dataUrl = 'data:image/png;base64,' + (await page.screenshot()).toString('base64');
  const stacked = geo.C.t > geo.L.b - 2;
  let res;
  if (!stacked) { // desktop: sample both horizontal gutters
    const xLC = Math.round((geo.L.r + geo.C.l) / 2), xCR = Math.round((geo.C.r + geo.R.l) / 2);
    const y0 = Math.round(geo.C.t + 40), y1 = Math.round(Math.min(geo.C.b, geo.vh) - 20);
    const lc = await sampleCol(page, dataUrl, xLC, y0, y1), cr = await sampleCol(page, dataUrl, xCR, y0, y1);
    res = { stacked, lc, cr, sweepAcross: !!(lc && cr && lc.prom > 40 && cr.prom > 40), prom: Math.max(lc?.prom || 0, cr?.prom || 0) };
  } else { // mobile: left-margin vertical ribbon in the gap between stacked panes
    const xM = Math.round(geo.L.l + 7);
    const y0 = Math.round(geo.L.t + 40), y1 = Math.round(Math.min(geo.R.b, geo.vh) - 20);
    const mrib = await sampleCol(page, dataUrl, xM, y0, y1);
    res = { stacked, margin: mrib, flowsDown: !!(mrib && mrib.prom > 40), prom: mrib?.prom || 0 };
  }
  await ctx.close(); return res;
}

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const results = [];
try {
  // TARGET ribbon prominence — sample the Rider Local↔Result gutter column (a colored connector), once (static image)
  const tPage = await (await browser.newContext({ viewport: { width: 400, height: 400 } })).newPage();
  const tgt = 'data:image/png;base64,' + fs.readFileSync(TARGET).toString('base64');
  const tdim = await tPage.evaluate(async (d) => { const img = new Image(); img.src = d; await img.decode(); return { w: img.width, h: img.height }; }, tgt);
  let tProm = 0, tSample = null;
  for (const frac of [0.225, 0.235, 0.245, 0.255, 0.265, 0.70, 0.71, 0.72]) { const t = await sampleCol(tPage, tgt, Math.round(tdim.w * frac), Math.round(tdim.h * 0.13), Math.round(tdim.h * 0.93)); if (t && t.prom > tProm) { tProm = t.prom; tSample = t; } }
  console.log(`TARGET (Rider) best colored ribbon-vs-bg prominence = ${tProm}  (ribbon=${JSON.stringify(tSample?.ribbon)} bg=${JSON.stringify(tSample?.bg)})`);

  for (let i = 1; i <= 3; i++) {
    const d = await ourOrientation(browser, 1600);   // desktop
    const m = await ourOrientation(browser, 390);    // mobile
    const prominenceNotFainter = d.prom >= tProm * 0.85;
    const pass = d.sweepAcross === true && m.stacked === true && m.flowsDown === true && prominenceNotFainter;
    results.push(pass);
    console.log(`iter ${i}: DESKTOP sweep-across=${d.sweepAcross} (L↔C prom=${d.lc?.prom} C↔R prom=${d.cr?.prom}) | MOBILE stacked=${m.stacked} flows-down=${m.flowsDown} (margin prom=${m.margin?.prom}) | PROMINENCE ours=${d.prom} vs target=${tProm} → ${prominenceNotFainter ? 'as-prominent' : 'FAINTER'} => ${pass ? 'GREEN' : 'RED'}`);
  }
} finally { await browser.close(); }

console.log('\n===== R30.34 responsive spline — pixel gate, both orientations (DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
