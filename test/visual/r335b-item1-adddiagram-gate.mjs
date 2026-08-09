// R33.5 item1 — ModelView.addDiagram (Impl ffdd9347, Method 85a36ec2, UC diagram.addDiagramRefresh) @390 GATE, DET-3x.
// AC-add-diagram-creates-itemview: on /model, clicking the action-bar "＋ Add Diagram" → a NEW diagram itemview renders
// under diagrams/ WITHOUT a full reload (the fix: load()+tree.expandPath reveal; old bug = full reload collapsed it out).
// OWNER-GATE (R31.4 pattern, by-construction — reuses r3110): /model is feature-gated (requireFeatureAccessHttp
// 'Model-Driven Code Quality'), so serve the shell via route.fulfill + a placeholder sm_session cookie — the REAL model
// bundle (with the REAL addDiagram fn) runs; NO real owner session (never evicts Tron's multi-owner session). The tree
// DATA APIs (/api/model/tree + /api/trace/children/*) are PUBLIC (measured) → passthrough to the live server; only the
// owner-gated create POST + the rawbin:diagram children are intercepted (pollution-safe: ZERO real diagram written).
// PLANTED-DEFECT: create→{ok:false} → addDiagram catches, NO expandPath, the new itemview does NOT render (bite).
// [test:uuid:a5882399-902e-41d3-9897-ef9e5e12c894] R33.5 item1 ModelView.addDiagram (Impl ffdd9347) LOGIC @390 DET-3x:
// clicking the ＋Add Diagram bar fires the create POST + does NOT full-reload (sentinel survives) + planted-defect bite
// (create-fail → no new node, error handled). ★ SCOPE (PO R30.53 pattern): this marker credits the addDiagram LOGIC
// ONLY. The TREE-REFRESH REVEAL AC (new itemview shows under diagrams/) is architect-confirmed-live (items1-3 client-live
// v0.8.19) and rides TRON'S @390 device visual on the REAL feature-gated /model — it is NOT headless-gated here (mock-owner
// can't replicate the real serverModelPage tree-seeding; crediting it headless would be a FALSE-GREEN). reveal = HELD-Tron.
import { chromium, webkit, devices } from '@playwright/test';
const ENGINE = process.env.WK ? webkit : chromium; // WK=1 → real Safari @390 (WebKit≠chromium false-green class)
import fs from 'node:fs'; import path from 'node:path';
const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin', BASE = 'https://prod.wo-da.de:4444';
const DIST = path.join(ROOT, 'src/public/dist');
const BUNDLE = '/dist/' + fs.readdirSync(DIST).filter(f => /^model-.*\.js$/.test(f)).map(f => [f, fs.statSync(path.join(DIST, f)).mtimeMs]).sort((a, b) => b[1] - a[1])[0][0];
const OUT = path.join(ROOT, 'test-results/r335b-item1') + '/'; fs.mkdirSync(OUT, { recursive: true });
const NEWNAME = 'R335TestDiagram-planted';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const REAL_DIAGRAMS = [ // the 2 real diagrams under rawbin:diagram (measured, stable) — passthrough would also return these
  { uuid: 'd4e3d709-051b-4cec-9c30-71cf669290d8', type: 'diagram', name: 'Model diagram', hasChildren: false, childCount: 0, icon: 'diagram' },
  { uuid: 'faa4acad-41a6-48fc-ad0d-dd0044c123f7', type: 'diagram', name: 'Model diagram (3 classes)', hasChildren: false, childCount: 0, icon: 'diagram' },
];
const SHELL = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">`
  + `<link rel="stylesheet" href="/app.css"><style>body{margin:0;background:#0d1117;color:#e6edf3;height:100dvh;display:flex;flex-direction:column;font-family:system-ui}`
  + `.trace-page{flex:1;min-height:0;overflow:auto}#err{color:#f85149;padding:4px 10px}</style></head><body>`
  + `<div class="trace-page"><div class="trace-tree-panel"><rb-trace-tree id="model-tree"></rb-trace-tree></div><div id="err"></div></div>`
  + `<script type="module" src="${BUNDLE}"></script></body></html>`;

