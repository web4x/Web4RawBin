// [test:uuid:4ca2ff58-1f79-4299-80c9-4dd6edf9c725] R30.16 RbDiffEditor.alignPaneRows (impl 17c71adf) — viewZone blank-row spacers align each change row L↔C↔R (near-horizontal ribbons) + scrollBeyondLastLine
// [test:uuid:ae075854-70b7-4760-96a1-2ee6b84b3e4e] R30.16 RbDiffEditor.renderCenterChangeBlocks (impl 37c9694c) — colored ROUNDED center blocks (de-block-conflict #a5603a / change #3a6ea5 / resolvable #3a8a5a) color-matched to the connector ribbons (shared CONFLICT_PALETTE)
// R30.16 full IntelliJ merge layout (v0.7.23): (1) ribbons VISIBLE in the widened 34px gutter, (2) colored rounded center
// blocks, (3) ribbons+blocks color-match (shared palette), (4) rows aligned L↔C↔R, (5) scroll-to-last-line, (6) 2-way lit.
// SystemTester, desktop 1600x1000, DET-3x on the 3-way. Money-shot r3016-intellij-layout.png for the Rider side-by-side.
// Fixture refs = local git plumbing (no working-tree/main touch), torn down after.

import { execSync } from 'child_process';
import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import fs from 'fs';
import path from 'path';

const REPO = '/var/dev/Workspaces/web4x/Web4RawBin';
const BASE = 'https://prod.wo-da.de:4444';
const OUT = path.join(REPO, 'test-results/merge-visual');
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const shot = async (page, name) => { const p = path.join(OUT, name); await page.locator('rb-diff-editor').screenshot({ path: p }).catch(async () => { await page.screenshot({ path: p }); }); return p; };
const PALETTE = { conflict: '#a5603a', change: '#3a6ea5', resolvable: '#3a8a5a' };

const DEMO = 'merge-demo.md';
const baseC = `# Merge Demo\none\ntwo\nthree\nfour\nfive\nsix\nseven\n`;
const localC = `# Merge Demo\none\nTWO-local\nthree\nfour\nfive\nSIX-LOCAL\nseven\n`;
const remoteC = `# Merge Demo\none\ntwo\nthree\nFOUR-remote\nfive\nSIX-REMOTE\nseven\n`;
const genv = { ...process.env, GIT_AUTHOR_NAME: 'robbin-tester', GIT_AUTHOR_EMAIL: 't@wo-da.de', GIT_COMMITTER_NAME: 'robbin-tester', GIT_COMMITTER_EMAIL: 't@wo-da.de', GIT_AUTHOR_DATE: '2026-01-01T00:00:00', GIT_COMMITTER_DATE: '2026-01-01T00:00:00' };
const g = (a, i) => execSync(`git -C ${REPO} ${a}`, { encoding: 'utf8', input: i, env: genv }).trim();
const tree = (b) => g('mktree', `100644 blob ${b}\t${DEMO}\n`);
const blob = (c) => g('hash-object -w --stdin', c);
function setupFixture() { const bc = g(`commit-tree ${tree(blob(baseC))} -m base`); const lc = g(`commit-tree ${tree(blob(localC))} -p ${bc} -m l`); const rc = g(`commit-tree ${tree(blob(remoteC))} -p ${bc} -m r`); g(`update-ref refs/heads/rb-merge-base ${bc}`); g(`update-ref refs/heads/rb-merge-local ${lc}`); g(`update-ref refs/heads/rb-merge-remote ${rc}`); }
function teardownFixture() { for (const r of ['rb-merge-base', 'rb-merge-local', 'rb-merge-remote']) { try { g(`update-ref -d refs/heads/${r}`); } catch {} } }

