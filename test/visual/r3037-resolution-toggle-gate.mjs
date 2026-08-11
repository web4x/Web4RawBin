// [test:uuid:6d2b9f84-3a17-4c50-b8e1-9f4c7a06e253] R30.37 explicit resolution toggle — the green ✓ (de-resolve, toggleResolved c86a104d) marks the CURRENT change RESOLVED (OUTLINED-green → SOLID-green), ONE per change. Resolution is EXPLICIT: clicking ANY ≫/≪/✕ (addSide/removeLine) does _resolved.delete → RESETS that change to UNRESOLVED. openChangeCount() = the UNRESOLVED count → DECREMENTS on ✓, INCREMENTS on a reset-action, 0 when all checkmarked. (Reworks the parked openChangeCount gate from the OLD decrements-on-action model to THIS.)
// GATE (DET-3x, SCREENSHOT+PIXEL for the ✓ state + the feature's own displayed count, NEVER DOM element-count): (1) nav to a change → click ✓ → the de-resolve button goes SOLID green (pixel) + the change's ✓ badge; (2) the 'K to resolve' count DECREMENTS by 1; (3) then click ≫ (a reset-action) on that change → it RESETS to unresolved: ✓ button OUTLINED again (pixel) + count INCREMENTS back by 1. Read-only vs prod (in-memory, no save).
import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import fs from 'fs';
const BASE = 'https://prod.wo-da.de:4444';
const DEEP = `${BASE}/edit/otmux?repo=oosh&left=516ebb3&right=dev&3way=1`;
const OUT = new URL('../../test-results/r3037-resolve/', import.meta.url).pathname;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
// is the pixel solid-green (#2ecc71 ≈ [46,204,113]) = resolved? (vs outlined = transparent over dark toolbar)
const isGreenSolid = (p) => p && p[1] > 130 && p[1] > p[0] + 40 && p[1] > p[2] + 20;

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
try { fs.mkdirSync(OUT, { recursive: true }); } catch {}
// sample the .de-resolve ✓ button center pixel (solid-green when resolved / dark-transparent when outlined)
const resolveBtnPx = async (page) => {
  const r = await page.evaluate(() => { const b = document.querySelector('rb-diff-editor .de-resolve'); if (!b) return null; const rc = b.getBoundingClientRect(); return { x: Math.round(rc.left + rc.width / 2), y: Math.round(rc.top + rc.height / 2) }; });
  if (!r) return null;
  const shot = 'data:image/png;base64,' + (await page.screenshot()).toString('base64');
  return await page.evaluate(async ({ shot, r }) => { const img = new Image(); img.src = shot; await img.decode(); const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; const cx = cv.getContext('2d'); cx.drawImage(img, 0, 0); const p = cx.getImageData(r.x, r.y, 1, 1).data; return [p[0], p[1], p[2]]; }, { shot, r });
};
// R40.30 RE-TARGET: the unresolved-count hook moved .de-count → .de-open-count (R30.52 split; SAME AC = openChangeCount, the
// UNRESOLVED count, now shown as 'X/Y open conflicts'). Drift NAMES ITSELF: a MISSING hook returns {missing:true} (a FINDING),
// never a silent -1 (a -1 is a lie that survives review). No literal version/count is hardcoded (rot-cause #3 avoided).
const readCount = (page) => page.evaluate(() => {
  const el = document.querySelector('rb-diff-editor .de-open-count');
  if (!el) return { missing: true, hook: '.de-open-count' };                 // LOUD: absent hook is a finding, not -1
  const t = el.textContent || '';
  const m = t.match(/(\d+)\s*\/\s*\d+\s*open conflict/i);                     // 'X/Y open conflicts' → X = openChangeCount (unresolved)
  return { n: m ? +m[1] : null, text: t };                                    // null (not -1): found-but-unparseable is also a finding
});
const navFirst = (page) => page.evaluate(() => { const e = document.querySelector('rb-diff-editor'); e['_jumpIdx'] = -1; e['jumpToChange'] && e['jumpToChange'](1); return e['_currentId']; });
const clickResolve = (page) => page.evaluate(() => { const b = document.querySelector('rb-diff-editor .de-resolve'); if (b) b.click(); });
const clickAct = (page, id, act) => page.evaluate(({ id, act }) => { const b = document.querySelector(`[data-cid="${id}"][data-act="${act}"]`); if (b) { b.click(); return true; } return false; }, { id, act });

