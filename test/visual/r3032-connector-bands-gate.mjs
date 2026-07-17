// [test:uuid:6b1d4e83-5a29-4c7f-9e14-8d3f0a72c561] R30.32 IntelliJ connector bands + box-outlines. renderConnectorRibbons (5051b2a4) draws a filled SVG band Local↔Center where a change has local lines (a>0) and Center↔Repository where it has repo lines (b>0) — so a MODIFICATION (a>0 && b>0) shows BOTH bands, a one-sided INSERTION shows ONE. R30.32 also boxes each change block with a de-block-outline-<kind> inset border in ALL 3 panes (center via renderCenterChangeBlocks, Local/Repository via renderSideChangeBlocks). Tron "WE NEED THESE".
// Gate (DET-3x, deep-link 516ebb3/dev 3-way): (1) L↔C + C↔R connector bands present, band width >20px; (2) box-outline elements on change blocks in all 3 panes; (3) modification=both-bands / insertion=one-band (band count == Σ (a>0)+(b>0) over non-dismissed conflicts, ≥1 of each kind); (4) ribbon SVG pointer-events:none + re-rendered after scroll (scroll-tracked). SystemTester-only, read-only.
import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
const BASE = 'https://prod.wo-da.de:4444';
const DEEP = `${BASE}/edit/otmux?repo=oosh&left=516ebb3&right=dev&3way=1`;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const measure = (page) => page.evaluate(() => {
  const e = document.querySelector('rb-diff-editor');
  if (!e || !e['edLocal'] || !e['edCenter'] || !e['edRemote']) return { ok: false, reason: 'editors missing' };
  const panes = e.querySelector('.de-panes'); const svg = e.querySelector('.de-ribbons');
  if (!panes || !svg) return { ok: false, reason: 'no .de-panes/.de-ribbons' };
  const pr = panes.getBoundingClientRect();
  const mrect = (m) => { const el = e['mount'](m); const r = el.getBoundingClientRect(); return { left: r.left - pr.left, right: r.right - pr.left }; };
  const L = mrect('local'), C = mrect('center'), R = mrect('remote');
  // parse each band path: x1 = M coord, x2 = L coord → width + which gutter
  const paths = [...svg.querySelectorAll('path')].map(p => { const d = p.getAttribute('d') || '';
    const x1 = parseFloat((d.match(/^M([\d.]+)/) || [])[1]), x2 = parseFloat((d.match(/L([\d.]+)/) || [])[1]);
    const w = Math.abs(x2 - x1), mid = (x1 + x2) / 2; return { x1, x2, w, gutter: mid < C.left ? 'LC' : (mid > C.right ? 'CR' : '?'), fill: p.getAttribute('fill-opacity'), stroke: p.getAttribute('stroke-width') }; });
  const lc = paths.filter(p => p.gutter === 'LC'), cr = paths.filter(p => p.gutter === 'CR');
  // expected band count from conflicts (origin-gated): a>0 → LC band, b>0 → CR band
  const live = (e['conflicts'] || []).filter(c => !(e['dismissed'] && e['dismissed'].has(c.id)));
  const expectBands = live.reduce((n, c) => n + (c.a.length > 0 ? 1 : 0) + (c.b.length > 0 ? 1 : 0), 0);
  const modifications = live.filter(c => c.a.length > 0 && c.b.length > 0).length; // both bands
  const insertions = live.filter(c => (c.a.length > 0) !== (c.b.length > 0)).length; // one band
  // box-outlines in each pane's editor DOM
  const outlineCount = (m) => e['mount'](m).querySelectorAll('[class*="de-block-outline"]').length;
  const oL = outlineCount('local'), oC = outlineCount('center'), oR = outlineCount('remote');
  const pe = getComputedStyle(svg).pointerEvents;
  return { ok: true, twoWay: e['twoWay'], nConflicts: live.length, modifications, insertions, expectBands,
    nBands: paths.length, nLC: lc.length, nCR: cr.length, minW: paths.length ? Math.min(...paths.map(p => p.w)) : 0,
    oL, oC, oR, pe, sampleFill: paths[0] && paths[0].fill, sampleStroke: paths[0] && paths[0].stroke };
});

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const results = [];
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1600, height: 1000 } });
    await seedSystemTester(ctx); const page = await ctx.newPage();
    await page.goto(DEEP, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => { const e = document.querySelector('rb-diff-editor'); return e?.left?.content?.length > 0 && e?.right?.content?.length > 0 && e['edLocal'] && e['edCenter'] && e['edRemote']; }, { timeout: 20000 }).catch(() => {});
    await page.waitForFunction(() => { const s = document.querySelector('rb-diff-editor .de-ribbons'); return s && s.querySelectorAll('path').length > 0; }, { timeout: 20000 }).catch(() => {});
    await sleep(1500);
    const m = await measure(page);
    if (!m.ok) { results.push(false); console.log(`iter ${i}: SETUP-FAIL ${m.reason} => RED`); await ctx.close(); continue; }
    // (4) scroll-tracked: scroll center, re-measure → ribbons still present
    await page.evaluate(() => { const e = document.querySelector('rb-diff-editor'); e['edCenter'].setScrollTop(4000); });
    await sleep(700);
    const after = await page.evaluate(() => (document.querySelector('rb-diff-editor .de-ribbons')?.querySelectorAll('path').length) || 0);

    const c1 = m.nLC > 0 && m.nCR > 0 && m.minW > 20;                       // both gutters have bands, width >20px
    const c2 = m.oL > 0 && m.oC > 0 && m.oR > 0;                            // box-outlines in all 3 panes
    const c3 = m.nBands === m.expectBands && m.modifications > 0 && m.insertions > 0; // origin-gated both/one
    const c4 = m.pe === 'none' && after > 0;                                // pointer-events:none + survives scroll
    const pass = c1 && c2 && c3 && c4 && m.twoWay === false;
    results.push(pass);
    console.log(`iter ${i}: bands L↔C=${m.nLC} C↔R=${m.nCR} minW=${m.minW}px [${c1}] | outlines L/C/R=${m.oL}/${m.oC}/${m.oR} [${c2}] | bands=${m.nBands}==exp${m.expectBands} mod=${m.modifications} ins=${m.insertions} [${c3}] | pe=${m.pe} scroll→${after}paths [${c4}] => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }
} finally { await browser.close(); }

console.log('\n===== R30.32 connector bands + box-outlines (DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