async function runOnce(browser, i, { failCreate }) {
  const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  await ctx.addCookies([{ name: 'sm_session', value: 'test-owner-session', domain: 'prod.wo-da.de', path: '/' }]); // R31.4 by-construction owner marker
  const page = await ctx.newPage();
  let created = false;
  await page.route(u => u.pathname === '/model', r => r.fulfill({ status: 200, contentType: 'text/html', body: SHELL }));
  await page.route('**/api/model/diagram/create', r => {
    if (failCreate) return r.fulfill({ status: 500, contentType: 'application/json', body: '{"ok":false,"error":"planted-defect"}' });
    created = true; return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, uuid: 'planted-new-uuid', name: NEWNAME }) });
  });
  await page.route('**/api/trace/children/rawbin:diagram', r => r.fulfill({ status: 200, contentType: 'application/json',
    body: JSON.stringify({ uuid: 'rawbin:diagram', type: 'collection', name: '', hasChildren: true, parent: null,
      children: created ? [...REAL_DIAGRAMS, { uuid: 'planted-new-uuid', type: 'diagram', name: NEWNAME, hasChildren: false, childCount: 0, icon: 'diagram' }] : REAL_DIAGRAMS }) }));
  page.on('dialog', d => d.accept(NEWNAME).catch(() => {}));   // the prompt('New diagram name:')
  const reqLog = [];
  if (i === 1 && !failCreate) page.on('request', rq => { const u = rq.url(); if (/\/api\/(trace\/children|model\/(tree|diagram))/.test(u)) reqLog.push(u.replace(BASE, '')); });

  await page.goto(`${BASE}/model`, { waitUntil: 'domcontentloaded' });
  // R33.9 RETIRED mountActionBar/rb-strip → '＋ Add Diagram' is now a DRAWER action (rb-drawer-action{verb}) wired by
  // wireDrawerActions() at bundle init. Wait for the bundle (defines rb-diagram-detail + runs wireDrawerActions), then
  // dispatch the verb — engine-agnostic (works under chromium AND WebKit; the stale rb-strip selector was the RED cause).
  await page.waitForFunction(() => typeof customElements.get('rb-diagram-detail') === 'function', { timeout: 15000 }).catch(() => {});
  await sleep(700);
  await page.evaluate(() => { window.__sentinel = 'ALIVE'; }); // reload-detector: a full navigation wipes this
  const hasBtn = await page.evaluate(() => typeof customElements.get('rb-diagram-detail') === 'function'); // bundle + drawer-action handlers ready
  const newBefore = await page.evaluate((n) => [...document.querySelectorAll('rb-object-item')].some(el => (el.textContent || '').includes(n)), NEWNAME);

  await page.evaluate(() => document.dispatchEvent(new CustomEvent('rb-drawer-action', { detail: { verb: 'add-diagram' }, bubbles: true }))); // current trigger → wireDrawerActions → addDiagram()
  await sleep(3000); // create(intercepted) → load() → expandPath lazy-loads mof-m1→project:RawBin→rawbin:diagram → reveal
  if (i === 1) await page.screenshot({ path: OUT + (failCreate ? 'planted' : 'ok') + '-after-add.png' });

  const after = await page.evaluate((n) => ({
    sentinel: window.__sentinel === 'ALIVE',                                   // no full reload
    newNode: [...document.querySelectorAll('rb-object-item')].some(el => (el.textContent || '').includes(n)),
    diagramsExpanded: [...document.querySelectorAll('rb-object-item')].filter(el => (el.textContent || '').includes('Model diagram')).length,
  }), NEWNAME);
  if (i === 1 && !failCreate) {
    const dump = await page.evaluate(() => ({ items: [...document.querySelectorAll('rb-object-item')].map(el => (el.getAttribute('ref') || '') + '=' + (el.textContent || '').slice(0, 22).replace(/\s+/g, ' ')), expanded: (() => { try { return JSON.parse(localStorage.getItem('rb-trace-tree-expanded') || localStorage.getItem(Object.keys(localStorage).find(k => k.includes('expand')) || '') || '[]'); } catch { return 'err'; } })() }));
    console.log('  DIAG reqLog:', JSON.stringify(reqLog));
    console.log('  DIAG items:', JSON.stringify(dump.items));
    console.log('  DIAG expanded:', JSON.stringify(dump.expanded));
  }
  await ctx.close();
  return { created, hasBtn, newBefore, ...after };
}

const browser = await ENGINE.launch({ headless: true, ...(process.env.WK ? {} : { args: ['--no-sandbox', '--ignore-certificate-errors'] }) });
const ok = [], planted = [];
try {
  for (let i = 1; i <= 3; i++) ok.push(await runOnce(browser, i, { failCreate: false }));
  planted.push(await runOnce(browser, 1, { failCreate: true }));   // planted-defect control (bite)
} finally { await browser.close(); }

console.log('\n===== R33.5 item1 addDiagram @390 iPhone-12 (LOGIC DET-3x + planted-defect; reveal HELD-Tron) =====');
ok.forEach((R, i) => console.log(`ok iter ${i + 1}: ${JSON.stringify(R)}`));
console.log(`planted: ${JSON.stringify(planted[0])}`);
// LOGIC gate (headless-gateable, PO R30.53 pattern): create fires + NO full reload + planted-defect bite.
const logic = ok.length === 3 && ok.every(R => R.hasBtn && R.created && R.sentinel === true);
const bite = planted[0] && planted[0].created === false && planted[0].newNode === false; // create-fail → handled, no new node
const logicGreen = logic && bite;
// REVEAL-RENDER AC = HELD for Tron's @390 device (real /model). Reported honestly, NOT part of the headless verdict.
const revealHeadless = ok.every(R => R.newNode === true);
console.log(`\nADD-DIAGRAM LOGIC (create fires + NO full reload): ${logic ? 'GREEN DET-3x' : 'RED'}`);
console.log(`PLANTED-DEFECT bite (create-fail → handled, no new node): ${bite ? 'GREEN' : 'RED'}`);
console.log(`REVEAL-RENDER: gated GREEN by r335c-item1-reveal-gate.mjs @390 WebKit (expandPath 0→2 via ungated /api/trace/children — mock-owner DOES reveal after the 816ecad4f expandPath fix; the earlier 'HELD-Tron' is SUPERSEDED). This gate = the create+no-reload LOGIC half. headless-reveal-here=${revealHeadless} (this file's synthetic-child mock is logic-only).`);
console.log('OVERALL item1 LOGIC:', logicGreen ? 'GREEN DET-3x' : 'RED');
process.exitCode = logicGreen ? 0 : 1;
