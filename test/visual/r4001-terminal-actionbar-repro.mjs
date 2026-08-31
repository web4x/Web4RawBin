// R40.01 BY-CONSTRUCTION GATE @390 — a detail element that does NOT extend RbDetailBase must STILL get its action bar.
// rb-terminal-detail extends HTMLElement (not RbDetailBase) so it never self-dispatched rb-drawer-detail-shown → the
// otmuxpane/terminal drawer got NO action bar (Tron's regression, root e55e5de7e). FIX 198951f16 (by-construction, INV-E1):
// the SHARED drawer emits showActionsForType(type,ref) on EVERY mount in renderDetailForRef — not relying on the element.
// Mount rb-terminal-detail directly in rb-detail-drawer via an otmuxpane ref (NO tree, NO pane, NO websocket, NO prod).
// ★ DIFFERENTIAL (PO: the fix is already live @0.8.153, so a same-version run can't fail): RED arm builds the PRE-FIX
//   bundle (198951f16^) in an isolated scratch → MUST render NO bar; GREEN arm builds HEAD → MUST render the bar. Both shown.
import { webkit, devices } from '@playwright/test';
import { setupFoundation } from './r4031-foundation.mjs';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
fs.mkdirSync('test-results/r4001', { recursive: true });
const FIX = '198951f16';
const preFix = execSync(`git rev-parse --short ${FIX}^`, { encoding: 'utf8' }).trim();
const head = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
const OTMUXPANE_REF = 'otmuxpane:%17'; // type=otmuxpane → renderDetailForRef mounts rb-terminal-detail + showActionsForType

async function runArm(commit, label, shot) {
  const f = await setupFoundation({ buildDist: true, commit });
  let res = { commit: f.worktreeSha, sha: commit, actionBar: null };
  const browser = await webkit.launch();
  try {
    const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
    const page = await ctx.newPage();
    await page.goto(f.base + '/trace', { waitUntil: 'networkidle' }).catch(() => {});
    await page.waitForFunction(() => !!customElements.get('rb-detail-drawer'), { timeout: 20000 }).catch(() => {});
    await sleep(600);
    // mount the drawer with an otmuxpane ref → drawer mounts rb-terminal-detail (HTMLElement, non-base) + (post-fix) emits the action-bar signal
    await page.evaluate((ref) => { let d = document.querySelector('rb-detail-drawer'); if (!d) { d = document.createElement('rb-detail-drawer'); document.body.appendChild(d); } d.setAttribute('open', ''); d.removeAttribute('minimized'); d.setAttribute('ref', ref); }, OTMUXPANE_REF);
    await sleep(2200);
    await page.screenshot({ path: `test-results/r4001/${shot}.png` }).catch(() => {});
    const bar = await page.evaluate(() => {
      const d = document.querySelector('rb-detail-drawer');
      const isTerminal = !!d?.querySelector('rb-terminal-detail');
      // action bar = rb-strip / action-bar region populated with action button(s) (the 'open-rc' otmuxpane action)
      const region = d?.querySelector('rb-strip, .drawer-actionbar, [class*="actionbar"], .action-bar');
      const buttons = d?.querySelectorAll('rb-strip button, [class*="actionbar"] button, .drawer-actionbar button, .action-bar button, rb-strip [role="button"]').length || 0;
      return { isTerminal, regionPresent: !!region, buttons, rendered: buttons > 0 };
    });
    res.actionBar = bar;
    console.log(`  ${label} (${commit}=${f.worktreeSha}): terminal-mounted=${bar.isTerminal} | action-bar rendered=${bar.rendered} (region=${bar.regionPresent}, buttons=${bar.buttons})`);
    await ctx.close();
  } finally { await browser.close().catch(() => {}); const td = await f.teardown(); console.log(`  teardown prodUp=${td.prodUp} leftover=${td.leftover}`); }
  return res;
}

console.log(`R40.01 by-construction differential: PRE-FIX ${preFix} (198951f16^) vs HEAD ${head}`);
const red = await runArm(preFix, 'RED (pre-fix, MUST have NO bar)', 'PREFIX-no-actionbar');
const green = await runArm('HEAD', 'GREEN (post-fix, MUST render bar)', 'FIXED-actionbar');

// ── verdict ──
const redProven = red.actionBar && red.actionBar.isTerminal && red.actionBar.rendered === false;  // pre-fix: terminal mounts but NO bar
const greenProven = green.actionBar && green.actionBar.isTerminal && green.actionBar.rendered === true; // post-fix: terminal mounts + bar renders
console.log(`\n═══ R40.01 BY-CONSTRUCTION GATE (@390, differential) ═══`);
console.log(`property: a detail element NOT extending RbDetailBase (rb-terminal-detail) must STILL get its action bar.`);
console.log(`RED  (pre-fix ${preFix}): terminal mounted + NO action bar = ${redProven} ${redProven ? '← the gate CAN fail (regression reproduced)' : '← RED NOT PROVEN, gate may be vacuous'}`);
console.log(`GREEN (post-fix HEAD): terminal mounted + action bar renders = ${greenProven}`);
const pass = redProven && greenProven;
console.log(`\nVERDICT: ${pass ? 'VERIFIED — RED on pre-fix (no bar) + GREEN on the fix (bar renders); the by-construction property is gated, 3rd regression blocked' : 'INCONCLUSIVE — ' + (!redProven ? 'RED not proven (gate could be vacuous — mounting standalone may be fiddly, STOP + Tron eyes)' : 'GREEN not proven')}`);
process.exit(pass ? 0 : 1);
