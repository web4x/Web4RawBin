// [test:uuid:9b4e7c25-6f81-4a30-b5d2-8c1f3e07a964] Conflict-merge optimization (reconcile-corrected, derived + override) — resolution is DERIVED-primary (one version in center = resolved / both coexist = unresolved) with a MANUAL OVERRIDE (✓ force-resolves a 2-line KEEP-BOTH, or re-opens a 1-line); any ≫/≪/✕ re-derives. A 2-line both-versions change shows only ✕ (remove each side), a missing side shows its ≫/≪ add-back; dropping a side auto-resolves + AUTO-JUMPS to the next unresolved; openChangeCount = derived-unresolved minus overrides.
// GATE (DET-3x, screenshot+pixel for the ✓ solid state + feature model/count, NOT DOM element-count): synthetic all-4-kinds fixture (modify/conflict = 2-line both-versions; add/delete = one-sided). (1) a 2-line change offers BOTH ✕ (rm-left+rm-right), NO ≫/≪; (2) ✕ drops a side → 1 line → derived-RESOLVED (✓ solid) → auto-jump to next unresolved; (3) after the drop, that side's ≫/≪ add-back appears; (4) openChangeCount = 2-line-unresolved minus overrides, decrements correctly; (5) OVERRIDE: ✓ on a 2-line KEEP-BOTH → both lines REMAIN + ✓ solid + count decremented. Read-only vs prod (in-memory).
import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import fs from 'fs';
const BASE = 'https://prod.wo-da.de:4444';
const DEEP = `${BASE}/edit/otmux?repo=oosh&left=516ebb3&right=dev&3way=1`;
const OUT = new URL('../../test-results/r3037-derived/', import.meta.url).pathname;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const F = {
  base:  ['=fixhdr=', 'line-modify-BASE', 'mid-1', 'line-delete-BASE', 'mid-2', 'mid-3', 'line-conflict-BASE', '=fixftr='].join('\n'),
  left:  ['=fixhdr=', 'line-modify-LEFTCHANGE', 'mid-1', 'line-delete-BASE', 'mid-2', 'line-added-by-LEFT', 'mid-3', 'line-conflict-LEFTSIDE', '=fixftr='].join('\n'),
  right: ['=fixhdr=', 'line-modify-BASE', 'mid-1', 'mid-2', 'mid-3', 'line-conflict-RIGHTSIDE', '=fixftr='].join('\n'),
};
const isGreenSolid = (p) => p && p[1] > 130 && p[1] > p[0] + 40 && p[1] > p[2] + 20;

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
try { fs.mkdirSync(OUT, { recursive: true }); } catch {}
const resolveBtnPx = async (page) => { const r = await page.evaluate(() => { const b = document.querySelector('rb-diff-editor .de-resolve'); if (!b) return null; const rc = b.getBoundingClientRect(); return { x: Math.round(rc.left + rc.width / 2), y: Math.round(rc.top + rc.height / 2) }; }); if (!r) return null; const shot = 'data:image/png;base64,' + (await page.screenshot()).toString('base64'); return await page.evaluate(async ({ shot, r }) => { const img = new Image(); img.src = shot; await img.decode(); const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; const cx = cv.getContext('2d'); cx.drawImage(img, 0, 0); const p = cx.getImageData(r.x, r.y, 1, 1).data; return [p[0], p[1], p[2]]; }, { shot, r }); };

