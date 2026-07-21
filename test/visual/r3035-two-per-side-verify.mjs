// R30.35 AC-two-per-side-blocks EXPERT VERIFY (v0.7.56): a both-versions change draws TWO half-ribbons
// (Local<->centerLeft + Repository<->centerRight) + TWO center blocks (older dark + newer highlighted).
// Reuses the r3035 synthetic fixture (line-conflict = both-versions). Screenshot is the primary evidence.
import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import fs from 'fs';
const BASE = 'https://prod.wo-da.de:4444';
const DEEP = `${BASE}/edit/otmux?repo=oosh&left=516ebb3&right=dev&3way=1`;
const OUT = new URL('../../test-results/r3035-two-per-side/', import.meta.url).pathname;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const F = {
  base:  ['=fixhdr=', 'line-modify-BASE', 'mid-1', 'line-delete-BASE', 'mid-2', 'mid-3', 'line-conflict-BASE', '=fixftr='].join('\n'),
  left:  ['=fixhdr=', 'line-modify-LEFTCHANGE', 'mid-1', 'line-delete-BASE', 'mid-2', 'line-added-by-LEFT', 'mid-3', 'line-conflict-LEFTSIDE', '=fixftr='].join('\n'),
  right: ['=fixhdr=', 'line-modify-BASE', 'mid-1', 'mid-2', 'mid-3', 'line-conflict-RIGHTSIDE', '=fixftr='].join('\n'),
};
const cfg = await (await fetch(`${BASE}/api/config`, {}).catch(() => null))?.json?.().catch(() => ({})) ?? {};
console.log('prod version:', cfg.version);
try { fs.mkdirSync(OUT, { recursive: true }); } catch {}
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1500, height: 950 } });
await seedSystemTester(ctx); const page = await ctx.newPage();
await page.goto(DEEP, { waitUntil: 'networkidle' });
await page.waitForFunction(() => { const e = document.querySelector('rb-diff-editor'); return e?.left?.content?.length > 0 && e['edCenter']; }, { timeout: 20000 }).catch(() => {});
await sleep(700);
await page.evaluate(async ({ b, l, r }) => { const e = document.querySelector('rb-diff-editor'); e.left = { path: 'fx.txt', ref: 'L', repo: '', content: l }; e.right = { path: 'fx.txt', ref: 'R', repo: '', content: r }; e['edLocal'].setValue(l); e['edRemote'].setValue(r); e['resolveBase'] = async () => b; await e['computeMergedCenter'](); }, { b: F.base, l: F.left, r: F.right });
await sleep(900);
await page.screenshot({ path: OUT + 'two-per-side.png' });
const res = await page.evaluate(() => {
  const e = document.querySelector('rb-diff-editor');
  const conflicts = (e['conflicts'] || []).filter(c => !(e['dismissed'] && e['dismissed'].has(c.id)));
  const bv = conflicts.find(c => c.a.length > 0 && c.b.length > 0); // both-versions change
  const paths = [...(e.querySelector('.de-ribbons')?.querySelectorAll('path') || [])].map(p => p.getAttribute('d') || '');
  const subpaths = (d) => (d.match(/M/g) || []).length; // subpath count per ribbon path
  // center blocks for the both-versions change: older = de-block-conflict, newer = de-newer-conflict
  const olderBlocks = e.querySelectorAll('.de-block-conflict:not(.de-newer-conflict)').length;
  const newerBlocks = e.querySelectorAll('.de-newer-conflict').length;
  return {
    bothVersionsChange: bv ? { kind: bv.kind, aLen: bv.a.length, bLen: bv.b.length, olderLen: bv.olderLen, span: bv.span } : null,
    ribbonPaths: paths.length,
    ribbonSubpathCounts: paths.map(subpaths),
    hasTwoSubpathRibbon: paths.some(d => subpaths(d) === 2), // a both-versions half-ribbon pair
    centerOlderBlocks: olderBlocks, centerNewerBlocks: newerBlocks,
  };
});
console.log(JSON.stringify(res, null, 2));
await browser.close();
