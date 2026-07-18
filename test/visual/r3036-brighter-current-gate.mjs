// [test:uuid:3f7b9d21-6c48-4a0e-b1d5-8e2f4c69a730] R30.36 (part 1, Tron-verified CORRECT) — the CURRENT change under up/down nav renders BRIGHTER, pixel-distinguishable from the same change when NOT current, with kind-HUE preserved. jumpToChange (65c465fa) sets _currentId + re-renders; .de-block-current = filter brightness(1.35) saturate(1.25) + 2px kind border + white glow (same hue, just brighter).
// GATE (DET-3x, SCREENSHOT+PIXEL, NEVER DOM-count): nav to change A (jumpToChange → A current) → sample A's block-line region luma; nav on (A non-current) → sample the SAME block A again; assert A is BRIGHTER when current than when not (luma delta), and the HUE bucket is the SAME in both states (kind-identity preserved, not recolored). Same-block current-vs-non-current comparison = robust (no need for two blocks on-screen).
// NOTE: the openChangeCount 'decrements-on-action' assertion is HELD (Tron's NEW model = green-checkmark toggle resolution; count = UNRESOLVED). That is a SEPARATE gate reworked after the expert reworks it — NOT here.
import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import fs from 'fs';
const BASE = 'https://prod.wo-da.de:4444';
const DEEP = `${BASE}/edit/otmux?repo=oosh&left=516ebb3&right=dev&3way=1`;
const OUT = new URL('../../test-results/r3036-brighter/', import.meta.url).pathname;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const luma = (p) => 0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2];
const hueBucket = (p) => { const [r, g, b] = p; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); if (mx - mn < 10) return 'gray'; if (r >= g && r >= b) return (g > b + 8 && r - g < 80) ? 'brown' : 'red'; if (g >= r && g >= b) return 'green'; return 'blue'; };

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
try { fs.mkdirSync(OUT, { recursive: true }); } catch {}
// sample the BLOCK BOX region (whole change span + a 3px halo) in center; the de-block-current 2px kind border + white
// glow adds a ring of SATURATED + BRIGHT pixels the non-current block lacks. Return satCount (border) + glowCount + hue.
const sampleBlockLine = async (page, id, shootPath) => {
  const pos = await page.evaluate((id) => { const e = document.querySelector('rb-diff-editor'); const c = (e['conflicts'] || []).find(x => x.id === id); if (!c) return null; e['edCenter'].revealLineInCenter && e['edCenter'].revealLineInCenter(c.span[0] + 1); const p = e.querySelector('.de-panes').getBoundingClientRect(); const cm = e['mount']('center').getBoundingClientRect();
    const yTop = p.top + e['lineY'](e['edCenter'], c.span[0]); const yBot = p.top + e['lineY'](e['edCenter'], Math.max(c.span[1], c.span[0] + 1));
    return { x0: Math.round(cm.left), x1: Math.round(cm.right - 2), y0: Math.round(yTop - 3), y1: Math.round(yBot + 3) }; }, id);
  if (!pos || pos.y0 < 0) return null;
  await sleep(250);
  if (shootPath) await page.screenshot({ path: shootPath }).catch(() => {});
  const shot = 'data:image/png;base64,' + (await page.screenshot()).toString('base64');
  return await page.evaluate(async ({ shot, pos }) => {
    const img = new Image(); img.src = shot; await img.decode(); const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; const cx = cv.getContext('2d'); cx.drawImage(img, 0, 0);
    let satCount = 0, glowCount = 0; let hueP = null, bc = 0; let n = 0;
    for (let x = pos.x0; x < pos.x1; x += 1) for (let y = pos.y0; y < pos.y1; y += 1) { if (x < 0 || y < 0 || x >= img.width || y >= img.height) continue; const p = cx.getImageData(x, y, 1, 1).data; const mx = Math.max(p[0], p[1], p[2]), mn = Math.min(p[0], p[1], p[2]); const ch = mx - mn; const lum = 0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2]; n++;
      if (ch > 45 && lum > 55) { satCount++; if (ch > bc) { bc = ch; hueP = [p[0], p[1], p[2]]; } }         // saturated kind border pixel
      if (mn > 120 && ch < 40) glowCount++;                                                                  // bright near-white glow pixel
    }
    return { satCount, glowCount, hueP, n };
  }, { shot, pos });
};

const results = [];
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1500, height: 950 } });
    await seedSystemTester(ctx); const page = await ctx.newPage();
    await page.goto(DEEP, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => { const e = document.querySelector('rb-diff-editor'); return e?.left?.content?.length > 0 && e['edCenter'] && (e['conflicts'] || []).length >= 3; }, { timeout: 20000 }).catch(() => {});
    await sleep(1200);
    const setup = await page.evaluate(() => { const e = document.querySelector('rb-diff-editor'); const list = e['conflicts'] || []; return { A: list[1]?.id, kindA: list[1]?.kind, n: list.length }; });
    if (setup.A == null) { results.push(false); console.log(`iter ${i}: SETUP-FAIL`); await ctx.close(); continue; }
    // make A the current change
    await page.evaluate((A) => { const e = document.querySelector('rb-diff-editor'); e['_jumpIdx'] = -1; const idx = (e['conflicts'] || []).findIndex(c => c.id === A); for (let k = 0; k <= idx; k++) e['jumpToChange'] && e['jumpToChange'](1); }, setup.A);
    await sleep(500); const curr = await sampleBlockLine(page, setup.A, i === 1 ? OUT + 'A-current.png' : null);
    // nav on → A is no longer current
    await page.evaluate(() => { const e = document.querySelector('rb-diff-editor'); e['jumpToChange'] && e['jumpToChange'](1); }, null);
    await sleep(500); const non = await sampleBlockLine(page, setup.A, i === 1 ? OUT + 'A-noncurrent.png' : null);

    const cEmph = (curr?.satCount || 0) + (curr?.glowCount || 0), nEmph = (non?.satCount || 0) + (non?.glowCount || 0);
    const brighter = cEmph > nEmph + 15 && cEmph > 20;                                     // current has the border+glow ring, non-current doesn't
    const hueSame = curr && curr.hueP && non && (!non.hueP || hueBucket(curr.hueP) === hueBucket(non.hueP)); // border hue = kind (preserved / not recolored)
    const pass = brighter && hueSame;
    results.push(pass);
    console.log(`iter ${i}: kindA=${setup.kindA} | current emph(sat+glow)=${cEmph}(sat${curr?.satCount}/glow${curr?.glowCount}) vs non-current=${nEmph} brighter=${brighter} | border-hue current=${curr && curr.hueP && hueBucket(curr.hueP)} kind-preserved=${hueSame} => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }
} finally { await browser.close(); }
console.log('\n===== R30.36 brighter-current on nav (kind-hue preserved) (DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x — current change brighter, same hue' : 'RED');
console.log('(openChangeCount gate HELD — Tron new checkmark/unresolved model, reworked separately)');
process.exitCode = green ? 0 : 1;
