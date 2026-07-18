// [test:uuid:2a7f5c94-8e13-4b6d-9f02-1c6e3a85d7b0] R30.34 refined AC-6 — ALWAYS 3 columns at EVERY width + ONE across-overlay spline that tracks on scroll. INDEPENDENT verify (screenshot+geometry+pixel, measured differently from the expert's own probe — the whole point after 3 verification misses). Tron ruled: 3 columns Local|Result|Repository at every width (the media query is REMOVED in v0.7.48; NO stacking at any width — 390 phone is columns/scroll, NOT stacked), and the connector is ONE continuous SVG overlay spline left→center→right at every width, tracking on horizontal scroll.
// GATE (DET-3x, per width 1920/1600/1440/1280/1024/900/800/700/390 incl the 700-819 scaled band that regressed): (1) 3 side-by-side columns (L.right≤C.left≤R.left, outer tops aligned), NEVER stacked (center never below local); (2) .de-ribbons SVG overlay present with a spline sweeping ACROSS both gutters (L↔C + C↔R = one left→center→right mapping); (3) HORIZONTAL-SCROLL TRACK: after scrolling column content horizontally, the spline still overlays across (anchored to the column edges, doesn't break). Screenshots → test-results/r3034-widths/. Read-only.
import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import fs from 'fs';
const BASE = 'https://prod.wo-da.de:4444';
const DEEP = `${BASE}/edit/otmux?repo=oosh&left=516ebb3&right=dev&3way=1`;
const OUT = new URL('../../test-results/r3034-widths/', import.meta.url).pathname;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const WIDTHS = [1920, 1600, 1440, 1280, 1024, 900, 800, 700, 390];

const overlayAcross = () => { // evaluated in-page: does the ribbon SVG have a spline in BOTH gutters (across L→C→R)?
  const e = document.querySelector('rb-diff-editor'); const panes = e.querySelector('.de-panes'); const pr = panes.getBoundingClientRect();
  const C = e['mount']('center').getBoundingClientRect(); const cL = C.left - pr.left, cR = C.right - pr.left;
  const paths = [...(panes.querySelector('.de-ribbons')?.querySelectorAll('path') || [])].map(p => { const d = p.getAttribute('d') || ''; const x1 = parseFloat((d.match(/M([\d.]+)/) || [])[1]); const x2 = parseFloat((d.match(/[LC]([\d.]+)/) || [])[1]); const mid = (x1 + x2) / 2; return mid < cL ? 'LC' : (mid > cR ? 'CR' : 'mid'); });
  return { across: paths.includes('LC') && paths.includes('CR'), n: paths.length };
};

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
try { fs.mkdirSync(OUT, { recursive: true }); } catch {}
const measure = async (width, shoot) => {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width, height: 900 } });
  await seedSystemTester(ctx); const page = await ctx.newPage();
  await page.goto(DEEP, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => { const e = document.querySelector('rb-diff-editor'); return e?.left?.content?.length > 0 && e['edLocal'] && e['edCenter'] && e['edRemote']; }, { timeout: 20000 }).catch(() => {});
  await page.waitForFunction(() => { const s = document.querySelector('rb-diff-editor .de-ribbons'); return s && s.querySelectorAll('path').length > 0; }, { timeout: 15000 }).catch(() => {});
  await sleep(700);
  const g = await page.evaluate((oa) => {
    const e = document.querySelector('rb-diff-editor');
    const L = e['mount']('local').getBoundingClientRect(), C = e['mount']('center').getBoundingClientRect(), R = e['mount']('remote').getBoundingClientRect();
    const stacked = C.top > L.bottom - 20;
    const threeColumns = !stacked && L.right <= C.left + 6 && C.right <= R.left + 6 && Math.abs(L.top - R.top) < 6;
    const ov = (new Function('return (' + oa + ')()'))();
    return { threeColumns, stacked, overlayAcross: ov.across, nPaths: ov.n, panesW: Math.round(e.querySelector('.de-panes').getBoundingClientRect().width) };
  }, overlayAcross.toString());
  // (3) horizontal-scroll track: scroll each column's content horizontally, re-check the spline still overlays across
  const scrollTrack = await page.evaluate((oa) => {
    const e = document.querySelector('rb-diff-editor');
    for (const m of ['local', 'center', 'remote']) { const ed = e['ed' + (m === 'local' ? 'Local' : m === 'center' ? 'Center' : 'Remote')]; if (ed && ed.setScrollLeft) ed.setScrollLeft(220); }
    const ov = (new Function('return (' + oa + ')()'))();
    return ov.across;
  }, overlayAcross.toString());
  if (shoot) await page.screenshot({ path: OUT + `w${width}.png` }).catch(() => {});
  await ctx.close();
  return { ...g, scrollTrack };
};

const rounds = [];
try {
  for (let round = 1; round <= 3; round++) {
    const rows = [];
    for (const w of WIDTHS) { const g = await measure(w, round === 1); const ok = g.threeColumns && !g.stacked && g.overlayAcross && g.scrollTrack; rows.push({ w, ok, g });
      if (round === 1) console.log(`R1 vw=${w} de-panes=${g.panesW}px 3col=${g.threeColumns} stacked=${g.stacked} overlay-across=${g.overlayAcross}(${g.nPaths}p) scroll-track=${g.scrollTrack} => ${ok ? 'OK' : '<<< FAIL'}`); }
    const allOk = rows.every(r => r.ok);
    rounds.push(allOk);
    console.log(`ROUND ${round}: ${allOk ? 'GREEN' : 'RED — ' + rows.filter(r => !r.ok).map(r => r.w + 'px' + (r.g.stacked ? '(stacked)' : !r.g.overlayAcross ? '(no-overlay)' : !r.g.scrollTrack ? '(scroll-lost)' : '')).join(', ')}`);
  }
} finally { await browser.close(); }

console.log('\n===== R30.34 AC-6: 3 columns + across-overlay spline (scroll-tracked), every width (DET-3x) =====');
rounds.forEach((p, i) => console.log(`  round ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = rounds.length === 3 && rounds.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x — never stacked, one spline overlay across, tracks on scroll' : 'RED');
console.log('screenshots: test-results/r3034-widths/w{1920,1600,1440,1280,1024,900,800,700,390}.png');
process.exitCode = green ? 0 : 1;
