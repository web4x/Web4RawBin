// [test:uuid:4b8d1f62-9c07-4e35-a1d8-7f6203b9e4c5] R30.35 A+D PER-SIDE alignment (closes the gate-gap: the prior gate measured total ribbon HEIGHT and missed the LEFT/Local half mapping EMPTY/blank rows). For a both-versions change the ribbon is TWO half-ribbons: LEFT = Local↔centerLeft(older), RIGHT = Repository↔centerRight(newer). EACH half must be CONTENT-BOUNDED ON BOTH ITS ENDPOINTS — the pane-side Y-span = that side's CONTENT line count (a.length local / b.length repo), the center-side Y-span = its sub-span (olderLen / newerLen) — and NEITHER endpoint may span/align to empty/blank rows (the alignPaneRows spacers).
// GATE (DET-3x, SVG-geometry per side + screenshot, NOT DOM-count): synthetic all-4-kinds fixture. Per both-versions change, parse the ribbon <path> into half1/half2; for each half cluster the coords into pane-side vs center-side by x; assert pane-side rows == content lines AND center-side rows == sub-span lines (±0.5 row), for BOTH Local and Repo. Any over-span = maps empty rows → RED. Read-only.
import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import fs from 'fs';
const BASE = 'https://prod.wo-da.de:4444';
const DEEP = `${BASE}/edit/otmux?repo=oosh&left=516ebb3&right=dev&3way=1`;
const OUT = new URL('../../test-results/r3035-perside/', import.meta.url).pathname;
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
    await page.waitForFunction(() => { const e = document.querySelector('rb-diff-editor'); return e?.left?.content?.length > 0 && e['edCenter']; }, { timeout: 20000 }).catch(() => {});
    await sleep(700);
    await page.evaluate(async ({ b, l, r }) => { const e = document.querySelector('rb-diff-editor'); e.left = { path: 'fx.txt', ref: 'L', repo: '', content: l }; e.right = { path: 'fx.txt', ref: 'R', repo: '', content: r }; e['edLocal'].setValue(l); e['edRemote'].setValue(r); e['resolveBase'] = async () => b; await e['computeMergedCenter'](); }, { b: F.base, l: F.left, r: F.right });
    await sleep(900);
    if (i === 1) await page.screenshot({ path: OUT + 'perside.png' }).catch(() => {});

    const rows = await page.evaluate(() => {
      const e = document.querySelector('rb-diff-editor'); const live = (e['conflicts'] || []).filter(c => !(e['dismissed'] && e['dismissed'].has(c.id)));
      const lh = Math.max(1, e['lineY'](e['edCenter'], 2) - e['lineY'](e['edCenter'], 1));
      const panes = e.querySelector('.de-panes').getBoundingClientRect(); const cm = e['mount']('center').getBoundingClientRect();
      const cMidX = (cm.left + cm.right) / 2 - panes.left; // < = local-half zone, > = repo-half zone (roughly)
      const paths = [...(e.querySelector('.de-ribbons')?.querySelectorAll('path') || [])];
      // parse a subpath into (x,y) coords, cluster into the two x-groups, return each group's {x, rows}
      const spanRows = (sub) => { const pts = [...sub.matchAll(/([\d.]+),([\d.]+)/g)].map(m => [parseFloat(m[1]), parseFloat(m[2])]); if (pts.length < 2) return null;
        const xs = pts.map(p => p[0]).sort((a, b) => a - b); const xMid = (xs[0] + xs[xs.length - 1]) / 2;
        const g = (lo) => { const q = pts.filter(p => lo ? p[0] < xMid : p[0] >= xMid); const ys = q.map(p => p[1]); return { x: Math.round(q.reduce((s, p) => s + p[0], 0) / q.length), rows: (Math.max(...ys) - Math.min(...ys)) / lh }; };
        return { left: g(true), right: g(false) }; };
      return live.map((c, idx) => { const d = paths[idx] ? (paths[idx].getAttribute('d') || '') : ''; const bothV = c.a.length > 0 && c.b.length > 0;
        const subs = d.split('Z').map(s => s.trim()).filter(Boolean); // one subpath per half (both-versions=2, one-sided=1)
        const half1 = subs[0] ? spanRows(subs[0]) : null; const half2 = subs[1] ? spanRows(subs[1]) : null;
        const newerLen = (c.span[1] - c.span[0]) - c.olderLen;
        return { kind: c.kind, bothV, aLen: c.a.length, bLen: c.b.length, olderLen: c.olderLen, newerLen,
          // LEFT half (Local↔centerLeft): pane-side = local (a.length), center-side = olderLen
          localRows: half1 && half1.left ? Math.round(half1.left.rows * 10) / 10 : null,
          centerLeftRows: half1 && half1.right ? Math.round(half1.right.rows * 10) / 10 : null,
          // RIGHT half (centerRight↔Repo): center-side = newerLen, pane-side = repo (b.length)
          centerRightRows: half2 && half2.left ? Math.round(half2.left.rows * 10) / 10 : null,
          repoRows: half2 && half2.right ? Math.round(half2.right.rows * 10) / 10 : null }; });
    });
    // per-side content-bounded: each endpoint's rows == its content lines (±0.5). ANY over-span = maps empty rows.
    const near = (got, want) => got != null && Math.abs(got - want) <= 0.6;
    const both = rows.filter(r => r.bothV);
    const perSideOk = both.length > 0 && both.every(r => near(r.localRows, r.aLen) && near(r.centerLeftRows, r.olderLen) && near(r.centerRightRows, r.newerLen) && near(r.repoRows, r.bLen));
    const leftOk = both.every(r => near(r.localRows, r.aLen) && near(r.centerLeftRows, r.olderLen)); // Tron's specific flag: LEFT side
    const pass = perSideOk;
    results.push(pass);
    console.log(`iter ${i}: both-versions per-side rows(want): ${both.map(r => `${r.kind}[local ${r.localRows}/${r.aLen} cL ${r.centerLeftRows}/${r.olderLen} cR ${r.centerRightRows}/${r.newerLen} repo ${r.repoRows}/${r.bLen}]`).join(' ')} | LEFT-ok=${leftOk} all-sides-ok=${perSideOk} => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }
} finally { await browser.close(); }
console.log('\n===== R30.35 A+D per-side alignment (Local↔centerLeft + centerRight↔Repo content-bounded, no empty rows) (DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x — both sides content-bounded, no empty-row mapping' : 'RED (a side maps empty/blank rows)');
process.exitCode = green ? 0 : 1;
