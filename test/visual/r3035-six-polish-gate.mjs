// [test:uuid:1e6a4c93-7d25-4b80-9f31-6c08e5b2a4f7] R30.35 SIX polish fixes (independent close, v0.7.59). (A+D) ribbons CONTENT-BOUNDED — clean horizontal rectangles, no spanning empty/blank rows (_maxH centerLen-aware). (B) jumpToChange(1) walks ALL kinds, never skips (dead jumpToNextUnresolved removed). (C) NO false 'File not found' in 3-way (isDiffMode gate). (E) de-count = single 'X/Y open conflicts'. (F) a one-sided change shows its ✕ (per-side in-center gate) then ≫/≪ to re-add.
// GATE (DET-3x, screenshot + SVG-geometry + pixel + the feature's displayed text, NOT DOM element-count). Real otmux 3-way deep-link for A/B/C/E; synthetic all-4-kinds fixture for F (deterministic one-sided).
import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import fs from 'fs';
const BASE = 'https://prod.wo-da.de:4444';
const DEEP = `${BASE}/edit/otmux?repo=oosh&left=516ebb3&right=dev&3way=1`;
const OUT = new URL('../../test-results/r3035-sixpolish/', import.meta.url).pathname;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const F = { base: ['=fixhdr=', 'line-modify-BASE', 'mid-1', 'line-delete-BASE', 'mid-2', 'mid-3', 'line-conflict-BASE', '=fixftr='].join('\n'),
  left: ['=fixhdr=', 'line-modify-LEFTCHANGE', 'mid-1', 'line-delete-BASE', 'mid-2', 'line-added-by-LEFT', 'mid-3', 'line-conflict-LEFTSIDE', '=fixftr='].join('\n'),
  right: ['=fixhdr=', 'line-modify-BASE', 'mid-1', 'mid-2', 'mid-3', 'line-conflict-RIGHTSIDE', '=fixftr='].join('\n') };

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
try { fs.mkdirSync(OUT, { recursive: true }); } catch {}
const results = [];
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1500, height: 950 } });
    await seedSystemTester(ctx); const page = await ctx.newPage();
    await page.goto(DEEP, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => { const e = document.querySelector('rb-diff-editor'); return e?.left?.content?.length > 0 && e['edCenter'] && (e['conflicts'] || []).length > 3; }, { timeout: 20000 }).catch(() => {});
    await sleep(1500);
    if (i === 1) await page.screenshot({ path: OUT + 'diff.png' }).catch(() => {});

    // (A+D) ribbons content-bounded: each ribbon's Y-height ≈ its content rows × lineHeight, NOT spanning blank rows
    const ad = await page.evaluate(() => {
      const e = document.querySelector('rb-diff-editor'); const live = (e['conflicts'] || []).filter(c => !(e['dismissed'] && e['dismissed'].has(c.id)));
      const lh = Math.max(1, e['lineY'](e['edCenter'], 2) - e['lineY'](e['edCenter'], 1));
      const paths = [...(e.querySelector('.de-ribbons')?.querySelectorAll('path') || [])];
      let worst = 0, n = 0;
      live.forEach((c, idx) => { const d = paths[idx] ? (paths[idx].getAttribute('d') || '') : ''; const ys = [...d.matchAll(/[MLC][\d.]+,([\d.]+)/g)].map(m => parseFloat(m[1])); if (!ys.length) return;
        const hRows = (Math.max(...ys) - Math.min(...ys)) / lh; const contentRows = Math.max(c.incl.a ? c.a.length : 0, c.incl.b ? c.b.length : 0, (c.incl.a ? c.a.length : 0) + (c.incl.b ? c.b.length : 0)); const ratio = hRows / Math.max(contentRows, 1); if (ratio > worst) worst = ratio; n++; });
      return { worstRatio: Math.round(worst * 100) / 100, n, lh: Math.round(lh) };
    });
    const cAD = ad.n > 0 && ad.worstRatio <= 1.6; // no ribbon over-spans its content by >60% (i.e. not spanning blank rows)

    // (B) jumpToChange(1) walks ALL kinds, never skips — on the synthetic all-4-kinds fixture (a real diff is 61 changes;
    // sampling a prefix would undersample the rarer kinds). N jumps over N changes visit N distinct ids covering EVERY kind.
    await page.evaluate(async ({ b, l, r }) => { const e = document.querySelector('rb-diff-editor'); e.left = { path: 'fx.txt', ref: 'L', repo: '', content: l }; e.right = { path: 'fx.txt', ref: 'R', repo: '', content: r }; e['edLocal'].setValue(l); e['edRemote'].setValue(r); e['resolveBase'] = async () => b; await e['computeMergedCenter'](); }, { b: F.base, l: F.left, r: F.right });
    await sleep(600);
    const b = await page.evaluate(() => {
      const e = document.querySelector('rb-diff-editor'); const live = (e['conflicts'] || []); const N = live.length;
      e['_jumpIdx'] = -1; const visited = []; const kinds = new Set();
      for (let k = 0; k < N; k++) { e['jumpToChange'](1); visited.push(e['_currentId']); const c = live.find(x => x.id === e['_currentId']); if (c) kinds.add(c.kind); }
      const distinct = new Set(visited).size; const allKinds = [...new Set(live.map(c => c.kind))];
      return { N, distinct, noSkip: distinct === N && N >= 4, kindsHit: [...kinds], allKinds, coversAll: allKinds.length >= 4 && allKinds.every(k => kinds.has(k)) };
    });
    const cB = b.noSkip && b.coversAll;

    // (C) NO false 'File not found' in 3-way mode
    const cC = await page.evaluate(() => !document.body.innerText.includes('File not found'));

    // (E) de-count = single 'X/Y open conflicts' (no old dual 'N changes·K to resolve' / 'M conflicts to resolve')
    const countText = await page.evaluate(() => document.querySelector('rb-diff-editor .de-count')?.textContent || '');
    const cE = /^\d+\/\d+ open conflict/.test(countText.trim()) && !/to resolve/i.test(countText) && !/changes\s*·/i.test(countText);

    // (F) one-sided change: ✕ on its in-center side, then ≫/≪ add-back — on the synthetic fixture (deterministic add/delete)
    await page.evaluate(async ({ b, l, r }) => { const e = document.querySelector('rb-diff-editor'); e.left = { path: 'fx.txt', ref: 'L', repo: '', content: l }; e.right = { path: 'fx.txt', ref: 'R', repo: '', content: r }; e['edLocal'].setValue(l); e['edRemote'].setValue(r); e['resolveBase'] = async () => b; await e['computeMergedCenter'](); }, { b: F.base, l: F.left, r: F.right });
    await sleep(700);
    const f = await page.evaluate(() => {
      const e = document.querySelector('rb-diff-editor'); const add = (e['conflicts'] || []).find(c => /add/i.test(c.kind)); if (!add) return { ok: false, why: 'no-add' };
      const hasRm = !!document.querySelector(`[data-cid="${add.id}"][data-act="rm-left"]`) || !!document.querySelector(`[data-cid="${add.id}"][data-act="rm-right"]`);
      const rm = document.querySelector(`[data-cid="${add.id}"][data-act="rm-left"]`); if (rm) rm.click();
      return { id: add.id, kind: add.kind, hasRmBefore: hasRm };
    });
    await sleep(400);
    const fAfter = await page.evaluate((id) => { const e = document.querySelector('rb-diff-editor'); const c = (e['conflicts'] || []).find(x => x.id === id); return { addBack: !!document.querySelector(`[data-cid="${id}"][data-act="add-left"]`) || !!document.querySelector(`[data-cid="${id}"][data-act="add-right"]`), inclA: c?.incl.a }; }, f.id);
    const cF = f.hasRmBefore && fAfter.addBack;

    const pass = cAD && cB && cC && cE && cF;
    results.push(pass);
    console.log(`iter ${i}: (A+D)content-bounded=${cAD}(worst ${ad.worstRatio}x lh${ad.lh}) | (B)walk-all=${cB}(distinct ${b.distinct}/${b.N} covers=${b.coversAll} kinds=${b.kindsHit}) | (C)no-FileNotFound=${cC} | (E)single-count=${cE}("${countText.trim()}") | (F)1sided ✕→add-back=${cF}(rm=${f.hasRmBefore} addback=${fAfter.addBack}) => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }
} finally { await browser.close(); }
console.log('\n===== R30.35 six polish fixes A/B/C/D/E/F (DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
