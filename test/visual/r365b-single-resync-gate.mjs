// R33.6.5 BUG-2 dup Re-Sync (Tron IMG_4795, v0.8.32 fix 8ad1ad537) @390 COMPONENT-harness, DET-3x independent.
// The device bug: TWO Re-Sync buttons — the OLD in-diagram .dm-resync toolbar (rb-diagram-detail render) + the action-bar one.
// Fix: removed the in-diagram .dm-resync BUTTON from render → EXACTLY ONE Re-Sync (the action-bar '⟳ Re-Sync', wired via the
// drawer setActions on a diagram detail). GATE: count Re-Sync buttons across the view = 1 (0 in-diagram + 1 action-bar).
// Serve the /model shell + real bundle (drawer auto-mounts) → mount rb-diagram-detail → show a diagram detail → count.
// [test:uuid:6b28f4d1-73ac-4e50-9f62-8c1a05e3b7d9] R33.6.5 BUG-2 single Re-Sync @390 DET-3x: exactly ONE Re-Sync button
// (action-bar, verb 're-sync'); the removed in-diagram .dm-resync = 0. A count of 2 (the dup) = RED.
import fs from 'node:fs'; import path from 'node:path';
import { chromium, devices } from '@playwright/test';
const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin', BASE = 'https://prod.wo-da.de:4444';
const DIAG = 'faa4acad-41a6-48fc-ad0d-dd0044c123f7';
const DIST = path.join(ROOT, 'src/public/dist');
const BUNDLE = '/dist/' + fs.readdirSync(DIST).filter(f => /^model-.*\.js$/.test(f)).map(f => [f, fs.statSync(path.join(DIST, f)).mtimeMs]).sort((a, b) => b[1] - a[1])[0][0];
const OUT = path.join(ROOT, 'test-results/r365b-resync') + '/'; fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const SHELL = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">`
  + `<link rel="stylesheet" href="/app.css"></head><body><div class="trace-page"><rb-trace-tree id="model-tree"></rb-trace-tree><div id="err"></div></div>`
  + `<script type="module" src="${BUNDLE}"></script></body></html>`;

async function runOnce(browser, i) {
  const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  await page.route(u => u.pathname === '/model', r => r.fulfill({ status: 200, contentType: 'text/html', body: SHELL }));
  await page.goto(`${BASE}/model`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!customElements.get('rb-diagram-detail') && !!document.querySelector('rb-detail-drawer'), { timeout: 15000 }).catch(() => {});
  // mount the diagram (the component that USED to render the dup .dm-resync)
  await page.evaluate((u) => { const d = document.createElement('rb-diagram-detail'); d.id = 'dg'; d.setAttribute('ref', `diagram:${u}`); d.setAttribute('uuid', u); d.style.cssText = 'position:fixed;right:0;bottom:0;width:60%;height:50%'; document.body.appendChild(d); }, DIAG);
  await page.waitForFunction(() => document.querySelectorAll('#dg .dm-box').length > 0, { timeout: 12000 }).catch(() => {});
  // show a diagram detail → wireDrawerActions.setActions(ACTIONS_BY_TYPE.diagram) renders the ONE action-bar '⟳ Re-Sync'
  await page.evaluate((u) => document.dispatchEvent(new CustomEvent('rb-drawer-detail-shown', { detail: { type: 'diagram', ref: `diagram:${u}` }, bubbles: true })), DIAG);
  await sleep(900);
  if (i === 1) await page.screenshot({ path: OUT + '01-resync.png' });
  const counts = await page.evaluate(() => {
    const isResync = (el) => (el.textContent || '').replace(/\s+/g, '').includes('Re-Sync') || el.classList.contains('dm-resync') || el.getAttribute('data-verb') === 're-sync';
    const buttons = [...document.querySelectorAll('button, [role="button"], .dm-resync, [data-verb]')].filter(isResync);
    const inDiagram = [...document.querySelectorAll('#dg .dm-resync, #dg button')].filter(isResync).length;
    return { total: buttons.length, inDiagram, labels: buttons.map(b => (b.textContent || b.className || '').trim().slice(0, 18)) };
  });
  await ctx.close();
  return counts;
}

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const runs = [];
try { for (let i = 1; i <= 3; i++) runs.push(await runOnce(browser, i)); }
finally { await browser.close(); }

console.log('\n===== R33.6.5 BUG-2 single Re-Sync @390 iPhone-12 (DET-3x) =====');
runs.forEach((R, i) => console.log(`iter ${i + 1}: total=${R.total} inDiagram=${R.inDiagram} labels=${JSON.stringify(R.labels)}`));
const exactlyOne = runs.length === 3 && runs.every(R => R.total === 1);
const noInDiagramDup = runs.every(R => R.inDiagram === 0); // the removed dup
const green = exactlyOne && noInDiagramDup;
console.log(`\nEXACTLY ONE Re-Sync button (was 2 = the dup bug): ${exactlyOne ? 'GREEN DET-3x' : 'RED'}`);
console.log(`in-diagram .dm-resync REMOVED (0): ${noInDiagramDup ? 'GREEN' : 'RED'}`);
console.log('OVERALL R33.6.5 BUG-2:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
