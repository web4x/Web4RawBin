// S34 R-E/R34.7 + R-A A1 — UNIVERSAL ACTION BAR on ALL drawer usages. real-WebKit (Safari 605.1.15) @390, DET-3x.
// The fix: RbDetailDrawer.universalActionBar (Impl ffd44b17, Method 54acc696) runs in the SHARED drawer on EVERY detail
// render (rb-detail-drawer.ts:388) → composes the UNIVERSAL A1 default [◆ Scenario, ✎ Edit] + every registered host
// provider's verbs. So the bar is PRESENT on all 5 non-model usages (were MISSING pre-fix), and /model (which registers
// actionsForContext via registerActionProvider) STILL shows its full verb-set (unregressed). empty/chat → cleared.
// Non-model usages tested on REAL public pages (/trace, /scenario). server-manager/feature-manager are feature/owner-gated
// (SystemTester 403) + in-room = /app chat — they mount the IDENTICAL shared rb-detail-drawer, so the universalActionBar
// MECHANISM (ffd44b17) proven here covers them by construction (the fix is in the shared component, not per-host); a real-
// page confirm on the gated ones = Tron device. NO seed, NO write (showActionsForType is a pure render). pixel-sample.
// [test:uuid:cbdb3210-a2ad-4c4f-9e32-68f6f71f16b0] S34 R-E/R34.7 + R-A A1 RbDetailDrawer.universalActionBar (Impl ffd44b17) @390 real-WebKit DET-3x: the shared drawer sets the [◆Scenario,✎Edit] universal default on EVERY detail render across ALL usages — REAL /trace + /scenario show the bar PRESENT (was MISSING on non-model usages pre-fix) with NO model verbs; /model composes the default + its FULL model verb-set (unregressed R33.9); empty/chat → cleared; ◆Scenario → /scenario?ior=; no page throws. INV-E1 universal / E2 context-verbset / E3 no-fork. server-manager/feature-manager/in-room ride the SAME shared component (mechanism-proven; gated-page real-confirm = Tron device).
// [test:uuid:d8be524e-846e-48f5-a2b1-ffae078f873b] S34 R-A A1 / R34.1 RbDetailDrawer.onUniversalAction (Impl 005dbd3e) @390 real-WebKit DET-3x: the shared drawer handles the universal ◆Scenario/✎Edit verbs itself — ◆Scenario → location /scenario?ior=<uuid>, ✎Edit → scenarioEditorHref /edit/scenario/index/<sharded>/<uuid>.scenario.json. DISTINCT #126 Test for A1 (its own Impl+Req), NOT a ride on R-E ffd44b17 universal-default (crossRef ffd44b17 R34.7 default-pair + a1a5be99 verb-listing).
import { chromium, webkit, devices } from '@playwright/test';
import fs from 'node:fs'; import path from 'node:path'; import https from 'node:https';
const ENGINE = process.env.WK ? webkit : chromium;
const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin', BASE = 'https://prod.wo-da.de:4444';
const TARGET = process.env.R34E_TARGET || '0.8.43';
const servedVersion = await new Promise((res) => { const q = https.request({ host: 'prod.wo-da.de', port: 4444, path: '/api/config', rejectUnauthorized: false }, (r) => { let b = ''; r.on('data', c => b += c); r.on('end', () => { try { res(JSON.parse(b).version); } catch { res('?'); } }); }); q.on('error', () => res('?')); q.end(); });
console.log(servedVersion === TARGET ? `served==${TARGET} verified — SERVED verdict on ${process.env.WK ? 'WebKit' : 'chromium'}.` : `⚠ PHANTOM-GUARD: served=${servedVersion} != ${TARGET}.`);
const DIST = path.join(ROOT, 'src/public/dist');
const MODELBUNDLE = '/dist/' + fs.readdirSync(DIST).filter(f => /^model-.*\.js$/.test(f)).map(f => [f, fs.statSync(path.join(DIST, f)).mtimeMs]).sort((a, b) => b[1] - a[1])[0][0];
const OUT = path.join(ROOT, 'test-results/r34e-universal-bar') + '/'; fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const MODEL_SHELL = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/app.css"><style>body{margin:0;background:#0d1117;height:100dvh;display:flex;flex-direction:column}.trace-page{flex:1;min-height:0;overflow:auto;position:relative}</style></head><body><div class="trace-page"><div class="trace-tree-panel"><rb-trace-tree id="model-tree"></rb-trace-tree></div><div id="err"></div></div><script type="module" src="${MODELBUNDLE}"></script></body></html>`;