const results = [];
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1500, height: 950 } });
    await seedSystemTester(ctx); const page = await ctx.newPage();
    await page.goto(DEEP, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => { const e = document.querySelector('rb-diff-editor'); return e?.left?.content?.length > 0 && e['edCenter']; }, { timeout: 20000 }).catch(() => {});
    await sleep(700);
    const inject = () => page.evaluate(async ({ b, l, r }) => { const e = document.querySelector('rb-diff-editor'); e.left = { path: 'fx.txt', ref: 'L', repo: '', content: l }; e.right = { path: 'fx.txt', ref: 'R', repo: '', content: r }; e['edLocal'].setValue(l); e['edRemote'].setValue(r); e['resolveBase'] = async () => b; await e['computeMergedCenter'](); }, { b: F.base, l: F.left, r: F.right });
    const modifyId = () => page.evaluate(() => (document.querySelector('rb-diff-editor')['conflicts'] || []).find(c => /modif/i.test(c.kind))?.id);

    // (1) 2-line both-versions → BOTH ✕, NO ≫/≪
    await inject(); await sleep(500);
    const a1 = await page.evaluate((mid) => { const has = (a) => !!document.querySelector(`[data-cid="${mid}"][data-act="${a}"]`); return { rmL: has('rm-left'), rmR: has('rm-right'), addL: has('add-left'), addR: has('add-right') }; }, await modifyId());
    const c1 = a1.rmL && a1.rmR && !a1.addL && !a1.addR;

    // (2)+(3)+(4) ✕ drops a side → resolved + auto-jump + add-back appears + count decrements
    await inject(); await sleep(500);
    const mid = await modifyId();
    const count0 = await page.evaluate(() => document.querySelector('rb-diff-editor')['openChangeCount']());
    await page.evaluate((mid) => { const e = document.querySelector('rb-diff-editor'); e['_currentId'] = mid; e['_jumpIdx'] = (e['conflicts'] || []).findIndex(c => c.id === mid); const b = document.querySelector(`[data-cid="${mid}"][data-act="rm-left"]`); if (b) b.click(); }, mid);
    await sleep(500);
    if (i === 1) await page.screenshot({ path: OUT + 'after-rm.png' }).catch(() => {});
    const a2 = await page.evaluate((mid) => { const e = document.querySelector('rb-diff-editor'); const c = (e['conflicts'] || []).find(x => x.id === mid); const isRes = e['isResolved'] ? e['isResolved'](c) : !(c.incl.a && c.a.length > 0 && c.incl.b && c.b.length > 0); return { resolved: isRes, current: e['_currentId'], jumpedAway: e['_currentId'] !== mid, addBack: !!document.querySelector(`[data-cid="${mid}"][data-act="add-left"]`), count: e['openChangeCount']() }; }, mid);
    const c2 = a2.resolved && a2.jumpedAway;               // dropped side → resolved + auto-jump
    const c3 = a2.addBack;                                 // add-back appears for the dropped side
    const c4 = a2.count === count0 - 1;                    // count decremented

    // (5) OVERRIDE: ✓ on a 2-line KEEP-BOTH → both lines REMAIN + ✓ solid + count decremented
    await inject(); await sleep(500);
    const mid2 = await modifyId();
    const count0b = await page.evaluate(() => document.querySelector('rb-diff-editor')['openChangeCount']());
    await page.evaluate((mid) => { const e = document.querySelector('rb-diff-editor'); e['_currentId'] = mid; e['updateResolveButton'] && e['updateResolveButton'](); }, mid2); await sleep(200);
    await page.evaluate(() => { const b = document.querySelector('rb-diff-editor .de-resolve'); if (b) b.click(); }); await sleep(500);
    const btnPx = await resolveBtnPx(page);
    const a5 = await page.evaluate((mid) => { const e = document.querySelector('rb-diff-editor'); const c = (e['conflicts'] || []).find(x => x.id === mid); const center = e['edCenter'].getValue(); return { bothRemain: center.includes('line-modify-LEFTCHANGE') && center.includes('line-modify-BASE'), resolved: e['isResolved'](c), count: e['openChangeCount']() }; }, mid2);
    const c5 = a5.bothRemain && a5.resolved && isGreenSolid(btnPx) && a5.count === count0b - 1;

    const pass = c1 && c2 && c3 && c4 && c5;
    results.push(pass);
    console.log(`iter ${i}: (1)both✕/no-add=${c1} | (2)drop→resolved+autojump=${c2}(res=${a2.resolved} jumped=${a2.jumpedAway}) | (3)add-back=${c3} | (4)count ${count0}→${a2.count} dec=${c4} | (5)override keep-both=${c5}(both=${a5.bothRemain} solid=${isGreenSolid(btnPx)} count ${count0b}→${a5.count}) => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }
} finally { await browser.close(); }
console.log('\n===== conflict-merge derived+override (5 assertions, DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
