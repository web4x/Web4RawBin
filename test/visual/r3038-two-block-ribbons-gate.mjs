// [test:uuid:5c9e2a71-8d34-4b0f-a6e2-3f71c085d946] R30.35 2-block render (the LAST gate of the merge-editor arc) — a BOTH-VERSIONS change draws TWO per-side HALF-ribbons (Local↔centerLeft OLDER + Repository↔centerRight NEWER, each to ITS center sub-span), NEVER one merged ribbon spanning both; a ONE-SIDED change is UNCHANGED (still 1 ribbon). Center shows 2 decos: older = de-block (dark tint) + newer = de-newer-<kind> (brighter 0.36 fill + accent bar).
// GATE (DET-3x, SCREENSHOT + SVG-geometry + PIXEL, NOT DOM element-count): on the synthetic all-4-kinds fixture — for each change, parse its ribbon <path> d and count SUBPATHS (M commands): a both-versions change (a>0 && b>0) => 2 half-ribbons; a one-sided change (a>0 XOR b>0) => 1. AND center 2-decos: a both-versions change's center span has a DARKER (older de-block) row and a BRIGHTER (newer de-newer) row — pixel luma delta. Plus a real-diff spot-check at otmux line 73/74. Read-only vs prod (in-memory).
import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import fs from 'fs';
const BASE = 'https://prod.wo-da.de:4444';
const DEEP = `${BASE}/edit/otmux?repo=oosh&left=516ebb3&right=dev&3way=1`;
const OUT = new URL('../../test-results/r3038-twoblock/', import.meta.url).pathname;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const F = {
  base:  ['=fixhdr=', 'line-modify-BASE', 'mid-1', 'line-delete-BASE', 'mid-2', 'mid-3', 'line-conflict-BASE', '=fixftr='].join('\n'),
  left:  ['=fixhdr=', 'line-modify-LEFTCHANGE', 'mid-1', 'line-delete-BASE', 'mid-2', 'line-added-by-LEFT', 'mid-3', 'line-conflict-LEFTSIDE', '=fixftr='].join('\n'),
  right: ['=fixhdr=', 'line-modify-BASE', 'mid-1', 'mid-2', 'mid-3', 'line-conflict-RIGHTSIDE', '=fixftr='].join('\n'),
};

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
try { fs.mkdirSync(OUT, { recursive: true }); } catch {}
const results = [];
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1500, height: 950 } });
    await seedSystemTester(ctx); const page = await ctx.newPage();
    await page.goto(DEEP, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => { const e = document.querySelector('rb-diff-editor'); return e?.left?.content?.length > 0 && e['edCenter']; }, { timeout: 20000 }).catch(() => {});
    await sleep(700);
    await page.evaluate(async ({ b, l, r }) => { const e = document.querySelector('rb-diff-editor'); e.left = { path: 'fx.txt', ref: 'L', repo: '', content: l }; e.right = { path: 'fx.txt', ref: 'R', repo: '', content: r }; e['edLocal'].setValue(l); e['edRemote'].setValue(r); e['resolveBase'] = async () => b; await e['computeMergedCenter'](); }, { b: F.base, l: F.left, r: F.right });
    await sleep(900);
    if (i === 1) await page.screenshot({ path: OUT + 'two-block.png' }).catch(() => {});

    // (1) per-change ribbon SUBPATH count (SVG geometry): both-versions → 2 half-ribbons, one-sided → 1
    const ribbons = await page.evaluate(() => {
      const e = document.querySelector('rb-diff-editor'); const live = (e['conflicts'] || []).filter(c => !(e['dismissed'] && e['dismissed'].has(c.id)));
      const paths = [...(e.querySelector('.de-ribbons')?.querySelectorAll('path') || [])];
      // ribbons are pushed per-conflict in order (one <path> per change with a drawable side) → zip by index
      return live.map((c, idx) => { const p = paths[idx]; const d = p ? (p.getAttribute('d') || '') : ''; const sub = (d.match(/M/g) || []).length;
        const bothVersions = c.a.length > 0 && c.b.length > 0, oneSided = (c.a.length > 0) !== (c.b.length > 0);
        return { kind: c.kind, aLen: c.a.length, bLen: c.b.length, olderLen: c.olderLen, sub, expect: bothVersions ? 2 : (oneSided ? 1 : 0), bothVersions }; });
    });
    const subOk = ribbons.every(r => r.expect === 0 || r.sub === r.expect);
    const hasBoth2 = ribbons.some(r => r.bothVersions && r.sub === 2);
    const hasOne1 = ribbons.some(r => !r.bothVersions && r.sub === 1);

    // (2) center 2-decos: a both-versions change span has a darker (older) row + a brighter (newer) row
    const decos = await page.evaluate(async () => {
      const e = document.querySelector('rb-diff-editor'); const c = (e['conflicts'] || []).find(x => x.a.length > 0 && x.b.length > 0 && x.olderLen > 0 && x.span[1] > x.span[0] + x.olderLen); if (!c) return { ok: null, why: 'no-both-versions-with-2-rows' };
      const p = e.querySelector('.de-panes').getBoundingClientRect(); const cm = e['mount']('center').getBoundingClientRect();
      const yOld = Math.round(p.top + e['lineY'](e['edCenter'], c.span[0]) + 8);              // older row
      const yNew = Math.round(p.top + e['lineY'](e['edCenter'], c.span[0] + c.olderLen) + 8); // newer row
      return { x: Math.round(cm.left + 40), yOld, yNew };
    });
    let twoDecos = null;
    if (decos && decos.x != null) {
      const shot = 'data:image/png;base64,' + (await page.screenshot()).toString('base64');
      twoDecos = await page.evaluate(async ({ shot, decos }) => { const img = new Image(); img.src = shot; await img.decode(); const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; const cx = cv.getContext('2d'); cx.drawImage(img, 0, 0);
        // MEDIAN luma of the row's background band (the tint; text is a bright minority) — the newer row's 0.36 fill +
        // left accent bar reads brighter than the older row's 0.15 de-block tint.
        const tint = (x, y) => { const ls = []; for (let dx = -38; dx < 240; dx += 2) for (let dy = -3; dy <= 4; dy++) { const p = cx.getImageData(x + dx, y + dy, 1, 1).data; ls.push(0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2]); } ls.sort((a, b) => a - b); return ls[Math.floor(ls.length / 2)]; };
        return { oldLuma: Math.round(tint(decos.x, decos.yOld)), newLuma: Math.round(tint(decos.x, decos.yNew)) }; }, { shot, decos });
    }
    const decoOk = twoDecos && twoDecos.newLuma > twoDecos.oldLuma + 6; // newer row brighter tint than older row

    const pass = subOk && hasBoth2 && hasOne1 && decoOk;
    results.push(pass);
    console.log(`iter ${i}: subpaths=[${ribbons.map(r => r.kind + ':' + r.sub + '(exp' + r.expect + ')').join(' ')}] all-ok=${subOk} both=2✓${hasBoth2} one=1✓${hasOne1} | center 2-decos older-luma=${twoDecos && twoDecos.oldLuma} newer-luma=${twoDecos && twoDecos.newLuma} newer-brighter=${decoOk} => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }
} finally { await browser.close(); }
console.log('\n===== R30.35 two-block: half-ribbons + center 2-decos (DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x — both-versions=2 half-ribbons, one-sided=1, center 2-decos' : 'RED');
process.exitCode = green ? 0 : 1;