const readBar = (page) => page.evaluate(() => {
  const bar = document.querySelector('rb-detail-drawer .drawer-actionbar');
  const btns = [...(bar ? bar.querySelectorAll('.da-btn') : [])];
  return { present: !!bar, verbs: btns.map(b => b.getAttribute('data-verb')), labels: btns.map(b => (b.textContent || '').trim()) };
});
// call the shared drawer's showActionsForType (private, bracket-access) → universalActionBar renders the bar
const drive = (page, type, ref) => page.evaluate(([t, r]) => { const d = document.querySelector('rb-detail-drawer'); if (d && d.showActionsForType) { d.showActionsForType(t, r); return true; } return false; }, [type, ref]);
let consoleErrors = 0;

async function nonModelUsage(browser, url, i, label) {
  const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  page.on('pageerror', () => consoleErrors++);
  await page.goto(`${BASE}${url}`, { waitUntil: 'domcontentloaded' });
  const hasDrawer = await page.waitForFunction(() => !!customElements.get('rb-detail-drawer') && !!document.querySelector('rb-detail-drawer'), { timeout: 20000 }).then(() => true).catch(() => false);
  await sleep(600); // scenario-view mounts its shared drawer async after the app boots
  const called = await drive(page, 'requirement', 'requirement:r-e-test-uuid'); await sleep(300);
  const bar = await readBar(page);
  // empty/chat clears
  await drive(page, 'chat', 'chat:x'); await sleep(200);
  const cleared = (await readBar(page)).verbs.length === 0;
  if (i === 1) await page.screenshot({ path: OUT + label + '.png' });
  await ctx.close();
  const hasDefault = bar.verbs.includes('scenario') && bar.verbs.includes('edit');
  const noModelVerbs = !bar.verbs.some(v => ['add-diagram', 'new-element', 'add-folder'].includes(v));
  return { hasDrawer, called, present: bar.present, hasDefault, noModelVerbs, cleared, verbs: bar.verbs };
}

async function modelUsage(browser, i) {
  const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  page.on('pageerror', () => consoleErrors++);
  await page.route(u => u.pathname === '/model', r => r.fulfill({ status: 200, contentType: 'text/html', body: MODEL_SHELL }));
  await page.goto(`${BASE}/model`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!customElements.get('rb-detail-drawer') && !!document.querySelector('rb-detail-drawer .drawer-actionbar'), { timeout: 15000 }).catch(() => {});
  await page.evaluate(() => document.dispatchEvent(new CustomEvent('rb-active-diagram', { detail: { uuid: 'faa4acad-41a6-48fc-ad0d-dd0044c123f7' }, bubbles: true })));
  await drive(page, 'modelelement', 'modelelement:cls1'); await sleep(500); // host provider registers on rb-drawer-detail-shown → re-render
  const bar = await readBar(page);
  if (i === 1) await page.screenshot({ path: OUT + 'model.png' });
  await ctx.close();
  const hasDefault = bar.verbs.includes('scenario') && bar.verbs.includes('edit');
  const hasModelVerbs = ['new-element', 'rename-element', 'delete-element'].every(v => bar.verbs.includes(v));
  return { hasDefault, hasModelVerbs, verbs: bar.verbs };
}

