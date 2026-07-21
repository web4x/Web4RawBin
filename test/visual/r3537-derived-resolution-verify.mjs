// R30.35+R30.37 OPTION A EXPERT VERIFY (v0.7.57): derived resolution + center-state per-side buttons.
import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import fs from 'fs';
const BASE = 'https://prod.wo-da.de:4444';
const DEEP = `${BASE}/edit/otmux?repo=oosh&left=516ebb3&right=dev&3way=1`;
const OUT = new URL('../../test-results/r3537-derived/', import.meta.url).pathname;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const F = {
  base:  ['=fixhdr=', 'line-conflict-BASE', 'mid-1', 'mid-2', '=fixftr='].join('\n'),
  left:  ['=fixhdr=', 'line-conflict-LEFTSIDE', 'mid-1', 'mid-2', '=fixftr='].join('\n'),
  right: ['=fixhdr=', 'line-conflict-RIGHTSIDE', 'mid-1', 'mid-2', '=fixftr='].join('\n'),
};
const cfg = await (await fetch(`${BASE}/api/config`).catch(() => null))?.json?.().catch(() => ({})) ?? {};
console.log('prod version:', cfg.version);
try { fs.mkdirSync(OUT, { recursive: true }); } catch {}
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1500, height: 950 } });
await seedSystemTester(ctx); const page = await ctx.newPage();
await page.goto(DEEP, { waitUntil: 'networkidle' });
await page.waitForFunction(() => { const e = document.querySelector('rb-diff-editor'); return e?.left?.content?.length > 0 && e['edCenter']; }, { timeout: 20000 }).catch(() => {});
await sleep(700);
const inject = () => page.evaluate(async ({ b, l, r }) => { const e = document.querySelector('rb-diff-editor'); e.left = { path: 'fx.txt', ref: 'L', repo: '', content: l }; e.right = { path: 'fx.txt', ref: 'R', repo: '', content: r }; e['edLocal'].setValue(l); e['edRemote'].setValue(r); e['resolveBase'] = async () => b; await e['computeMergedCenter'](); }, { b: F.base, l: F.left, r: F.right });
await inject(); await sleep(800);
const btns = () => page.evaluate(() => { const e = document.querySelector('rb-diff-editor'); const c = (e['conflicts'] || []).find(x => x.a.length > 0 && x.b.length > 0); const acts = [...e.querySelectorAll(`[data-cid="${c?.id}"]`)].map(b => b.getAttribute('data-act')); const resolveBtn = e.querySelector('.de-resolve'); return { cid: c?.id, acts, openCount: e['openChangeCount'](), resolvedClass: resolveBtn?.classList.contains('resolved'), count: e.querySelector('.de-count')?.textContent }; });
const before = await btns();
await page.screenshot({ path: OUT + '1-both-versions.png' });
// press left-✕ (rm-left) on the both-versions change → should resolve + jump
await page.evaluate(() => { const e = document.querySelector('rb-diff-editor'); const c = (e['conflicts'] || []).find(x => x.a.length > 0 && x.b.length > 0); e.querySelector(`[data-cid="${c.id}"][data-act="rm-left"]`)?.click(); });
await sleep(600);
const after = await page.evaluate(() => { const e = document.querySelector('rb-diff-editor'); const c = (e['conflicts'] || []).find(x => x.b.length > 0 && !x.incl.a); const acts = c ? [...e.querySelectorAll(`[data-cid="${c.id}"]`)].map(b => b.getAttribute('data-act')) : []; return { cid: c?.id, inclA: c?.incl.a, inclB: c?.incl.b, acts, openCount: e['openChangeCount'](), resolvedClass: e.querySelector('.de-resolve')?.classList.contains('resolved'), currentId: e['_currentId'] }; });
await page.screenshot({ path: OUT + '2-after-rm-left.png' });
// (override) fresh 2-line change → nav to make it current → click ✓ → force-RESOLVE despite 2 lines
await inject(); await sleep(500);
const override = await page.evaluate(async () => {
  const e = document.querySelector('rb-diff-editor');
  const c = (e['conflicts'] || []).find(x => x.a.length > 0 && x.b.length > 0);
  e['_currentId'] = c.id; e['jumpToChange'] && e['jumpToChange'](0); e['_currentId'] = c.id;
  const openBefore = e['openChangeCount']();
  e['toggleResolved'](); // force-resolve the 2-line keep-both
  const stillBoth = c.incl.a && c.incl.b; // both versions REMAIN in center
  return { openBefore, openAfter: e['openChangeCount'](), stillBoth, solid: e.querySelector('.de-resolve')?.classList.contains('resolved') };
});
console.log('BEFORE (both-versions):', JSON.stringify(before));
console.log('AFTER rm-left       :', JSON.stringify(after));
console.log('OVERRIDE force-resolve:', JSON.stringify(override));
const ac_override = override.stillBoth && override.solid && override.openAfter === override.openBefore - 1; // resolved WITH both versions kept
const ac1 = before.acts?.includes('rm-left') && before.acts?.includes('rm-right') && !before.acts?.includes('add-left'); // 2-line → both ✕, no add
const ac_removed = after.inclA === false; // left dropped
const ac_resolved = after.resolvedClass === true; // derived checkmark solid
const ac_addback = after.acts?.includes('add-left'); // missing side (left) now shows add
const ac_count = after.openCount === before.openCount - 1; // decremented
console.log(`AC1 both-✕-no-add=${ac1} | rm-left→dropped=${ac_removed} | derived-RESOLVED(solid)=${ac_resolved} | add-back-shows=${ac_addback} | openCount ${before.openCount}→${after.openCount}(${ac_count}) | OVERRIDE keep-both-resolved=${ac_override} => ${ac1&&ac_removed&&ac_resolved&&ac_addback&&ac_count&&ac_override?'GREEN':'CHECK'}`);
await browser.close();
