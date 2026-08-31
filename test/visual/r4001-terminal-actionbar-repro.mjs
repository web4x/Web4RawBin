// R40.01 REGRESSION repro (Tron @390): the Server Manager otmux-tree TERMINAL DRAWER lost its ACTION BAR — header shows
// only grab-handle + ⛶ fullscreen + ✕, no action bar (rb-strip via setActions, rb-detail-drawer.ts action-bar region).
// BEFORE-IMAGE @390 real-WebKit. Isolated buildDist scratch (serves HEAD's regressed bundle; owner-auth + any device
// write stay in the torn-down worktree, NEVER prod). Screenshot evidence, not DOM counts.
import { webkit, devices } from '@playwright/test';
import { setupFoundation } from './r4031-foundation.mjs';
import fs from 'node:fs';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
fs.mkdirSync('test-results/r4001', { recursive: true });

const f = await setupFoundation({ buildDist: true });
const smSession = (/sm_session=([^;]+)/.exec(f.ownerHeaders().Cookie || '') || [])[1] || '';
console.log(`scratch up: ${f.base} v${f.servedVersion} sha=${f.worktreeSha} | sm_session=${!!smSession}`);
const browser = await webkit.launch();
try {
  const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  if (smSession) await ctx.addCookies([{ name: 'sm_session', value: smSession, domain: 'localhost', path: '/' }]);
  const page = await ctx.newPage();
  await page.goto(f.base + '/server-manager', { waitUntil: 'networkidle' }).catch(() => {});
  await sleep(2500);
  await page.screenshot({ path: 'test-results/r4001/01-server-manager-tree.png' }).catch(() => {});
  // find a terminal PANE node (otmuxPane ref) + open its drawer via the standard selection flow
  const paneInfo = await page.evaluate(() => {
    const items = [...document.querySelectorAll('rb-object-item')];
    const pane = items.find((x) => /pane|:%|otmuxpane|server:\d/i.test(x.getAttribute('ref') || x.textContent || ''));
    if (pane) { pane.click(); pane.dispatchEvent(new CustomEvent('open-detail', { bubbles: true })); return { found: true, ref: pane.getAttribute('ref') || pane.textContent?.slice(0, 40) }; }
    return { found: false, itemCount: items.length, sample: items.slice(0, 5).map((x) => (x.getAttribute('ref') || x.textContent || '').slice(0, 30)) };
  });
  console.log(`pane node: ${JSON.stringify(paneInfo)}`);
  await sleep(2500);
  await page.screenshot({ path: 'test-results/r4001/02-terminal-drawer.png' }).catch(() => {});
  // inspect the drawer: header controls present? action-bar (rb-strip / action-bar region) present + populated?
  const drawer = await page.evaluate(() => {
    const d = document.querySelector('rb-detail-drawer');
    if (!d) return { drawer: false };
    const header = d.querySelector('.drawer-header');
    return {
      drawer: true,
      open: d.hasAttribute('open'),
      hasHandle: !!d.querySelector('.drawer-handle'),
      hasFullscreen: !!(header && /fullscreen|⛶|expand/i.test(header.innerHTML)),
      hasClose: !!d.querySelector('.drawer-close'),
      // the ACTION BAR = rb-strip in the action-bar region (setActions). count action buttons.
      actionBarPresent: !!d.querySelector('rb-strip, .drawer-actionbar, .action-bar, [class*="actionbar"]'),
      actionButtons: d.querySelectorAll('rb-strip button, .drawer-actionbar button, [class*="actionbar"] button, .action-bar button').length,
      isTerminal: !!d.querySelector('rb-terminal-detail'),
    };
  });
  console.log(`DRAWER: ${JSON.stringify(drawer)}`);
  console.log(`\n═══ R40.01 REPRO ═══`);
  console.log(`terminal drawer opened: ${drawer.drawer && drawer.isTerminal} | header: handle=${drawer.hasHandle} fullscreen=${drawer.hasFullscreen} close=${drawer.hasClose}`);
  console.log(`★ ACTION BAR present=${drawer.actionBarPresent} actionButtons=${drawer.actionButtons} → ${drawer.actionBarPresent && drawer.actionButtons > 0 ? 'PRESENT (not reproduced)' : 'MISSING (regression REPRODUCED — matches Tron: handle+fullscreen+X only, no action bar)'}`);
  await ctx.close();
} finally { await browser.close().catch(() => {}); const td = await f.teardown(); console.log(`teardown: prod:4444 up=${td.prodUp} leftover=${td.leftover}`); }
