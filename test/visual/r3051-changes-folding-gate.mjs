// [test:uuid:65cb5a36-1fb6-42d1-bf83-319600012d79] R30.51 Fold1 RbDiffEditor.applyChangesOnlyFolding (Impl 9493c08a) — on load all non-change gaps collapsed, only change regions visible (ruler jumps, 30/4004 lines), '▸ ⋯ N lines' chevrons. GREEN DET-3x @390 mobile v0.7.77.
// [test:uuid:c42fceb6-01d5-470d-9969-2b369e5e15bf] R30.51 Fold2 RbDiffEditor.applyFold (Impl 2d7a0103) — one _collapsedGaps set → setHiddenAreas ×3 → tap a gap chevron reveals its lines in ALL 3 panes (Local/Center/Repository rulers all change) + chevron flips '▾'; re-collapse all 3. GREEN DET-3x @390 mobile.
// [test:uuid:6259acfb-c6ed-4de7-a543-f8299dbf169f] R30.51 Fold3 guard RbDiffEditor.computeFoldRegions (Impl 23b416c2) — K=0 gaps = non-change ranges ONLY; native folding OFF (no native fold markers) → change/conflict regions have NO chevron = structurally uncollapsible; change-blocks+ribbons+syntax coexist. GREEN DET-3x @390 mobile.
// R30.51 changes-focused folding gate — v0.7.77 (edit-MFCKJPNK.js). ★ 390px REAL MOBILE (iPhone 12, isMobile) per rule #6.
// ★ ANTI-CIRCULAR (expert 0.1 request): measure via the RENDERED line-number ruler (visible numbers JUMP where lines are hidden)
//   + rendered chevrons + config — NOT the expert's internal _collapsedGaps count. Impls computeFoldRegions 23b416c2 / applyFold
//   2d7a0103 / applyChangesOnlyFolding 9493c08a. folding:false → setHiddenAreas drives all folding → change regions uncollapsible.
//  (1) CHANGES-ONLY INITIAL: center ruler line-numbers JUMP (hidden gaps skipped) + span»count + '▸ ⋯ N lines' chevrons.
//  (2) FOLD SYNC ×3: tap a '▸' chevron → Local+Center+Repository rulers each reveal more lines + chevron flips '▾'; tap → re-collapse (all 3).
//  (3) GUARD: native folding OFF (no native fold markers) + chevrons are the ONLY fold affordance → change regions cannot collapse.
//  (4) COEXIST: change-blocks + connector ribbons + syntax tokens render over the folded view.
// DET-3x, PIXEL screenshots at 390 mobile.
import { chromium, devices } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
const BASE = 'https://prod.wo-da.de:4444';
const DEEP = `${BASE}/edit/otmux?repo=oosh&left=mcdonges.latest&right=dev&3way=1`;   // Tron's real URL (PO directive)
const OUT = 'test-results/r3051-iphone';
const IPHONE = devices['iPhone 12'];
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// RENDERED ruler line-numbers per pane (independent of the fold-intent set) + chevrons + config
const snap = (page) => page.evaluate(() => {
  const e = document.querySelector('rb-diff-editor');
  const nums = (ed) => { const dn = ed?.getDomNode?.(); if (!dn) return []; return [...dn.querySelectorAll('.line-numbers')].map(x => parseInt(x.textContent || '', 10)).filter(Number.isInteger).sort((a, b) => a - b); };
  const jumps = (a) => { let j = 0; for (let i = 1; i < a.length; i++) if (a[i] - a[i - 1] > 1) j++; return j; };
  const L = nums(e?.edLocal), C = nums(e?.edCenter), R = nums(e?.edRemote);
  const chev = [...document.querySelectorAll('rb-diff-editor div')].filter(d => getComputedStyle(d).cursor === 'pointer' && /line/.test(d.textContent || '') && (/▸/.test(d.textContent) || /▾/.test(d.textContent)));  // the exact clickable zone div (cursor:pointer), not parent/child wrappers
  let foldingOpt = null; try { foldingOpt = e?.edCenter?.getRawOptions?.().folding; } catch {}
  return {
    Ccount: C.length, Cspan: C.length ? C[C.length - 1] - C[0] : 0, Cjumps: jumps(C),
    Lcount: L.length, Rcount: R.length,
    collapsedChev: chev.filter(d => /▸/.test(d.textContent)).length, expandedChev: chev.filter(d => /▾/.test(d.textContent)).length,
    total: e?.edCenter?.getModel?.()?.getLineCount?.() ?? 0, foldingOpt, conflicts: e?.conflicts?.length ?? 0,
    nativeFoldMarkers: document.querySelectorAll('rb-diff-editor .codicon-folding-expanded, rb-diff-editor .codicon-folding-collapsed').length,
    blocks: document.querySelectorAll('rb-diff-editor [class*="de-block"]').length,
    ribbons: document.querySelectorAll('rb-diff-editor svg path').length,
    mtk: document.querySelectorAll('rb-diff-editor [class*="mtk"]').length,
  };
});

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const rows = [];
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ...IPHONE, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
    await seedSystemTester(ctx);
    const page = await ctx.newPage();
    await page.goto(DEEP, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => !!customElements.get('rb-diff-editor'), { timeout: 20000 }).catch(() => {});
    await page.waitForFunction(() => { const e = document.querySelector('rb-diff-editor'); return e?.conflicts?.length > 0 && [...document.querySelectorAll('rb-diff-editor div')].some(d => /▸/.test(d.textContent || '') && /line/.test(d.textContent)); }, { timeout: 20000 }).catch(() => {});
    await sleep(1200);
    if (i === 1) await page.screenshot({ path: `${OUT}/folding-initial-390.png` }).catch(() => {});

    const s0 = await snap(page);
    // (1) CHANGES-ONLY: center ruler JUMPS (hidden lines skipped) + shows a WIDE line range with FEW lines + chevrons present
    const A1 = s0.Cjumps > 0 && s0.Ccount > 0 && s0.Cspan > s0.Ccount * 2 && s0.collapsedChev > 0 && s0.total > 300;
    // (3) GUARD: native folding OFF + no native fold markers → the '▸' chevrons are the ONLY collapse affordance (gaps only), changes exist
    const A3 = s0.foldingOpt === false && s0.nativeFoldMarkers === 0 && s0.collapsedChev > 0 && s0.conflicts > 0;
    // (4) COEXIST over the fold: change blocks + ribbons + syntax tokens all render
    const A4 = s0.blocks > 0 && s0.ribbons > 0 && s0.mtk > 2;

    // (2) FOLD SYNC ×3: tap the TOP '▸' chevron → its gap expands (chevron flips '▾') → all 3 panes' rulers change (reveal). Read the
    //     rendered ruler arrays L/C/R before+after (independent of _collapsedGaps): a real 3-pane reveal changes all three.
    const before3 = await page.evaluate(() => { const e = document.querySelector('rb-diff-editor'); const n = ed => { const dn = ed?.getDomNode?.(); return dn ? [...dn.querySelectorAll('.line-numbers')].map(x => x.textContent).join(',') : ''; }; return { L: n(e?.edLocal), C: n(e?.edCenter), R: n(e?.edRemote) }; });
    const tapped = await page.evaluate(() => { const d = [...document.querySelectorAll('rb-diff-editor div')].filter(x => getComputedStyle(x).cursor === 'pointer' && /▸/.test(x.textContent || '') && /line/.test(x.textContent)).sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)[0]; if (!d) return false; d.click(); return true; });
    await sleep(900);
    const s1 = await snap(page);
    const after3 = await page.evaluate(() => { const e = document.querySelector('rb-diff-editor'); const n = ed => { const dn = ed?.getDomNode?.(); return dn ? [...dn.querySelectorAll('.line-numbers')].map(x => x.textContent).join(',') : ''; }; return { L: n(e?.edLocal), C: n(e?.edCenter), R: n(e?.edRemote) }; });
    const chevronFlipped = tapped && s1.collapsedChev === s0.collapsedChev - 1 && s1.expandedChev === s0.expandedChev + 1;   // exactly one gap toggled open
    const revealed3 = chevronFlipped && after3.L !== before3.L && after3.C !== before3.C && after3.R !== before3.R;            // all 3 rulers changed = 3-pane reveal
    if (i === 1) await page.screenshot({ path: `${OUT}/folding-expanded-390.png` }).catch(() => {});
    await page.evaluate(() => { const d = [...document.querySelectorAll('rb-diff-editor div')].filter(x => getComputedStyle(x).cursor === 'pointer' && /▾/.test(x.textContent || '') && /line/.test(x.textContent))[0]; d?.click(); });
    await sleep(800);
    const s2 = await snap(page);
    const recollapsed = s2.collapsedChev === s0.collapsedChev && s2.expandedChev === s0.expandedChev;   // back to all-collapsed
    const A2 = revealed3 && recollapsed;

    const pass = A1 && A2 && A3 && A4;
    rows.push(pass);
    console.log(`iter ${i} @390mobile: (1)changes-only=${A1}(Cvisible=${s0.Ccount} span=${s0.Cspan} jumps=${s0.Cjumps} chev=${s0.collapsedChev} total=${s0.total}) | (2)sync×3=${A2}(reveal L${s0.Lcount}→${s1.Lcount} C${s0.Ccount}→${s1.Ccount} R${s0.Rcount}→${s1.Rcount} ▾=${s1.expandedChev}; recollapse=${recollapsed}) | (3)guard=${A3}(nativeFold=${s0.foldingOpt} markers=${s0.nativeFoldMarkers}) | (4)coexist=${A4}(blk=${s0.blocks} rib=${s0.ribbons} mtk=${s0.mtk}) => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }
} finally { await browser.close(); }

console.log('\n===== R30.51 changes-focused folding @390 MOBILE, ruler-independent (DET-3x, v0.7.77) =====');
console.log(`  DET-3x: ${rows.map((p, i) => `${i + 1}:${p ? 'G' : 'R'}`).join(' ')}`);
const green = rows.length === 3 && rows.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x (changes-only ruler-jumps / fold syncs ×3 all panes / native-fold-off guard / coexist, @390 mobile)' : 'RED');
process.exitCode = green ? 0 : 1;
