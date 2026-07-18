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
const readCount = (page) => page.evaluate(() => { const t = document.querySelector('rb-diff-editor .de-count')?.textContent || ''; const m = t.match(/(\d+)\s*to resolve/i); return m ? +m[1] : -1; });
const navFirst = (page) => page.evaluate(() => { const e = document.querySelector('rb-diff-editor'); e['_jumpIdx'] = -1; e['jumpToChange'] && e['jumpToChange'](1); return e['_currentId']; });
const clickResolve = (page) => page.evaluate(() => { const b = document.querySelector('rb-diff-editor .de-resolve'); if (b) b.click(); });
const clickAct = (page, id, act) => page.evaluate(({ id, act }) => { const b = document.querySelector(`[data-cid="${id}"][data-act="${act}"]`); if (b) { b.click(); return true; } return false; }, { id, act });

const results = [];
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1500, height: 950 } });
    await seedSystemTester(ctx); const page = await ctx.newPage();
    await page.goto(DEEP, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => { const e = document.querySelector('rb-diff-editor'); return e?.left?.content?.length > 0 && e['edCenter'] && (e['conflicts'] || []).length >= 2; }, { timeout: 20000 }).catch(() => {});
    await sleep(1200);
    const curId = await navFirst(page); await sleep(400);
    const count0 = await readCount(page); const btnUnresolved = await resolveBtnPx(page);
    // (1)+(2) click ✓ → SOLID green + count decrements
    await clickResolve(page); await sleep(500);
    if (i === 1) await page.screenshot({ path: OUT + 'resolved.png' }).catch(() => {});
    const btnResolved = await resolveBtnPx(page); const count1 = await readCount(page);
    // (3) reset-action ≫ (add-left) on the same change → UNRESOLVED again + count increments
    const hadAct = await clickAct(page, curId, 'add-left') || await clickAct(page, curId, 'add-right') || await clickAct(page, curId, 'rm-left');
    await sleep(500); const btnAfterAct = await resolveBtnPx(page); const count2 = await readCount(page);

    const toggledSolid = !isGreenSolid(btnUnresolved) && isGreenSolid(btnResolved);   // outlined → solid on ✓
    const decremented = count0 > 0 && count1 === count0 - 1;
    const resetOutlined = hadAct && !isGreenSolid(btnAfterAct);                        // action → back to outlined
    const incremented = count2 === count1 + 1 && count2 === count0;
    const pass = toggledSolid && decremented && resetOutlined && incremented;
    results.push(pass);
    console.log(`iter ${i}: ✓toggle outlined→solid=${toggledSolid}(un=${JSON.stringify(btnUnresolved)}→res=${JSON.stringify(btnResolved)}) | count ${count0}→${count1} dec=${decremented} | reset-action→outlined=${resetOutlined} count→${count2} inc=${incremented} => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }
} finally { await browser.close(); }
console.log('\n===== R30.37 resolution toggle (✓ resolves / action resets / unresolved-count) (DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
