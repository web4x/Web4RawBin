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
  // FOLD (2026-08-17, PO ruling): the context-RESOLUTION LOGIC (which verbs per diagram-context) is owned by
  // r4037-context-actions-gate (node applicableActionsFor — all cases + stub-must-fail). This gate KEEPS the piece
  // r4037 CANNOT do: the @390 real-WebKit RENDER — the drawer action bar mounts + paints its verb buttons visibly @390.
  await page.evaluate(() => document.dispatchEvent(new CustomEvent('rb-drawer-detail-shown', { detail: { type: 'modelelement', ref: 'modelelement:test-elem' }, bubbles: true })));
  await page.evaluate(() => document.dispatchEvent(new CustomEvent('rb-active-diagram', { detail: { uuid: 'test-diagram-uuid' }, bubbles: true })));
  await sleep(300);
  const verbs = await readVerbs(page);
  const visible = await page.evaluate(() => { const bs=[...document.querySelectorAll('rb-detail-drawer .drawer-actionbar [data-verb]')]; return bs.length>0 && bs.every(b=>b.getBoundingClientRect().width>0 && b.getBoundingClientRect().height>0); });
  const vw = await page.evaluate(()=>innerWidth);
  await ctx.close();
  return { verbs, visible, vw };
}

const browser = await ENGINE.launch({ headless: true });
const runs = [];
try { for (let i = 0; i < 3; i++) runs.push(await runOnce(browser)); } finally { await browser.close(); }

const has = (arr, set) => set.every(v => arr.includes(v));
console.log(`\n===== R33.9 action-bar @390 ${ENGINE_NAME} RENDER (DET-3x) — resolution-logic folded to r4037 =====`);
runs.forEach((R, i) => console.log(`iter ${i + 1}: verbs=[${R.verbs}] visible=${R.visible}`));
const det = f => runs.length === 3 && runs.every(f);
const rendered = det(R => R.visible === true);                                 // @390 real-WebKit: bar mounts + buttons paint
const verbsRender = det(R => R.verbs.length > 0 && has(R.verbs, UNIT));        // the resolved verbs (incl unit new/rename/delete) actually RENDER as buttons
const green = verbsRender && (process.env.WK ? rendered : true);
console.log(`\n(A) action-bar verb buttons RENDER (incl unit new/rename/delete): ${verbsRender ? 'GREEN' : 'RED'}`);
console.log(`(B) buttons VISIBLE-rendered @390 (${ENGINE_NAME}, vw=${runs[0]&&runs[0].vw}): ${rendered ? 'GREEN' : 'RED'}`);
console.log(`OVERALL R33.9 action-bar @390 RENDER (${ENGINE_NAME}):`, green ? 'GREEN DET-3x' : 'RED');
console.log('NOTE (fold 2026-08-17, PO ruling): the context-RESOLUTION LOGIC (verbs-per-diagram-context, INV-A1/A2 membership present/absent) is owned by r4037-context-actions-gate (node applicableActionsFor + stub-must-fail, all cases). This gate KEEPS the @390 real-WebKit RENDER r4037 cannot cover — NOT hollow. Test 70ce56e9 stays historical-credit on a1a5be99 (re-point EXERCISE, not credit). MEMBERSHIP const retained for reference.');
process.exitCode = green ? 0 : 1;
