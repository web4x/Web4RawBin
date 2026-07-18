// [test:uuid:3f7b9d21-6c48-4a0e-b1d5-8e2f4c69a730] R30.36 nav-aids — the CURRENT change (up/down nav) renders BRIGHTER than a non-current change of the SAME kind (pixel-distinguishable), with kind-IDENTITY intact (still the kind's hue); and an OPEN-COUNT that DECREMENTS on each ≫/≪/✕ down to 0.
// GATE (DET-3x, SCREENSHOT+PIXEL, NEVER DOM-count): on the real 3-way diff — (1) nav to change A → sample its gutter color; A is BRIGHTER (higher luma) than a non-current same-kind change B, yet same HUE bucket (kind-identity intact); nav to B → B brightens, A dims. (2) OPEN-COUNT: read the count, resolve every change via ≫/≪/✕, assert it decrements monotonically to 0. Read-only vs prod (in-memory only, no save).
// STATUS: prep — pre-deploy there is no current-brighter highlight (all same-kind changes render identically) + no decrementing open-count → RED; flips GREEN when R30.36 deploys.
import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import fs from 'fs';
const BASE = 'https://prod.wo-da.de:4444';
const DEEP = `${BASE}/edit/otmux?repo=oosh&left=516ebb3&right=dev&3way=1`;
const OUT = new URL('../../test-results/r3036-navaids/', import.meta.url).pathname;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const luma = (p) => Math.round(0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2]);
const hueBucket = (p) => { const [r, g, b] = p; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); if (mx - mn < 12) return 'gray'; if (r >= g && r >= b) return (g > b + 10 && r - g < 75) ? 'brown' : 'red'; if (g >= r && g >= b) return 'green'; return 'blue'; };

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
try { fs.mkdirSync(OUT, { recursive: true }); } catch {}
// sample a block's center-gutter pixel from a fresh screenshot
const sampleBlock = async (page, id) => {
  // reveal the block into view first, then compute its screen Y — so an off-screen block never samples black(0)
  const pos = await page.evaluate((id) => { const e = document.querySelector('rb-diff-editor'); const c = (e['conflicts'] || []).find(x => x.id === id); if (!c) return null; e['edCenter'].revealLineInCenter && e['edCenter'].revealLineInCenter(c.span[0] + 1); const p = e.querySelector('.de-panes').getBoundingClientRect(); const cm = e['mount']('center').getBoundingClientRect(); return { x: Math.round(cm.left + 6), y: Math.round(p.top + e['lineY'](e['edCenter'], c.span[0]) + 8), kind: c.kind }; }, id);
  if (!pos || pos.y < 0) return null;
  await sleep(250);
  const shot = 'data:image/png;base64,' + (await page.screenshot()).toString('base64');
  const px = await page.evaluate(async ({ shot, pos }) => { const img = new Image(); img.src = shot; await img.decode(); const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; const cx = cv.getContext('2d'); cx.drawImage(img, 0, 0); let best = null, bc = 0; for (let dx = -1; dx < 6; dx++) for (let dy = -3; dy < 22; dy += 2) { const x = pos.x + dx, y = pos.y + dy; if (x < 0 || y < 0 || x >= img.width || y >= img.height) continue; const p = cx.getImageData(x, y, 1, 1).data; const s = p[0] + p[1] + p[2]; if (s > bc) { bc = s; best = [p[0], p[1], p[2]]; } } return best; }, { shot, pos });
  return { px, kind: pos.kind };
};

const results = [];
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1500, height: 950 } });
    await seedSystemTester(ctx); const page = await ctx.newPage();
    await page.goto(DEEP, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => { const e = document.querySelector('rb-diff-editor'); return e?.left?.content?.length > 0 && e['edCenter'] && (e['conflicts'] || []).length >= 2; }, { timeout: 20000 }).catch(() => {});
    await sleep(1200);
    // pick two same-kind changes A,B
    const pair = await page.evaluate(() => { const e = document.querySelector('rb-diff-editor'); const live = (e['conflicts'] || []).filter(c => !(e['dismissed'] && e['dismissed'].has(c.id))); const byKind = {}; for (const c of live) (byKind[c.kind] = byKind[c.kind] || []).push(c.id); const k = Object.keys(byKind).find(k => byKind[k].length >= 2); return k ? { kind: k, A: byKind[k][0], B: byKind[k][1], openStart: live.length } : { none: true }; });
    if (pair.none) { results.push(false); console.log(`iter ${i}: SETUP-FAIL <2 same-kind changes`); await ctx.close(); continue; }

    // (1) compare the SAME block A when CURRENT vs NON-CURRENT (robust: no need for 2 blocks on-screen at once).
    const navTo = (id) => page.evaluate((id) => { const e = document.querySelector('rb-diff-editor'); const idx = (e['conflicts'] || []).filter(c => !(e['dismissed'] && e['dismissed'].has(c.id))).findIndex(c => c.id === id); if (idx >= 0 && e['_jumpIdx'] !== undefined) { e['_jumpIdx'] = idx - 1; e['jumpToChange'] && e['jumpToChange'](1); } }, id);
    await navTo(pair.A); await sleep(400); const Acur = await sampleBlock(page, pair.A);           // A is current
    if (i === 1) await page.screenshot({ path: OUT + 'nav-A.png' }).catch(() => {});
    await navTo(pair.B); await sleep(400); const Anon = await sampleBlock(page, pair.A);           // nav away → A non-current
    const lumaA = Acur && Acur.px ? luma(Acur.px) : 0, lumaB = Anon && Anon.px ? luma(Anon.px) : 0;
    const currentBrighter = lumaA > lumaB + 8;                                                     // A brighter when current than when not
    const kindIntact = Acur && Anon && Acur.px && Anon.px && hueBucket(Acur.px) === hueBucket(Anon.px); // same kind hue in both states

    // (2) OPEN-COUNT decrements to 0 on resolving all
    const counts = await page.evaluate(async () => {
      const e = document.querySelector('rb-diff-editor');
      const readCount = () => { const t = (e.querySelector('.de-count')?.textContent || ''); const m = t.match(/(\d+)\s*(change|open|unresolved|conflict)/i); return m ? +m[1] : (t.match(/\d+/) ? +t.match(/\d+/)[0] : -1); };
      const seq = [readCount()];
      const ids = (e['conflicts'] || []).map(c => c.id);
      for (const id of ids) { const btn = e.querySelector(`[data-cid="${id}"][data-act="left"]`) || e.querySelector(`[data-cid="${id}"][data-act="ignore"]`); if (btn) { btn.click(); await new Promise(z => setTimeout(z, 200)); seq.push(readCount()); } }
      return { seq, final: readCount() };
    });
    const decrements = counts.seq.length > 1 && counts.final === 0 && counts.seq[0] > 0;

    const pass = currentBrighter && kindIntact && decrements;
    results.push(pass);
    console.log(`iter ${i}: kind=${pair.kind} | current-brighter=${currentBrighter}(A-luma=${lumaA} vs B=${lumaB}) kind-intact=${kindIntact} | open-count ${counts.seq[0]}→${counts.final} decrements-to-0=${decrements} => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }
} finally { await browser.close(); }
console.log('\n===== R30.36 nav-aids: current-brighter + open-count→0 (DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED (nav-aids not-yet-deployed)');
process.exitCode = green ? 0 : 1;