const results = [];
let stubProven = false;
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1500, height: 950 } });
    await seedSystemTester(ctx); const page = await ctx.newPage();
    await page.goto(DEEP, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => { const e = document.querySelector('rb-diff-editor'); return e?.left?.content?.length > 0 && e['edCenter'] && (e['conflicts'] || []).length >= 2; }, { timeout: 20000 }).catch(() => {});
    await sleep(1200);
    const curId = await navFirst(page); await sleep(400);
    const c0 = await readCount(page); const btnUnresolved = await resolveBtnPx(page);
    // (1)+(2) click ✓ → SOLID green + UNRESOLVED-count decrements
    await clickResolve(page); await sleep(500);
    if (i === 1) await page.screenshot({ path: OUT + 'resolved.png' }).catch(() => {});
    const btnResolved = await resolveBtnPx(page); const c1 = await readCount(page);
    // (3) reset-action ≫ (add-left) on the same change → UNRESOLVED again + count increments
    const hadAct = await clickAct(page, curId, 'add-left') || await clickAct(page, curId, 'add-right') || await clickAct(page, curId, 'rm-left');
    await sleep(500); const btnAfterAct = await resolveBtnPx(page); const c2 = await readCount(page);

    const hooksLive = !c0.missing && !c1.missing && !c2.missing;                        // LOUD: a missing hook FAILS (named), never a silent pass
    const count0 = c0.n, count1 = c1.n, count2 = c2.n;
    const toggledSolid = !isGreenSolid(btnUnresolved) && isGreenSolid(btnResolved);     // outlined → solid on ✓ (SAME AC)
    const nonVacuous = count0 > 0 && !isGreenSolid(btnUnresolved);                       // before-state genuinely UNRESOLVED (guards a vacuous green)
    const decremented = hooksLive && count0 > 0 && count1 === count0 - 1;               // SAME AC: unresolved count -1 on ✓
    const resetOutlined = hadAct && !isGreenSolid(btnAfterAct);                          // action → back to outlined
    const incremented = hooksLive && count2 === count1 + 1 && count2 === count0;        // SAME AC: +1 on reset-action
    const pass = hooksLive && nonVacuous && toggledSolid && decremented && resetOutlined && incremented;
    results.push(pass);
    console.log(`iter ${i}: hooks-live=${hooksLive}${(c0.missing || c1.missing || c2.missing) ? '(HOOK ' + (c0.hook || '.de-open-count') + ' MISSING)' : ''} | ✓toggle outlined→solid=${toggledSolid} nonVacuous=${nonVacuous} | count ${count0}→${count1} dec=${decremented} | reset→outlined=${resetOutlined} count→${count2} inc=${incremented} => ${pass ? 'GREEN' : 'RED'}`);

    // ── STUB-MUST-FAIL (R40.30, PO-mandated): prove the gate CAN still fail — same-run discrimination, not a vacuous green.
    if (i === 1) {
      await page.evaluate(() => { const b = document.querySelector('rb-diff-editor .de-resolve'); b && b.classList.remove('resolved'); }); // revert resolved→outlined IN-PAGE
      await sleep(200);
      const revertedPx = await resolveBtnPx(page);
      const samplerDiscriminates = isGreenSolid(btnResolved) && !isGreenSolid(revertedPx);   // green when resolved, NOT-green when reverted → sampler is real (not stuck-green)
      await page.evaluate(() => { const el = document.querySelector('rb-diff-editor .de-open-count'); el && el.remove(); });   // remove the count hook
      const loudNotSilent = (await readCount(page)).missing === true;                        // reader reports {missing} — a finding, not a silent number
      stubProven = samplerDiscriminates && loudNotSilent;
      console.log(`  STUB-MUST-FAIL: sampler-discriminates=${samplerDiscriminates}(resolved-green→reverted-not-green) | missing-hook-LOUD=${loudNotSilent} => ${stubProven ? 'PROVEN — gate can fail' : 'NOT-PROVEN (vacuous risk)'}`);
    }
    await ctx.close();
  }
} finally { await browser.close(); }
console.log('\n===== R30.37 resolution toggle (✓ resolves / action resets / unresolved-count) (DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
console.log(`stub-must-fail proven (gate can fail): ${stubProven}`);
const green = results.length === 3 && results.every(Boolean) && stubProven;   // GREEN requires the proven-can-fail — a gate that can't fail certifies nothing
console.log('OVERALL:', green ? 'GREEN DET-3x (+ stub-must-fail proven, R40.30 re-target)' : 'RED');
process.exitCode = green ? 0 : 1;
