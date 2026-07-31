// R33.6.5 items 5+6 — action-bar IN the drawer, selection-driven. INDEPENDENT @390 gate (≠ expert own-oracle host-listener;
// and NOT injecting the model bundle over /trace which double-defines rb-compartment — expert's flagged harness artifact).
// FIX v0.8.22 (4ad01cfea): RbDetailDrawer.setActions cef954eb (item5, GENERIC fixed bar region .drawer-actionbar, empty→hidden)
// + showActionsForType e6870858 (item6, dispatch rb-drawer-detail-shown{type}) + host ModelView.wireDrawerActions 613bfb4a
// (setActions(ACTIONS_BY_TYPE[type])). PO CLIENT-BUNDLE phantom-guard (served SW rawbin-v0.8.22 == committed; /api/config BOOT
// lags 0.8.20, restart deferred to R33.6 boundary — the R33.5-reveal lesson). Serve /model shell + real bundle (drawer +
// wireDrawerActions mount at init). Drive the REAL event contract per type → assert the rendered .da-btn buttons; button-WORKS
// (function-first, no write: add-to-diagram → #err text); INV-3 NEGATIVE: /trace drawer (no host) → bar HIDDEN. @390. DET-3x.
import { chromium, devices } from '@playwright/test';
import fs from 'node:fs'; import path from 'node:path';
// [test:uuid:2430c050-4c0d-479b-8ba4-b80214c5a2bb] R33.6.5 item5 RbDetailDrawer.setActions (Impl cef954eb) @390 DET-3x served v0.8.22: the GENERIC .drawer-actionbar renders the HOST-supplied {verb,label} .da-btn buttons and HIDES (display:none) when empty.
// [test:uuid:a1e4c001-01ce-425a-9d72-a2048e1ba61c] R33.6.5 item6 host ModelView.wireDrawerActions (Impl 613bfb4a) @390 DET-3x: selection-driven ACTIONS_BY_TYPE mapping (diagram->[AddDiagram/ReSync/Compile], modelelement->[AddToDiagram], puml->[Import], default->[AddDiagram/ImportPUML]) + button click -> rb-drawer-action -> host handler fires.
// [test:uuid:bd8c14fc-f6b9-42f1-affb-6322faa6dced] R33.6.5 item6 INV-3 shared-generic RbDetailDrawer.showActionsForType (Impl e6870858) @390 DET-3x: the rb-drawer-detail-shown{type} contract drives the bar; on /trace (NO host) the SAME drawer's bar stays HIDDEN (no model actions leak into the shared drawer). req maps markers to impls.
const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin', BASE = 'https://prod.wo-da.de:4444';
const DIST = path.join(ROOT, 'src/public/dist');
const BUNDLE = '/dist/' + fs.readdirSync(DIST).filter(f => /^model-.*\.js$/.test(f)).map(f => [f, fs.statSync(path.join(DIST, f)).mtimeMs]).sort((a, b) => b[1] - a[1])[0][0];
const OUT = path.join(ROOT, 'test-results/r3365-drawer-actions') + '/'; fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const SHELL = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">`
  + `<link rel="stylesheet" href="/app.css"><style>body{margin:0;background:#0d1117;color:#e6edf3;height:100dvh;display:flex;flex-direction:column;font-family:system-ui}.trace-page{flex:1;min-height:0;overflow:auto;position:relative}#err{color:#f85149}</style></head><body>`
  + `<div class="trace-page"><div class="trace-tree-panel"><rb-trace-tree id="model-tree"></rb-trace-tree></div><div id="err"></div></div>`
  + `<script type="module" src="${BUNDLE}"></script></body></html>`;
// expected buttons per selection type (measured from ACTIONS_BY_TYPE + DEFAULT_ACTIONS)
const CASES = [
  { type: 'diagram', labels: ['＋ Add Diagram', '⟳ Re-Sync', '⚙ Compile → SVG'] },
  { type: 'modelelement', labels: ['＋ Add to diagram'] },
  { type: 'puml', labels: ['⇩ Import → diagram'] },
  { type: 'collection', labels: ['＋ Add Diagram', '⇩ Import PUML'] }, // unknown type → DEFAULT_ACTIONS
];
const readBar = (page) => page.evaluate(() => {
  const bar = document.querySelector('rb-detail-drawer .drawer-actionbar');
  const btns = [...(bar ? bar.querySelectorAll('.da-btn') : [])];
  return { present: !!bar, display: bar ? getComputedStyle(bar).display : 'none', labels: btns.map(b => (b.textContent || '').trim()), verbs: btns.map(b => b.getAttribute('data-verb')) };
});
const showType = (page, type) => page.evaluate((t) => document.dispatchEvent(new CustomEvent('rb-drawer-detail-shown', { detail: { type: t, ref: t + ':x' }, bubbles: true })), type);

