// [test:uuid:919d290d-e917-4cd1-a927-48470b582469] R30.52 toolbar re-layout (impl-edit on renderMergeGutter e24dc98a) — 'N selected' INLINE same row as ✨ Apply All + ▲▼ (no wrap), 'X/Y open conflicts' SPAN buffer between ▼ and ✓ (non-adjacent), whole toolbar ONE row (~32px). GREEN DET-3x v0.7.75 (RED→GREEN from the rejected v0.7.74 wrap). Distinct R30.52-layout Test on e24dc98a alongside 8fa42d89 (structural) + 0866205d (R30.50-A).
// R30.52 toolbar re-layout gate — REFINED AC (Tron REJECTED v0.7.74: 'N selected' WRAPPED to a 2nd line under Apply All).
// Tron's real 3-way deep-link, DOM-order + geometry at Tron viewport, DET-3x, screenshot. Impl-edit on renderMergeGutter e24dc98a.
//  (1) 'N selected' is INLINE — same ROW as ✨ Apply All + ▲▼ (vertically aligned, NOT a 2nd line under Apply All / no wrap).
//  (2) 'X/Y open conflicts' (.de-open-count) stays BETWEEN ▼ (.de-jump-next) and ✓ (.de-resolve) — non-clickable SPAN buffer,
//      ▼ and ✓ NOT adjacent (correct in v0.7.74, must stay).
//  (3) the WHOLE toolbar is ONE row — no linebreak (all key controls share one row; toolbar height ≈ single line).
// STATUS: RED on v0.7.74 (the rejected wrap) → flips GREEN on the corrected inline build. Read-only. DET-3x.
import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
const BASE = 'https://prod.wo-da.de:4444';
const DEEP = `${BASE}/edit/otmux?repo=oosh&left=mcdonges.latest&right=dev&3way=1`;
const OUT = 'test-results/r3052-toolbar';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const read = (page) => page.evaluate(() => {
  const e = document.querySelector('rb-diff-editor'); const q = s => e.querySelector(s);
  const r = el => { if (!el) return null; const b = el.getBoundingClientRect(); return { top: b.top, bottom: b.bottom, left: b.left, right: b.right, h: b.height }; };
  const sel = q('.de-selected'), oc = q('.de-open-count'), next = q('.de-jump-next'), res = q('.de-resolve'), apply = q('.de-apply-all'), prev = q('.de-jump-prev'), tb = q('.de-toolbar');
  return {
    selText: (sel?.textContent || '').trim(), ocText: (oc?.textContent || '').trim(),
    selRect: r(sel), applyRect: r(apply), prevRect: r(prev), nextRect: r(next), ocRect: r(oc), resRect: r(res), tbRect: r(tb),
    nextSibIsOc: next?.nextElementSibling === oc, ocSibIsRes: oc?.nextElementSibling === res, nextSibIsRes: next?.nextElementSibling === res,
    ocTag: oc?.tagName, ocClickable: !!(oc?.onclick) || oc?.tagName === 'BUTTON',
    open: e?.openChangeCount?.(), total: e?.conflicts?.length, jumpIdx: e?._jumpIdx,
  };
});

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const rows = [];
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1300, height: 900 } });
    await seedSystemTester(ctx);
    const page = await ctx.newPage();
    await page.goto(DEEP, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => !!customElements.get('rb-diff-editor'), { timeout: 20000 }).catch(() => {});
    await page.waitForFunction(() => { const e = document.querySelector('rb-diff-editor'); return e?.conflicts?.length > 0 && e?.querySelector('.de-open-count')?.textContent; }, { timeout: 20000 }).catch(() => {});
    await sleep(500);
    await page.click('.de-jump-next').catch(() => {});   // ▼ nav → 'N selected' renders
    await sleep(500);
    const s = await read(page);
    if (i === 1) await page.screenshot({ path: `${OUT}/toolbar-refined-iter1.png`, clip: { x: 0, y: 0, width: 1300, height: 105 } }).catch(() => {});

    const cy = r => r ? (r.top + r.bottom) / 2 : null;   // vertical center
    // (1) 'N selected' INLINE — same row as Apply All (centers aligned) + NOT below it (no 2nd line / no wrap)
    const a1 = !!s.selRect && !!s.applyRect && /^\d+ selected$/.test(s.selText)
      && Math.abs(cy(s.selRect) - cy(s.applyRect)) <= 8          // same row as Apply All
      && s.selRect.top < s.applyRect.bottom - 2;                 // NOT a 2nd line stacked under Apply All (the rejected wrap)
    // (2) open-count SPAN buffer BETWEEN ▼ and ✓ (unchanged, must stay)
    const a2 = s.nextSibIsOc && s.ocSibIsRes && !s.nextSibIsRes && s.ocTag === 'SPAN' && !s.ocClickable
      && s.nextRect.right <= s.ocRect.left + 2 && s.ocRect.right <= s.resRect.left + 2;
    // (3) whole toolbar ONE row — all key controls share one row + toolbar height ≈ single line (no linebreak)
    const cys = [s.applyRect, s.selRect, s.prevRect, s.nextRect, s.ocRect, s.resRect].filter(Boolean).map(cy);
    const rowSpread = Math.max(...cys) - Math.min(...cys);
    const a3 = rowSpread <= 12 && !!s.tbRect && s.tbRect.h <= 40;   // one row (v0.7.74 wrap → selected below → spread big + taller toolbar)

    const pass = a1 && a2 && a3;
    rows.push(pass);
    console.log(`iter ${i}: (1)N-selected-INLINE=${a1}("${s.selText}" selCy=${s.selRect ? ((s.selRect.top + s.selRect.bottom) / 2).toFixed(0) : '?'} applyCy=${s.applyRect ? ((s.applyRect.top + s.applyRect.bottom) / 2).toFixed(0) : '?'}) | (2)open-count-between-▼-✓=${a2} | (3)one-row=${a3}(rowSpread=${rowSpread.toFixed(0)} tbH=${s.tbRect?.h?.toFixed(0)}) => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }
} finally { await browser.close(); }

console.log('\n===== R30.52 toolbar re-layout — REFINED AC (inline, one-row) DET-3x =====');
console.log(`  DET-3x: ${rows.map((p, i) => `${i + 1}:${p ? 'G' : 'R'}`).join(' ')}`);
const green = rows.length === 3 && rows.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x (N-selected INLINE same-row / open-count between ▼-✓ / whole toolbar one row)' : 'RED (v0.7.74 rejected-wrap, or not-yet-corrected)');
process.exitCode = green ? 0 : 1;
