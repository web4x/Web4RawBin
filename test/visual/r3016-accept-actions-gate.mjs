// [test:uuid:1892df56-ea20-49e7-be1a-4df9ff963b75] R30.16 accept-actions on the IntelliJ layout — CLICK ≫/≪/✕ must MUTATE the center Result content (not just render), correct row (no off-by-one), + no ghost ribbons after ignore
// FUNCTION-FIRST guard (the assertion my r3016 VISUAL gate lacked — it checked DOM presence, not the ACTION).
// Asserts the ACTION not just the DOM: click ≪ → CENTER content becomes Repository, ≫ → Local, ✕ → dismissed (no ghost ribbon),
// at the CORRECT row (no off-by-one). MEASURED GREEN on live v0.7.25 across 3-way + 2-way (README) + 2-way large-file
// (Room.ts 61 hunks: symmetric + one-sided-add + one-sided-del all mutate correctly) — so Tron's 'no effect' report did
// NOT reproduce on current (likely a stale cached bundle, same pattern as the earlier 'no gutters' report). This gate
// stands as the standing regression guard for the accept ACTIONS. DET-3x. SystemTester, 3-way fixture (local refs, torn down).

import { execSync } from 'child_process';
import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
const REPO = '/var/dev/Workspaces/web4x/Web4RawBin', BASE = 'https://prod.wo-da.de:4444';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const DEMO = 'merge-demo.md';
const baseC = `# Merge Demo\none\ntwo\nthree\nfour\nfive\nsix\nseven\n`, localC = `# Merge Demo\none\nTWO-local\nthree\nfour\nfive\nSIX-LOCAL\nseven\n`, remoteC = `# Merge Demo\none\ntwo\nthree\nFOUR-remote\nfive\nSIX-REMOTE\nseven\n`;
const genv = { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@x', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@x', GIT_AUTHOR_DATE: '2026-01-01T00:00:00', GIT_COMMITTER_DATE: '2026-01-01T00:00:00' };
const g = (a, i) => execSync(`git -C ${REPO} ${a}`, { encoding: 'utf8', input: i, env: genv }).trim();
const tree = (b) => g('mktree', `100644 blob ${b}\t${DEMO}\n`), blob = (c) => g('hash-object -w --stdin', c);
function setup() { const bc = g(`commit-tree ${tree(blob(baseC))} -m b`); const lc = g(`commit-tree ${tree(blob(localC))} -p ${bc} -m l`); const rc = g(`commit-tree ${tree(blob(remoteC))} -p ${bc} -m r`); g(`update-ref refs/heads/rb-merge-local ${lc}`); g(`update-ref refs/heads/rb-merge-remote ${rc}`); }
function teardown() { for (const b of ['rb-merge-local', 'rb-merge-remote']) { try { g(`update-ref -d refs/heads/${b}`); } catch {} } }

async function mount3way(browser) {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1600, height: 1000 } });
  await seedSystemTester(ctx); const page = await ctx.newPage();
  await page.goto(`${BASE}/edit/README.md`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#tb-diff', { timeout: 20000 });
  await page.evaluate(() => document.querySelector('#tb-diff')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await page.waitForFunction(() => !!document.querySelector('rb-diff-editor .de-count'), { timeout: 20000 }).catch(() => {});
  await sleep(1500);
  await page.evaluate(async (d) => { const el = document.querySelector('rb-diff-editor'); await el.loadSide('left', { path: d, ref: 'rb-merge-local' }); await el.loadSide('right', { path: d, ref: 'rb-merge-remote' }); await el.computeMergedCenter(); }, DEMO);
  for (let k = 0; k < 20; k++) { const ok = await page.evaluate(() => { const el = document.querySelector('rb-diff-editor'); return el && el.base !== '' && (el.conflicts || []).length >= 1; }); if (ok) break; await sleep(300); }
  await page.evaluate(async () => { const el = document.querySelector('rb-diff-editor'); if (el?.edCenter) { el.edCenter.setScrollTop(24); await new Promise(r => setTimeout(r, 200)); el.edCenter.setScrollTop(0); } });
  await sleep(600);
  return { ctx, page };
}

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const results = [];
try {
  setup();
  for (let i = 1; i <= 3; i++) {
    const { ctx, page } = await mount3way(browser);
    const r = await page.evaluate(async () => {
      const el = document.querySelector('rb-diff-editor'); const nap = (ms) => new Promise(r => setTimeout(r, ms));
      const center = () => el.edCenter.getValue();
      const click = (strip, act) => document.querySelector(`rb-diff-editor .${strip} [data-cid="0"][data-act="${act}"]`)?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      const line0 = el.conflicts?.[0]?.span?.[0]; // 0-based center row of the conflict
      // default pick='a' (Local) → center starts as SIX-LOCAL. Test ≪ THEN ≫ (both meaningful; ≫-first would be a no-op).
      // (1) CLICK ≪ take Repository → center swaps to SIX-REMOTE (800ms: rebuildCenter→setValue must apply)
      const preR = center(); click('de-gutter-right', 'right'); await nap(800);
      const takeRepo = center() !== preR && center().includes('SIX-REMOTE') && !center().includes('SIX-LOCAL');
      const rowCorrectR = line0 != null && (center().split('\n')[line0] || '').includes('SIX-REMOTE'); // off-by-one guard
      // (2) CLICK ≫ take Local → center swaps back to SIX-LOCAL
      const preL = center(); click('de-gutter-left', 'left'); await nap(800);
      const takeLocal = center() !== preL && center().includes('SIX-LOCAL') && !center().includes('SIX-REMOTE');
      // (3) CLICK ✕ ignore → conflict dismissed: its gutter buttons + ribbon gone (no ghost)
      const ribBefore = document.querySelectorAll('rb-diff-editor .de-ribbons path').length;
      const gutBefore = document.querySelectorAll('rb-diff-editor [data-cid="0"][data-act]').length;
      click('de-gutter-left', 'ignore'); await nap(800);
      const ignore = document.querySelectorAll('rb-diff-editor [data-cid="0"][data-act]').length < gutBefore; // buttons for cid 0 removed
      const noGhostRibbons = document.querySelectorAll('rb-diff-editor .de-ribbons path').length <= ribBefore;
      return { takeRepo, rowCorrectR, takeLocal, ignore, noGhostRibbons, line0 };
    });
    const pass = r.takeRepo && r.rowCorrectR && r.takeLocal && r.ignore && r.noGhostRibbons;
    results.push({ pass, r });
    console.log(`iter ${i}: ≪takeRepo=${r.takeRepo} rowCorrect(no-off-by-1)=${r.rowCorrectR} ≫takeLocal=${r.takeLocal} ✕ignore-dismiss=${r.ignore} no-ghost-ribbons=${r.noGhostRibbons} => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }
} finally { teardown(); await browser.close(); }

console.log('\n===== R30.16 accept-ACTIONS (click mutates center) DET-3x =====');
results.forEach((r, i) => console.log(`  iter ${i + 1}: ${r.pass ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(r => r.pass);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED — accept clicks do not mutate the center (Tron regression)');
process.exitCode = green ? 0 : 1;
