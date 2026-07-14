// REPRO of Tron's report: NO R30.13 gutters/ribbons on his REAL case — src/ts/server/Room.ts (LARGE file),
// 2-way (no-merge-base), DESKTOP, on the new bundle. My money-shot was a tiny 8-line 3-way. This opens the
// LARGE real file 2-way and measures whether the inter-pane gutters (≫/≪/✕/🪄) + ribbons ACTUALLY render —
// DOM-present AND on-screen — immediately (Tron's first paint) vs after a scroll nudge. If they don't render
// in 2-way/large-file → real bug (not cache). SystemTester, desktop 1600x1000, fresh (new bundle).

import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import path from 'path';
import fs from 'fs';
const BASE = 'https://prod.wo-da.de:4444';
const OUT = path.join('/var/dev/Workspaces/web4x/Web4RawBin', 'test-results/merge-visual');
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const ROOM = 'src/ts/server/Room.ts';
const OLD_REF = 'a382ce83d'; // Sprint 1 — oldest Room.ts; big 2-way diff vs current

const measure = (page) => page.evaluate(() => {
  const el = document.querySelector('rb-diff-editor');
  if (!el) return { noEl: true };
  const panes = el.querySelector('.de-panes');
  const pr = panes?.getBoundingClientRect();
  const onScreen = (sel) => [...document.querySelectorAll(sel)].filter(b => { const r = b.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.top >= pr.top - 2 && r.top <= pr.bottom + 2 && r.left >= pr.left - 30 && r.left <= pr.right; }).length;
  const stripL = el.querySelector('.de-gutter-left')?.getBoundingClientRect();
  return {
    twoWay: el.twoWay, hunks: (el.conflicts || []).length,
    leftLines: (el.left?.content || '').split('\n').length, rightLines: (el.right?.content || '').split('\n').length,
    centerLines: (el.edCenter?.getValue?.() || '').split('\n').length,
    domTake: document.querySelectorAll('rb-diff-editor .de-gutter-left [data-act="left"], rb-diff-editor .de-gutter-right [data-act="right"]').length,
    domIgnore: document.querySelectorAll('rb-diff-editor [data-act="ignore"]').length,
    onScreenIcons: onScreen('rb-diff-editor .de-gutter-left [data-act], rb-diff-editor .de-gutter-right [data-act]'),
    ribbonPaths: document.querySelectorAll('rb-diff-editor .de-ribbons path').length,
    onScreenRibbons: onScreen('rb-diff-editor .de-ribbons path'),
    count: (document.querySelector('rb-diff-editor .de-count')?.textContent || '').trim(),
    stripLeftPx: stripL ? Math.round(stripL.left) : null, stripWidth: stripL ? Math.round(stripL.width) : null,
    stripVisible: stripL ? (stripL.left >= 0 && stripL.width > 0) : false,
  };
});

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const R = {};
try {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1600, height: 1000 } });
  await seedSystemTester(ctx);
  const page = await ctx.newPage();
  // mount editor, then drive Tron's case: LEFT = working Room.ts (no ref), RIGHT = Room.ts@old → 2-way (no merge-base)
  await page.goto(`${BASE}/edit/README.md`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#tb-diff', { timeout: 20000 });
  await page.evaluate(() => document.querySelector('#tb-diff')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await page.waitForFunction(() => !!document.querySelector('rb-diff-editor .de-count'), { timeout: 20000 }).catch(() => {});
  await sleep(1500);
  // LEFT first (this fires populateRightHistory which async-auto-loads right=newest) — let it finish, THEN load our old ref LAST so it wins
  await page.evaluate(async (room) => { const el = document.querySelector('rb-diff-editor'); await el.loadSide('left', { path: room }); }, ROOM);
  await sleep(2500); // let populateRightHistory's auto-load settle
  const load = await page.evaluate(async ({ room, ref }) => {
    const el = document.querySelector('rb-diff-editor');
    await el.loadSide('right', { path: room, ref });     // OLD version — loaded LAST, wins over history auto-load
    await el.computeMergedCenter();
    return { left: (el.left?.content || '').length, right: (el.right?.content || '').length, rightRef: el.right?.ref, twoWay: el.twoWay };
  }, { room: ROOM, ref: OLD_REF });
  R.load = load;
  console.log(`(guard) right.ref after last load = ${load.rightRef} (want ${OLD_REF}) | left=${load.left}B right=${load.right}B`);

  // (A) IMMEDIATE — Tron's first paint, NO scroll nudge
  await sleep(400);
  R.immediate = await measure(page);
  R.shots_imm = path.join(OUT, 'repro-room-2way-immediate.png');
  await page.locator('rb-diff-editor').screenshot({ path: R.shots_imm }).catch(() => {});

  // (B) AFTER SCROLL NUDGE — the expert's "one scroll realigns"
  await page.evaluate(async () => { const el = document.querySelector('rb-diff-editor'); if (el?.edCenter) { el.edCenter.setScrollTop(120); await new Promise(r => setTimeout(r, 250)); el.edCenter.setScrollTop(0); } });
  await sleep(600);
  R.afterScroll = await measure(page);
  R.shots_scroll = path.join(OUT, 'repro-room-2way-afterscroll.png');
  await page.locator('rb-diff-editor').screenshot({ path: R.shots_scroll }).catch(() => {});
  await ctx.close();
} finally { await browser.close(); }

console.log('=== REPRO Tron: Room.ts (501-line) 2-way, desktop 1600x1000 ===');
console.log(`load: leftBytes=${R.load?.left} rightBytes=${R.load?.right} twoWay=${R.load?.twoWay}`);
const dump = (tag, m) => m?.noEl ? console.log(`${tag}: NO rb-diff-editor`) :
  console.log(`${tag}: 2way=${m.twoWay} hunks=${m.hunks} L/C/R lines=${m.leftLines}/${m.centerLines}/${m.rightLines} | DOM take=${m.domTake} ignore=${m.domIgnore} | ON-SCREEN icons=${m.onScreenIcons} ribbons=${m.onScreenRibbons}(dom ${m.ribbonPaths}) | count="${m.count}" | strip left=${m.stripLeftPx}px w=${m.stripWidth} visible=${m.stripVisible}`);
dump('IMMEDIATE (first paint)', R.immediate);
dump('AFTER SCROLL   ', R.afterScroll);
console.log('shots:', R.shots_imm, '|', R.shots_scroll);
// The bug signature Tron reports = gutters/ribbons NOT visible on first paint (on-screen icons/ribbons == 0)
const im = R.immediate || {}, af = R.afterScroll || {};
const firstPaintBroken = (im.onScreenIcons === 0 || im.onScreenRibbons === 0) && (af.onScreenIcons > 0 && af.onScreenRibbons > 0);
const alwaysBroken = (af.onScreenIcons === 0 || af.onScreenRibbons === 0);
const rendersFine = im.onScreenIcons > 0 && im.onScreenRibbons > 0;
console.log('\nVERDICT:', alwaysBroken ? 'RED — gutters/ribbons NOT on-screen even after scroll (REAL BUG, large 2-way file)' : firstPaintBroken ? 'FIRST-PAINT BUG — invisible until scroll (matches Tron; scroll-redraw needed on load)' : rendersFine ? 'RENDERS FINE immediately — points back to cache/other, not a large-2way render bug' : 'INCONCLUSIVE');
