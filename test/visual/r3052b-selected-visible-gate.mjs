// R30.52 '.de-selected' VISIBILITY gate — Tron: '14 selected' MISSING at his state (post ✨ Apply All → Repository wins,
// 0 open conflicts, 'applied all — Repository wins' status). Impl renderMergeGutter e24dc98a.
// ★ Two traps combined: (1) DOM-present ≠ VISIBLE, (2) single-width gate hides a narrow-viewport squeeze (R30.34 lesson).
// The '.de-status' is flex:1 with the long 'applied all…' text → at NARROW widths it squeezes/clips the fixed '.de-selected'.
// So: at Tron's EXACT state, SWEEP realistic viewport widths and assert '.de-selected' renders '14 selected' — non-zero width,
// css-visible, text PAINTED (screenshot+canvas decode), and WITHIN the toolbar's visible bounds (not clipped/overlapped) —
// at EVERY width. RED if it's missing/zero-width/clipped at ANY width (reproduces Tron). DET across widths (deterministic per width).
import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import { promises as fs } from 'node:fs';
const BASE = 'https://prod.wo-da.de:4444';
const DEEP = `${BASE}/edit/otmux?repo=oosh&left=mcdonges.latest&right=dev&3way=1`;
const OUT = 'test-results/r3052-toolbar';
const WIDTHS = [1300, 1024, 900, 820, 720, 600, 500, 414, 390];
const N = 14;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const results = [];
try {
  for (const W of WIDTHS) {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: W, height: 900 } });
    await seedSystemTester(ctx);
    const page = await ctx.newPage();
    await page.goto(DEEP, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => !!customElements.get('rb-diff-editor'), { timeout: 20000 }).catch(() => {});
    await page.waitForFunction(() => { const e = document.querySelector('rb-diff-editor'); return e?.conflicts?.length > 0 && e?.querySelector('.de-open-count')?.textContent; }, { timeout: 20000 }).catch(() => {});
    await sleep(400);
    // Tron's state: ✨ Apply All → Repository wins, then nav to 14
    await page.click('.de-apply-all').catch(() => {});
    await page.waitForSelector('.de-overlay', { timeout: 8000 }).catch(() => {});
    await page.evaluate(() => { const b = [...document.querySelectorAll('.de-overlay button')].find(x => /Repository wins/i.test(x.textContent || '')); b?.click(); });
    await sleep(700);
    for (let k = 0; k < N; k++) { await page.click('.de-jump-next').catch(() => {}); }
    await sleep(400);

    const m = await page.evaluate(() => {
      const e = document.querySelector('rb-diff-editor'); const q = s => e.querySelector(s);
      const sel = q('.de-selected'), apply = q('.de-apply-all'), prev = q('.de-jump-prev'), tb = q('.de-toolbar');
      const cs = sel ? getComputedStyle(sel) : null; const b = sel?.getBoundingClientRect();
      const rct = el => { const r = el?.getBoundingClientRect(); return r ? { left: r.left, right: r.right, top: r.top, bottom: r.bottom, w: r.width } : null; };
      // is the .de-selected box actually the topmost element at its own center? (overlap/clip detection)
      let topmost = false;
      if (b && b.width > 0) { const el = document.elementFromPoint((b.left + b.right) / 2, (b.top + b.bottom) / 2); topmost = el === sel || sel?.contains(el); }
      return { text: (sel?.textContent || '').trim(), offsetW: sel?.offsetWidth ?? -1,
        rect: b ? { left: b.left, right: b.right, top: b.top, bottom: b.bottom, w: b.width, h: b.height } : null,
        display: cs?.display, visibility: cs?.visibility, opacity: cs?.opacity, topmost,
        applyR: rct(apply), prevR: rct(prev), tbR: rct(tb), open: e?.openChangeCount?.(), status: (e?.querySelector('.de-status')?.textContent || '').trim() };
    });

    // PIXEL: decode a screenshot, count painted (non-bg) pixels inside the .de-selected box
    const shot = `${OUT}/selected-w${W}.png`;
    await page.screenshot({ path: shot, clip: { x: 0, y: 0, width: W, height: 130 } }).catch(() => {});
    let paintedPx = -1;
    if (m.rect && m.rect.w > 0) {
      const buf = await fs.readFile(shot); const url = 'data:image/png;base64,' + buf.toString('base64');
      paintedPx = await page.evaluate(async ({ url, box }) => {
        const img = new Image(); await new Promise(r => { img.onload = r; img.src = url; });
        const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; const c = cv.getContext('2d'); c.drawImage(img, 0, 0);
        const x0 = Math.max(0, Math.floor(box.left)), y0 = Math.max(0, Math.floor(box.top));
        const w = Math.min(img.width - x0, Math.ceil(box.w)), h = Math.min(img.height - y0, Math.ceil(box.h)); if (w <= 0 || h <= 0) return 0;
        const d = c.getImageData(x0, y0, w, h).data; let n = 0; for (let p = 0; p < d.length; p += 4) if (Math.max(d[p], d[p + 1], d[p + 2]) > 90) n++; return n;
      }, { url, box: m.rect });
    }

    const withinToolbar = m.rect && m.tbR && m.rect.left >= m.tbR.left - 1 && m.rect.right <= m.tbR.right + 1;   // not clipped past the toolbar edge
    const between = m.rect && m.applyR && m.prevR && m.rect.left >= m.applyR.right - 2 && m.rect.right <= m.prevR.left + 2;
    const visible = /^\d+ selected$/.test(m.text) && m.offsetW > 3 && m.rect?.w > 3 && m.display !== 'none' && m.visibility !== 'hidden' && Number(m.opacity) > 0.05
      && paintedPx > 15 && m.topmost && withinToolbar && between;
    results.push({ W, visible, m, paintedPx });
    console.log(`w=${W}: [open=${m.open} status="${m.status.slice(0, 26)}"] text="${m.text}" off=${m.offsetW} rectW=${m.rect?.w?.toFixed(0)} painted=${paintedPx} topmost=${m.topmost} withinTB=${withinToolbar} between=${between} => ${visible ? 'visible' : 'MISSING'}`);
    await ctx.close();
  }
} finally { await browser.close(); }

console.log('\n===== R30.52 .de-selected visibility across viewports @ Tron state (14 selected, post Apply-All Repo-wins) =====');
const bad = results.filter(r => !r.visible).map(r => r.W);
const green = results.length === WIDTHS.length && results.every(r => r.visible);
console.log(`  ${results.map(r => `${r.W}:${r.visible ? 'G' : 'R'}`).join(' ')}`);
console.log(green ? 'OVERALL: GREEN (14 selected visibly rendered at ALL widths)' : `OVERALL: RED — '14 selected' MISSING/clipped at widths [${bad.join(', ')}] (reproduces Tron)`);
process.exitCode = green ? 0 : 1;