async function mount(page) {
  await page.goto(`${BASE}/edit/README.md`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#tb-diff', { timeout: 20000 });
  await page.evaluate(() => document.querySelector('#tb-diff')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await page.waitForFunction(() => !!document.querySelector('rb-diff-editor .de-count'), { timeout: 20000 }).catch(() => {});
  await sleep(1500);
}
async function settle(page) { await page.evaluate(async () => { const el = document.querySelector('rb-diff-editor'); if (el?.edCenter) { el.edCenter.setScrollTop(24); await new Promise(r => setTimeout(r, 200)); el.edCenter.setScrollTop(0); } }); await sleep(700); }

const measure = (page) => page.evaluate((PAL) => {
  const el = document.querySelector('rb-diff-editor');
  const panes = el.querySelector('.de-panes'); const pr = panes.getBoundingClientRect();
  // gutter width: gap between center pane right and remote pane left
  const cM = el.querySelector('.de-center').getBoundingClientRect(), rM = el.querySelector('.de-remote').getBoundingClientRect();
  const gutterPx = Math.round(rM.left - cM.right);
  const ribbons = [...document.querySelectorAll('rb-diff-editor .de-ribbons path')];
  const onScreen = (els) => els.filter(b => { const r = b.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.top >= pr.top - 2 && r.top <= pr.bottom + 2; }).length;
  const ribbonFills = [...new Set(ribbons.map(p => (p.getAttribute('fill') || '').toLowerCase()))];
  const blocks = { conflict: document.querySelectorAll('rb-diff-editor .de-block-conflict').length, change: document.querySelectorAll('rb-diff-editor .de-block-change').length, resolvable: document.querySelectorAll('rb-diff-editor .de-block-resolvable').length };
  // alignment: conflict 0 top Y across L / C / R via the component's own lineY
  let align = null;
  const c0 = (el.conflicts || [])[0];
  if (c0 && el.lineY) { const L = el.lineY(el.edLocal, c0.aStart), C = el.lineY(el.edCenter, c0.span[0]), Rr = el.lineY(el.edRemote, c0.bStart); align = { L: Math.round(L), C: Math.round(C), R: Math.round(Rr), spread: Math.round(Math.max(L, C, Rr) - Math.min(L, C, Rr)) }; }
  const zones = el._zoneIds ? (el._zoneIds.local.length + el._zoneIds.center.length + el._zoneIds.remote.length) : 0;
  const scrollBeyondLast = !!el.edCenter?.getRawOptions?.().scrollBeyondLastLine;
  return { twoWay: el.twoWay, hunks: (el.conflicts || []).length, gutterPx, ribbonCount: ribbons.length, ribbonsOnScreen: onScreen(ribbons), ribbonFills, blocks, align, zones, scrollBeyondLast, count: (document.querySelector('rb-diff-editor .de-count')?.textContent || '').trim() };
}, PALETTE);

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const R = { three: [], two: null, shots: [] };
try {
  setupFixture();
  // ===== 3-way (conflict → brown block + brown ribbon + alignment) DET-3x =====
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1600, height: 1000 } });
    await seedSystemTester(ctx); const page = await ctx.newPage();
    await mount(page);
    await page.evaluate(async (demo) => { const el = document.querySelector('rb-diff-editor'); await el.loadSide('left', { path: demo, ref: 'rb-merge-local' }); await el.loadSide('right', { path: demo, ref: 'rb-merge-remote' }); await el.computeMergedCenter(); }, DEMO);
    for (let k = 0; k < 20; k++) { const ok = await page.evaluate(() => { const el = document.querySelector('rb-diff-editor'); return el && el.right?.ref === 'rb-merge-remote' && el.base !== '' && (el.conflicts || []).length >= 1; }); if (ok) break; await sleep(300); }
    await settle(page);
    const m = await measure(page);
    const ribbonsVisible = m.ribbonCount >= 1 && m.ribbonsOnScreen >= 1 && m.gutterPx >= 28;               // (1) visible in ~34px gutter
    const centerBlocks = m.blocks.conflict >= 1;                                                            // (2) colored center block (brown conflict)
    const colorMatch = m.ribbonFills.includes(PALETTE.conflict) && m.blocks.conflict >= 1;                  // (3) ribbon brown ↔ conflict block share palette
    const aligned = m.align && m.align.spread <= 10;                                                        // (4) rows aligned L↔C↔R
    const scrollLast = m.scrollBeyondLast === true;                                                         // (5)
    const pass = ribbonsVisible && centerBlocks && colorMatch && aligned && scrollLast && m.twoWay === false;
    R.three.push({ pass, m });
    console.log(`3-WAY iter ${i}: gutter=${m.gutterPx}px ribbons=${m.ribbonCount}(on-screen ${m.ribbonsOnScreen}) fills=[${m.ribbonFills}] blocks=${JSON.stringify(m.blocks)} align(L/C/R spread)=${m.align ? `${m.align.L}/${m.align.C}/${m.align.R} Δ${m.align.spread}` : 'n/a'} zones=${m.zones} scrollBeyondLast=${m.scrollBeyondLast} => ${pass ? 'GREEN' : 'RED'}`);
    if (i === 1) R.shots.push(await shot(page, 'r3016-intellij-layout.png'));
    await ctx.close();
  }
  // ===== 2-way README (fully lit — blue change blocks + many ribbons) =====
  {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1600, height: 1000 } });
    await seedSystemTester(ctx); const page = await ctx.newPage();
    await mount(page);
    await page.evaluate(() => { const s = document.querySelector('rb-diff-editor .de-history'); if (s) { const o = [...s.querySelectorAll('option')]; s.value = o[o.length - 1].value; s.dispatchEvent(new Event('change', { bubbles: true })); } });
    await sleep(3000); await settle(page);
    const m = await measure(page);
    const pass = m.twoWay === true && m.ribbonCount >= 1 && m.ribbonsOnScreen >= 1 && m.gutterPx >= 28 && m.blocks.change >= 1 && m.ribbonFills.includes(PALETTE.change);
    R.two = { pass, m };
    console.log(`2-WAY lit: gutter=${m.gutterPx}px ribbons=${m.ribbonCount}(on-screen ${m.ribbonsOnScreen}) fills=[${m.ribbonFills}] blocks=${JSON.stringify(m.blocks)} count="${m.count}" => ${pass ? 'GREEN' : 'RED'}`);
    R.shots.push(await shot(page, 'r3016-2way-lit.png'));
    await ctx.close();
  }
} finally { teardownFixture(); await browser.close(); }

const threeGreen = R.three.length === 3 && R.three.every(r => r.pass);
console.log('\n===== R30.16 IntelliJ layout (align + center-blocks + visible ribbons) =====');
R.three.forEach((r, i) => console.log(`  3-way iter ${i + 1}: ${r.pass ? 'GREEN' : 'RED'}`));
console.log(`  2-way fully lit: ${R.two?.pass ? 'GREEN' : 'RED'}`);
console.log('  shots:', R.shots.join(' | '));
const green = threeGreen && R.two?.pass;
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
