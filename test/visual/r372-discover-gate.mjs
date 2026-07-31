// R33.7.2 — ModelView.discoverRelated (Impl 8e8c1d75) @390 COMPONENT-harness gate, DET-3x independent (served==HEAD==0.8.29).
// AC: select an element → Discover → its 1-LEVEL neighbors (relatesTo ∪ relatedFrom, model-derived, dedup, exclude self) are
// add-view'd to the OPEN diagram + a refresh fires (buildEdges auto-wires the edges). Trigger is EVENT-driven (wireDrawerActions):
// rb-drawer-detail-shown{ref} sets shownRef → rb-drawer-action{verb:'discover'} → discoverRelated(shownRef). Serve the /model
// shell + REAL model bundle (NOT authed /model; no self-grant). Pollution-safe BY CONSTRUCTION: /api/model/diagram/add-view is
// ROUTE-INTERCEPTED (fulfilled 200, calls CAPTURED — ZERO real writes); a diagram root is injected so discoverRelated resolves
// the open diagram; /api/ior passes through (REAL neighbors). INV-AR1 (model-derived, never fabricated) proven by the planted
// control: intercept /api/ior → 0 neighbors → 0 add-view calls. Element Shape 0ce4d2fb → 1 real neighbor 54ea2a17.
// [test:uuid:54225f01-958b-439a-9196-e72820ae83e6] R33.7.2 ModelView.discoverRelated (Impl 8e8c1d75) @390 DET-3x: select
// element → Discover → its 1-level neighbors (relatesTo∪relatedFrom, model-derived, dedup) are add-view'd to the open
// diagram + rb-diagram-refresh fires (buildEdges auto-wire). Planted 0-neighbors → 0 add-view (INV-AR1 never-fabricated).
// Component-harness (event-driven wireDrawerActions, not authed /model); pollution-safe (add-view route-intercepted).
import fs from 'node:fs'; import path from 'node:path'; import https from 'node:https';
import { chromium, devices } from '@playwright/test';
const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin', BASE = 'https://prod.wo-da.de:4444';
const ELEM = '0ce4d2fb-4023-4db8-ac2d-4376ce16815c', NEIGHBOR = '54ea2a17-7b18-4d0f-ab41-feb6efe9ae64', DIAG = 'faa4acad-41a6-48fc-ad0d-dd0044c123f7';
const DIST = path.join(ROOT, 'src/public/dist');
const BUNDLE = '/dist/' + fs.readdirSync(DIST).filter(f => /^model-.*\.js$/.test(f)).map(f => [f, fs.statSync(path.join(DIST, f)).mtimeMs]).sort((a, b) => b[1] - a[1])[0][0];
const OUT = path.join(ROOT, 'test-results/r372-discover') + '/'; fs.mkdirSync(OUT, { recursive: true });
const TARGET = '0.8.29', sleep = ms => new Promise(r => setTimeout(r, ms));
const served = await new Promise((res) => { const q = https.request({ host: 'prod.wo-da.de', port: 4444, path: '/api/config', rejectUnauthorized: false }, (r) => { let b = ''; r.on('data', c => b += c); r.on('end', () => { try { res(JSON.parse(b).version); } catch { res('?'); } }); }); q.on('error', () => res('?')); q.end(); });
if (served !== TARGET) console.log(`⚠ served=${served} != ${TARGET}`);
const SHELL = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">`
  + `<link rel="stylesheet" href="/app.css"></head><body><div class="trace-page"><rb-trace-tree id="model-tree"></rb-trace-tree><div id="err"></div></div>`
  + `<script type="module" src="${BUNDLE}"></script></body></html>`;
const ROOTS_WITH_DIAGRAM = { roots: [
  { uuid: 'mof-m1', type: 'mof-layer', name: 'M1 · Projects', hasChildren: true, childCount: 2, icon: 'mof-layer' },
  { uuid: DIAG, type: 'diagram', name: 'Model diagram (3 classes)', hasChildren: false, icon: 'diagram' }, // discoverRelated resolves the OPEN diagram from a type:'diagram' root
] };

async function runOnce(browser, i, { noNeighbors }) {
  const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  const addViews = [];
  await page.route(u => u.pathname === '/model', r => r.fulfill({ status: 200, contentType: 'text/html', body: SHELL }));
  await page.route('**/api/model/tree', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ROOTS_WITH_DIAGRAM) }));
  await page.route('**/api/model/diagram/add-view', r => { try { const b = JSON.parse(r.request().postData() || '{}'); addViews.push(b.elementUuid); } catch { /* noop */ } return r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }); });
  if (noNeighbors) await page.route(u => u.pathname.startsWith('/api/ior/'), r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ unit: { model: { relatesTo: [], relatedFrom: [] } } }) }));
  // else /api/ior passes through → REAL neighbors (INV-AR1 model-derived)

  await page.goto(`${BASE}/model`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!customElements.get('rb-trace-tree') && !!document.querySelector('rb-detail-drawer, rb-trace-tree'), { timeout: 15000 }).catch(() => {});
  await sleep(700);
  await page.evaluate(() => { window.__refresh = false; document.addEventListener('rb-diagram-refresh', () => { window.__refresh = true; }); });
  // trigger the discover flow purely via events (wireDrawerActions): show a modelelement detail → discover
  await page.evaluate((el) => {
    document.dispatchEvent(new CustomEvent('rb-drawer-detail-shown', { detail: { type: 'modelelement', ref: `modelelement:${el}` }, bubbles: true }));
    document.dispatchEvent(new CustomEvent('rb-drawer-action', { detail: { verb: 'discover' }, bubbles: true }));
  }, ELEM);
  await sleep(2600); // discoverRelated: fetch tree + /api/ior + add-view each neighbor + dispatch rb-diagram-refresh
  const refresh = await page.evaluate(() => window.__refresh === true);
  if (i === 1) await page.screenshot({ path: OUT + (noNeighbors ? 'planted' : 'discover') + '.png' });
  await ctx.close();
  return { addViews: addViews.slice(), refresh };
}

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const disc = [], planted = [];
try {
  for (let i = 1; i <= 3; i++) disc.push(await runOnce(browser, i, { noNeighbors: false }));
  planted.push(await runOnce(browser, 1, { noNeighbors: true }));
} finally { await browser.close(); }

console.log('\n===== R33.7.2 discoverRelated @390 iPhone-12 (DET-3x) =====');
disc.forEach((R, i) => console.log(`discover iter ${i + 1}: ${JSON.stringify(R)}`));
console.log(`planted (0 neighbors): ${JSON.stringify(planted[0])}`);
// happy: exactly the 1 real neighbor add-view'd (1-level, model-derived) + refresh fired (buildEdges auto-wire trigger)
const discGreen = disc.length === 3 && disc.every(R => R.addViews.length === 1 && R.addViews[0] === NEIGHBOR && R.refresh === true);
const bite = planted[0] && planted[0].addViews.length === 0; // INV-AR1: 0 neighbors → 0 add-view (never fabricated)
const green = discGreen && bite;
console.log(`\nDISCOVER (1-level neighbor add-view'd + refresh): ${discGreen ? 'GREEN DET-3x' : 'RED'}`);
console.log(`PLANTED-DEFECT bite (0 neighbors → 0 add-view, INV-AR1): ${bite ? 'GREEN' : 'RED'}`);
console.log('OVERALL R33.7.2:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