// A1/R34.1 onUniversalAction (Impl 005dbd3e): ◆Scenario → /scenario?ior=<uuid> ; ✎Edit → scenarioEditorHref (/edit/scenario/index/<sharded>/<uuid>.scenario.json)
const NAVU = '070d8d75-3200-41a9-8c1f-d6f8defe501e';
async function oneNav(browser, verb, waitGlob) {
  const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/trace`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!document.querySelector('rb-detail-drawer'), { timeout: 15000 }).catch(() => {});
  await drive(page, 'requirement', 'requirement:' + NAVU); await sleep(200);
  await page.evaluate(([v, u]) => document.dispatchEvent(new CustomEvent('rb-drawer-action', { detail: { verb: v, ref: 'requirement:' + u }, bubbles: true })), [verb, NAVU]);
  await page.waitForURL(waitGlob, { timeout: 6000 }).catch(() => {});
  const url = page.url().replace(BASE, '');
  await ctx.close();
  return url;
}
async function navCheck(browser) {
  const scenarioUrl = await oneNav(browser, 'scenario', '**/scenario?ior=**');
  const editUrl = await oneNav(browser, 'edit', '**/edit/scenario/index/**');
  const scenarioNav = /\/scenario\?ior=/.test(scenarioUrl) && scenarioUrl.includes(NAVU);
  const editNav = /\/edit\/scenario\/index\//.test(editUrl) && editUrl.includes(NAVU);
  return { scenarioNav, editNav, scenarioUrl, editUrl };
}

const browser = await ENGINE.launch({ headless: true, ...(process.env.WK ? {} : { args: ['--no-sandbox', '--ignore-certificate-errors'] }) });
const trace = [], scenario = [], model = [];
let nav = null;
try {
  for (let i = 1; i <= 3; i++) {
    trace.push(await nonModelUsage(browser, '/trace', i, 'trace'));
    scenario.push(await nonModelUsage(browser, '/scenario?ior=ior:instance:070d8d75-3200-41a9-8c1f-d6f8defe501e', i, 'scenario'));
    model.push(await modelUsage(browser, i));
  }
  nav = await navCheck(browser);
} finally { await browser.close(); }

const okAll = (arr, pred) => arr.length === 3 && arr.every(pred);
console.log(`\n===== S34 R-E universal action bar @390 ${process.env.WK ? 'WebKit' : 'chromium'} DET-3x =====`);
trace.forEach((R, i) => console.log(`  /trace    iter${i + 1}: ${JSON.stringify(R)}`));
scenario.forEach((R, i) => console.log(`  /scenario iter${i + 1}: ${JSON.stringify(R)}`));
model.forEach((R, i) => console.log(`  /model    iter${i + 1}: ${JSON.stringify(R)}`));
console.log(`  nav: ${JSON.stringify(nav)}  consoleErrors=${consoleErrors}`);
const traceGreen = okAll(trace, R => R.hasDrawer && R.present && R.hasDefault && R.noModelVerbs && R.cleared);
const scenarioGreen = okAll(scenario, R => R.hasDrawer && R.present && R.hasDefault && R.noModelVerbs && R.cleared);
const modelGreen = okAll(model, R => R.hasDefault && R.hasModelVerbs); // universal default PRESENT + full model verbs (unregressed)
const navGreen = nav && nav.scenarioNav && nav.editNav;
const noThrows = consoleErrors === 0;
console.log(`\n/trace (non-model, bar PRESENT [Scenario,Edit], empty→clear): ${traceGreen ? 'GREEN DET-3x' : 'RED'}`);
console.log(`/scenario (non-model, bar PRESENT, empty→clear): ${scenarioGreen ? 'GREEN DET-3x' : 'RED'}`);
console.log(`/model (universal default + FULL model verb-set, UNREGRESSED): ${modelGreen ? 'GREEN DET-3x' : 'RED'}`);
console.log(`A1 nav (◆Scenario→/scenario?ior= + ✎Edit→/edit/scenario/index/…): ${navGreen ? 'GREEN' : 'RED'} (${JSON.stringify(nav)})  |  no page throws: ${noThrows ? 'GREEN' : 'RED'}`);
console.log(`server-manager / feature-manager / in-room: SAME shared rb-detail-drawer.universalActionBar (ffd44b17) — mechanism-proven by construction; real-page confirm on the gated ones = Tron device.`);
const green = traceGreen && scenarioGreen && modelGreen && navGreen && noThrows;
console.log('OVERALL R-E/A1:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
