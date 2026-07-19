// [test:uuid:53731d96-ce8f-498b-8381-1a64c2ad1e40] R30.52 mobile visibility (impl-edit on renderMergeGutter e24dc98a) — at 390px REAL MOBILE (iPhone emulation, isMobile) + Tron's end-state (post ✨Apply All→Repository wins, 0 open, N=14), '.de-selected' renders '14 selected' SINGLE-LINE (white-space:nowrap, not wrapped to 2), non-zero width, PAINTED (pixel), topmost, inline between Apply All and ▲; toolbar single-row (flex-wrap:nowrap). GREEN DET-3x v0.7.76 (fixes the mobile text-WRAP that made it invisible on Tron's phone). Distinct mobile-visibility Test alongside 8fa42d89/0866205d/919d290d on e24dc98a.
// R30.52 '.de-selected' MOBILE visibility gate — ★ Tron is on a 390px PHONE. v0.7.76 mobile-wrap fix (white-space:nowrap +
// flex-shrink:0 + toolbar flex-wrap:nowrap + overflow-x:auto). Impl renderMergeGutter e24dc98a.
// ★★★ STANDING PROTOCOL (session-defining, SM/PO): gate ALL Tron-facing VISUAL features at 390px REAL MOBILE emulation
//   (isMobile + deviceScaleFactor + mobile UA — NOT a desktop narrow viewport, which renders flex/overflow differently and
//   keeps false-passing) + Tron's REAL end-state + a PIXEL screenshot. Desktop DOM/element-counts = the false-green root.
// AT MOBILE 390px + Tron's state (✨ Apply All → Repository wins → 0 open → nav to N=14): assert '.de-selected' renders
//   '14 selected' on a SINGLE line (white-space:nowrap, offsetHeight ≈ 1 line — NOT wrapped to 2), non-zero width, css-visible,
//   text PAINTED (screenshot+canvas decode), topmost (not overlapped), between Apply All and ▲; toolbar SINGLE row (no wrap).
import { chromium, devices } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import { promises as fs } from 'node:fs';
const BASE = 'https://prod.wo-da.de:4444';
const DEEP = `${BASE}/edit/otmux?repo=oosh&left=mcdonges.latest&right=dev&3way=1`;
const OUT = 'test-results/r3052-toolbar';
const N = 14;
const IPHONE = devices['iPhone 12']; // 390×844, deviceScaleFactor 3, isMobile true, touch, mobile UA
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const rows = [];
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ...IPHONE, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
    await seedSystemTester(ctx);
    const page = await ctx.newPage();
    await page.goto(DEEP, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => !!customElements.get('rb-diff-editor'), { timeout: 20000 }).catch(() => {});
    await page.waitForFunction(() => { const e = document.querySelector('rb-diff-editor'); return e?.conflicts?.length > 0 && e?.querySelector('.de-open-count')?.textContent; }, { timeout: 20000 }).catch(() => {});
    await sleep(400);
    // Tron's EXACT state on mobile: ✨ Apply All → Repository wins → 0 open, then nav to 14
    await page.click('.de-apply-all').catch(() => {});
    await page.waitForSelector('.de-overlay', { timeout: 8000 }).catch(() => {});
    await page.evaluate(() => { const b = [...document.querySelectorAll('.de-overlay button')].find(x => /Repository wins/i.test(x.textContent || '')); b?.click(); });
    await sleep(700);
    for (let k = 0; k < N; k++) { await page.click('.de-jump-next').catch(() => {}); }
    await sleep(400);

    const m = await page.evaluate(() => {
      const e = document.querySelector('rb-diff-editor'); const q = s => e.querySelector(s);
      const sel = q('.de-selected'), apply = q('.de-apply-all'), prev = q('.de-jump-prev'), oc = q('.de-open-count'), res = q('.de-resolve'), tb = q('.de-toolbar');
      const cs = sel ? getComputedStyle(sel) : null; const b = sel?.getBoundingClientRect();
      const rct = el => { const r = el?.getBoundingClientRect(); return r ? { left: r.left, right: r.right, top: r.top, bottom: r.bottom, w: r.width, h: r.height } : null; };
      let topmost = false;
      if (b && b.width > 0 && b.height > 0) { const el = document.elementFromPoint((b.left + b.right) / 2, (b.top + b.bottom) / 2); topmost = el === sel || sel?.contains(el); }
      const tbcs = tb ? getComputedStyle(tb) : null;
      return {
        text: (sel?.textContent || '').trim(), offsetW: sel?.offsetWidth ?? -1, offsetH: sel?.offsetHeight ?? -1,
        whiteSpace: cs?.whiteSpace, lineH: cs ? parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.4 : 0,
        rect: b ? { left: b.left, right: b.right, top: b.top, bottom: b.bottom, w: b.width, h: b.height } : null,
        display: cs?.display, visibility: cs?.visibility, opacity: cs?.opacity, topmost,
        applyR: rct(apply), prevR: rct(prev), ocR: rct(oc), resR: rct(res), tbR: rct(tb), tbFlexWrap: tbcs?.flexWrap,
        open: e?.openChangeCount?.(), status: (e?.querySelector('.de-status')?.textContent || '').trim(),
      };
    });

    // PIXEL: decode a mobile screenshot, count painted (non-bg) pixels inside the .de-selected box (deviceScaleFactor-aware)
    const shot = `${OUT}/selected-mobile390-iter${i}.png`;
    await page.screenshot({ path: shot, clip: { x: 0, y: 0, width: 390, height: 130 } }).catch(() => {});
    let paintedPx = -1;
    if (m.rect && m.rect.w > 0 && m.rect.h > 0) {
      const buf = await fs.readFile(shot); const url = 'data:image/png;base64,' + buf.toString('base64');
      paintedPx = await page.evaluate(async ({ url, box, dpr }) => {
        const img = new Image(); await new Promise(r => { img.onload = r; img.src = url; });
        const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; const c = cv.getContext('2d'); c.drawImage(img, 0, 0);
        const x0 = Math.max(0, Math.floor(box.left * dpr)), y0 = Math.max(0, Math.floor(box.top * dpr));   // screenshot is in device px
        const w = Math.min(img.width - x0, Math.ceil(box.w * dpr)), h = Math.min(img.height - y0, Math.ceil(box.h * dpr)); if (w <= 0 || h <= 0) return 0;
        const d = c.getImageData(x0, y0, w, h).data; let n = 0; for (let p = 0; p < d.length; p += 4) if (Math.max(d[p], d[p + 1], d[p + 2]) > 90) n++; return n;
      }, { url, box: m.rect, dpr: IPHONE.deviceScaleFactor });
    }

    const singleLine = m.offsetH > 0 && m.offsetH <= Math.max(24, m.lineH * 1.6) && m.whiteSpace === 'nowrap';  // NOT wrapped to 2 lines
    const nonZeroW = m.offsetW > 3 && m.rect?.w > 3;
    const cssVis = /^\d+ selected$/.test(m.text) && m.display !== 'none' && m.visibility !== 'hidden' && Number(m.opacity) > 0.05;
    const painted = paintedPx > 15;
    const between = m.rect && m.applyR && m.prevR && m.rect.left >= m.applyR.right - 2 && m.rect.right <= m.prevR.left + 2;
    const ocBetween = m.ocR && m.prevR && m.resR && m.ocR.left >= m.prevR.right - 2 && m.ocR.right <= m.resR.left + 2;   // open-count between ▼ and ✓
    const tbNoWrap = m.tbFlexWrap === 'nowrap' && m.tbR && m.tbR.h <= 44;   // toolbar single row (may scroll-x)
    const pass = singleLine && nonZeroW && cssVis && painted && m.topmost && between && ocBetween && tbNoWrap;
    rows.push(pass);
    console.log(`iter ${i} @390mobile: [open=${m.open} status="${m.status.slice(0, 22)}"] text="${m.text}" | single-line=${singleLine}(h=${m.offsetH} ws=${m.whiteSpace}) | width=${nonZeroW}(${m.offsetW}) | painted=${painted}(${paintedPx}) | topmost=${m.topmost} | between=${between} ocBetween=${ocBetween} | tb-1row=${tbNoWrap}(wrap=${m.tbFlexWrap} h=${m.tbR?.h?.toFixed(0)}) => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }
} finally { await browser.close(); }

console.log('\n===== R30.52 .de-selected MOBILE 390px @ Tron state (14 selected, post Apply-All Repo-wins) DET-3x =====');
console.log(`  DET-3x: ${rows.map((p, i) => `${i + 1}:${p ? 'G' : 'R'}`).join(' ')}`);
const green = rows.length === 3 && rows.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x (14 selected single-line VISIBLE inline on mobile 390px, no wrap, toolbar one row)' : 'RED (wraps/hidden on mobile — reproduces Tron)');
process.exitCode = green ? 0 : 1;
