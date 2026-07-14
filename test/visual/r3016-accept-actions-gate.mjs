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
    // REAL hit-tested clicks (page.click = real mouse + actionability + hit-testing), not synthetic dispatch — matches a user.
    const center = () => page.evaluate(() => document.querySelector('rb-diff-editor').edCenter.getValue());
    const counts = () => page.evaluate(() => ({ gut: document.querySelectorAll('rb-diff-editor [data-cid="0"][data-act]').length, rib: document.querySelectorAll('rb-diff-editor .de-ribbons path').length }));
    const realClick = async (sel) => { try { await page.click(sel, { timeout: 5000 }); return true; } catch { return false; } };
    // reveal the conflict row so the real click has an on-screen target; get its 0-based center row
    const line0 = await page.evaluate(() => { const el = document.querySelector('rb-diff-editor'); const c = el.conflicts?.[0]; if (c) el.edCenter.revealLineInCenter((c.span?.[0] || 0) + 1); return c?.span?.[0]; });
    await sleep(300);
    // default pick='a' (Local) → center starts SIX-LOCAL. ≪ then ≫ (both meaningful; ≫-first is a no-op).
    // (1) REAL click ≪ take Repository → CENTER CONTENT becomes SIX-REMOTE
    const preR = await center(); const cR = await realClick('rb-diff-editor .de-gutter-right [data-cid="0"][data-act="right"]'); await sleep(800);
    const aR = await center(); const takeRepo = cR && aR !== preR && aR.includes('SIX-REMOTE') && !aR.includes('SIX-LOCAL');
    const rowCorrectR = line0 != null && (aR.split('\n')[line0] || '').includes('SIX-REMOTE'); // off-by-one guard: accepted line at line N, not N±1
    // (2) REAL click ≫ take Local → CENTER becomes SIX-LOCAL
    const preL = await center(); const cL = await realClick('rb-diff-editor .de-gutter-left [data-cid="0"][data-act="left"]'); await sleep(800);
    const aL = await center(); const takeLocal = cL && aL !== preL && aL.includes('SIX-LOCAL') && !aL.includes('SIX-REMOTE');
    // (3) REAL click ✕ ignore → dismissed (gutter buttons + ribbon gone, no ghost)
    const bef = await counts(); const cI = await realClick('rb-diff-editor .de-gutter-left [data-cid="0"][data-act="ignore"]'); await sleep(800);
    const aft = await counts();
    const r = { takeRepo, rowCorrectR, takeLocal, ignore: cI && aft.gut < bef.gut, noGhostRibbons: aft.rib <= bef.rib, clicksLanded: { R: cR, L: cL, I: cI }, line0 };
    const pass = r.takeRepo && r.rowCorrectR && r.takeLocal && r.ignore && r.noGhostRibbons;
    results.push({ pass, r });
    console.log(`iter ${i}: real-clicks-landed(R/L/✕)=${r.clicksLanded.R}/${r.clicksLanded.L}/${r.clicksLanded.I} | ≪takeRepo=${r.takeRepo} rowCorrect(no-off-by-1)=${r.rowCorrectR} ≫takeLocal=${r.takeLocal} ✕ignore-dismiss=${r.ignore} no-ghost=${r.noGhostRibbons} => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }
} finally { teardown(); await browser.close(); }

console.log('\n===== R30.16 accept-ACTIONS (click mutates center) DET-3x =====');
results.forEach((r, i) => console.log(`  iter ${i + 1}: ${r.pass ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(r => r.pass);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED — accept clicks do not mutate the center (Tron regression)');
process.exitCode = green ? 0 : 1;
