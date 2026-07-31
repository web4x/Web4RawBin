// R33.9 action-context (verb-split) — ModelView.actionsForContext (Impl a1a5be99) @390 gate, DET-3x independent
// (served==HEAD==0.8.36). THE IMG_4802/4803 fix: a selected modelelement's drawer actions are CONTEXT-AWARE — unit verbs
// (new/rename/delete) ALWAYS, membership verbs (add/discover/remove) ONLY when a diagram is active (no fragile last-diagram).
// Drivable headless: serve the /model shell (route.fulfill, public data) → real bundle mounts rb-detail-drawer + wireDrawerActions
// → dispatch rb-drawer-detail-shown{type:'modelelement'} + rb-active-diagram{uuid|null} → showActions→setActions → read the
// rendered .drawer-actionbar [data-verb] buttons. Read-only, pollution-free, no auth (the authed /model UI VISUAL rides Tron @390).
// [test:uuid:70ce56e9-8b62-4093-a3c6-92eb86f3c240] R33.9 ModelView.actionsForContext (Impl a1a5be99) @390 DET-3x: unit verbs
// (new/rename/delete) present REGARDLESS; membership (add/discover/remove) PRESENT iff a diagram is active, ABSENT with none
// (INV-A1/A2, the IMG_4802/4803 fix — no fragile last-diagram). Drives the real showActions→setActions path. Drawer-UI visual → Tron @390.
import fs from 'node:fs'; import path from 'node:path'; import https from 'node:https';
import { chromium, webkit, devices } from '@playwright/test';
const ENGINE = process.env.WK ? webkit : chromium; const ENGINE_NAME = process.env.WK ? 'WEBKIT' : 'chromium';
const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin', BASE = 'https://prod.wo-da.de:4444', TARGET = process.env.R339_TARGET || '0.8.37';
const DIST = path.join(ROOT, 'src/public/dist');
const BUNDLE = '/dist/' + fs.readdirSync(DIST).filter(f => /^model-.*\.js$/.test(f)).map(f => [f, fs.statSync(path.join(DIST, f)).mtimeMs]).sort((a, b) => b[1] - a[1])[0][0];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const UNIT = ['new-element', 'rename-element', 'delete-element'];
const MEMBERSHIP = ['add-to-diagram', 'discover', 'remove-from-diagram'];
const SHELL = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">`
  + `<link rel="stylesheet" href="/app.css"></head><body style="margin:0;background:#0d1117">`
  + `<div class="trace-page"><div class="trace-tree-panel"><rb-trace-tree id="model-tree"></rb-trace-tree></div><div id="err"></div></div>`
  + `<script type="module" src="${BUNDLE}"></script></body></html>`;
const served = await new Promise((res) => { const q = https.request({ host: 'prod.wo-da.de', port: 4444, path: '/api/config', rejectUnauthorized: false }, (r) => { let b = ''; r.on('data', c => b += c); r.on('end', () => { try { res(JSON.parse(b).version); } catch { res('?'); } }); }); q.on('error', () => res('?')); q.end(); });
if (served !== TARGET) { console.log(`⚠ PHANTOM-GUARD: served=${served} != ${TARGET} — ABORT.`); process.exit(1); }
console.log(`served==${TARGET} verified.`);

const readVerbs = (page) => page.evaluate(() => [...document.querySelectorAll('rb-detail-drawer .drawer-actionbar [data-verb]')].map(b => b.getAttribute('data-verb')));

async function runOnce(browser) {
  const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  await page.route(u => u.pathname === '/model', r => r.fulfill({ status: 200, contentType: 'text/html', body: SHELL }));
  await page.goto(`${BASE}/model`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!document.querySelector('rb-detail-drawer .drawer-actionbar'), { timeout: 15000 }).catch(() => {});
  await sleep(600);
  // a modelelement detail is shown → shownType='modelelement'
  await page.evaluate(() => document.dispatchEvent(new CustomEvent('rb-drawer-detail-shown', { detail: { type: 'modelelement', ref: 'modelelement:test-elem' }, bubbles: true })));
  await sleep(150);

  // (1) diagram OPEN → membership PRESENT + unit present
  await page.evaluate(() => document.dispatchEvent(new CustomEvent('rb-active-diagram', { detail: { uuid: 'test-diagram-uuid' }, bubbles: true })));
  await sleep(200);
  const withDiagram = await readVerbs(page);

  // (2) NO diagram → membership ABSENT, unit present
  await page.evaluate(() => document.dispatchEvent(new CustomEvent('rb-active-diagram', { detail: { uuid: null }, bubbles: true })));
  await sleep(200);
  const noDiagram = await readVerbs(page);
  const visible = await page.evaluate(() => { const bs=[...document.querySelectorAll('rb-detail-drawer .drawer-actionbar [data-verb]')]; return bs.length>0 && bs.every(b=>b.getBoundingClientRect().width>0 && b.getBoundingClientRect().height>0); });
  const vw = await page.evaluate(()=>innerWidth);
  await ctx.close();
  return { withDiagram, noDiagram, visible, vw };
}

const browser = await ENGINE.launch({ headless: true });
const runs = [];
try { for (let i = 0; i < 3; i++) runs.push(await runOnce(browser)); } finally { await browser.close(); }

const has = (arr, set) => set.every(v => arr.includes(v));
const none = (arr, set) => set.every(v => !arr.includes(v));
console.log(`\n===== R33.9 action-context verb-split @390 ${ENGINE_NAME} (DET-3x) =====`);
runs.forEach((R, i) => console.log(`iter ${i + 1}: withDiagram=[${R.withDiagram}] noDiagram=[${R.noDiagram}]`));
const det = f => runs.length === 3 && runs.every(f);
const membershipPresent = det(R => has(R.withDiagram, MEMBERSHIP));            // (1) INV-A1: diagram-open → membership present
const membershipAbsent = det(R => none(R.noDiagram, MEMBERSHIP));             // (2) INV-A2: no-diagram → membership absent
const unitAlways = det(R => has(R.withDiagram, UNIT) && has(R.noDiagram, UNIT));
const rendered = det(R => R.visible === true);
const green = membershipPresent && membershipAbsent && unitAlways && (process.env.WK ? rendered : true);
console.log(`\n(1) diagram-open → membership PRESENT (add/discover/remove): ${membershipPresent ? 'GREEN' : 'RED'}`);
console.log(`(2) no-diagram → membership ABSENT (no fragile last-diagram): ${membershipAbsent ? 'GREEN' : 'RED'}`);
console.log(`(3) unit verbs (new/rename/delete) present regardless: ${unitAlways ? 'GREEN' : 'RED'}`);
console.log(`(4) drawer actions VISIBLE-rendered @390 (${ENGINE_NAME}, vw=${runs[0]&&runs[0].vw}): ${rendered ? 'GREEN' : 'RED'}`);
console.log(`OVERALL R33.9-verb-context (${ENGINE_NAME}):`, green ? 'GREEN DET-3x' : 'RED');
console.log('NOTE: the authed /model drawer-UI VISUAL rides Tron @390 (R33.5 pattern); this gates the actionsForContext LOGIC via the real showActions→setActions path.');
process.exitCode = green ? 0 : 1;