async function runPositive(browser, i) {
  const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  await page.route(u => u.pathname === '/model', r => r.fulfill({ status: 200, contentType: 'text/html', body: SHELL }));
  await page.goto(`${BASE}/model`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!customElements.get('rb-detail-drawer') && !!document.querySelector('rb-detail-drawer .drawer-actionbar'), { timeout: 15000 }).catch(() => {});
  // READINESS: dispatch a probe each poll until wireDrawerActions (host) has wired its listener and the bar populates
  // (avoids the iter-1 warm-up flake where init hadn't run yet). Deterministic once the host is live.
  await page.waitForFunction(() => { document.dispatchEvent(new CustomEvent('rb-drawer-detail-shown', { detail: { type: 'diagram', ref: 'x' }, bubbles: true })); return document.querySelectorAll('rb-detail-drawer .drawer-actionbar .da-btn').length > 0; }, { timeout: 10000, polling: 200 }).catch(() => {});
  const perType = {};
  for (const c of CASES) {
    await showType(page, c.type); await sleep(250);
    const bar = await readBar(page);
    const labelsMatch = c.labels.length === bar.labels.length && c.labels.every(l => bar.labels.includes(l));
    perType[c.type] = { visible: bar.display !== 'none', labelsMatch, got: bar.labels };
    if (i === 1 && c.type === 'diagram') await page.screenshot({ path: OUT + 'diagram-actions.png' });
  }
  // button WORKS (function-first, no write): modelelement → click add-to-diagram → host sets #err guidance text
  await showType(page, 'modelelement'); await sleep(250);
  await page.click('rb-detail-drawer .drawer-actionbar .da-btn[data-verb="add-to-diagram"]', { timeout: 5000 }).catch(() => {});
  await sleep(300);
  const errText = await page.evaluate(() => (document.getElementById('err')?.textContent || ''));
  const buttonWorks = /Open a diagram/.test(errText);
  // clear → bar hides (selection ALWAYS drives; empty → hidden)
  await page.evaluate(() => document.querySelector('rb-detail-drawer')?.setActions?.([])); await sleep(150);
  const clearedHidden = (await readBar(page)).display === 'none';
  await ctx.close();
  return { perType, buttonWorks, clearedHidden };
}

async function runNegative(browser) {
  // INV-3 shared-generic: /trace has NO host (no wireDrawerActions) → the SAME drawer's bar stays HIDDEN on detail-shown.
  const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/trace`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!customElements.get('rb-detail-drawer'), { timeout: 15000 }).catch(() => {});
  await page.evaluate(() => { if (!document.querySelector('rb-detail-drawer')) document.body.appendChild(document.createElement('rb-detail-drawer')); });
  await sleep(500);
  await showType(page, 'diagram'); await sleep(400);
  const bar = await readBar(page);
  await ctx.close();
  return { present: bar.present, display: bar.display, labels: bar.labels };
}

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const pos = [], neg = [];
try {
  for (let i = 1; i <= 3; i++) pos.push(await runPositive(browser, i));
  neg.push(await runNegative(browser));
} finally { await browser.close(); }

console.log('\n===== R33.6.5 drawer action-bar @390 iPhone-12 (independent, DET-3x) =====');
pos.forEach((R, i) => console.log(`pos iter ${i + 1}: ${JSON.stringify(R)}`));
console.log(`neg (/trace INV-3): ${JSON.stringify(neg[0])}`);
const typesGreen = CASES.every(c => pos.length === 3 && pos.every(R => R.perType[c.type]?.visible && R.perType[c.type]?.labelsMatch));
const buttonWorks = pos.every(R => R.buttonWorks);
const clears = pos.every(R => R.clearedHidden);
const negGreen = neg[0] && neg[0].display === 'none' && neg[0].labels.length === 0; // no host → bar hidden, no model actions
const green = typesGreen && buttonWorks && clears && negGreen;
console.log(`\nSELECTION-DRIVEN buttons per type (item5+6): ${typesGreen ? 'GREEN DET-3x' : 'RED'}`);
console.log(`BUTTON WORKS (add-to-diagram → host handler): ${buttonWorks ? 'GREEN' : 'RED'}`);
console.log(`EMPTY → bar HIDDEN (selection always drives): ${clears ? 'GREEN' : 'RED'}`);
console.log(`INV-3 NEGATIVE (/trace no host → bar hidden): ${negGreen ? 'GREEN' : 'RED'}`);
console.log('OVERALL R33.6.5:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
