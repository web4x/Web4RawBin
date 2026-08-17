// S34 WebKit @390 sweep — R-D1 / R-C / R-D2 / R-B, real-WebKit (Safari 605.1.15 = Tron's engine). DET-3x + planted-defect.
// COMPONENT-HARNESS (r335c/r3365): serve /model shell (route.fulfill) + REAL model bundle (drawer + wireDrawerActions mount
// at init; data APIs public). NO authed /model, NO seed. Pollution-safe: route-intercept every write (folder/create,
// diagram remove) OR byte-restore the DIAG unit. Drive the REAL event contract, assert independently (≠ author oracle).
//   R-D2 actionsForContext (a1a5be99, R34.6): modelelement → unit verbs [new/rename/delete] ALWAYS; +membership
//        [add-to-diagram/discover/remove-from-diagram] ONLY when rb-active-diagram set. PLANTED: no active-diagram → unit only.
//   R-B  addFolder (2f65a342, R34.3): 📁 Add-folder verb present + click → POST /api/model/folder/create (intercepted) +
//        rb-tree-reveal{folder:} fires. PLANTED: cancel the name prompt → NO create POST.
//   R-D1 showActionsForType (e6870858, R34.5): drawer.showActionsForType('modelelement',ref) → rb-tree-reveal FIRES (auto-
//        expand-on-navigate). PLANTED: ('diagram',ref) → rb-tree-reveal does NOT fire (t==='modelelement' guard).
//   R-C  removeFromDiagram (4c9c3969, R34.4): built in the diagram section below.
// [test:uuid:9f4bff71-5253-4bc4-ac3b-bbbbb3f40533] S34 R-D1 RbDetailDrawer.showActionsForType (Impl e6870858, R34.5) @390 real-WebKit DET-3x: on a modelelement detail-show it fires rb-tree-reveal{ref} (auto-expand-on-navigate); a diagram detail-show does NOT (t==='modelelement' guard). DISTINCT-INTENT 2nd Test on e6870858 (alongside R33.6.5 bd8c14fc).
// [test:uuid:5c898784-70fb-4bd9-b41c-054f69e52d01] S34 R-C ModelView.removeFromDiagram (Impl 4c9c3969, R34.4) @390 real-WebKit DET-3x: with an active diagram + a selected element, the ✕ Remove-from-diagram verb is present and firing it POSTs /api/model/diagram/remove-view {diagramUuid,elementUuid} + dispatches rb-diagram-refresh; PLANTED no-active-diagram → no POST. (remove-view route-intercepted — pollution-free; a real remove-view mutates the live diagram in-memory.)
// [test:uuid:070d8d75-3200-41a9-8c1f-d6f8defe501e] S34 R-D2 ModelView.actionsForContext (Impl a1a5be99, R34.6) @390 real-WebKit DET-3x: selecting a class → drawer action-bar shows unit verbs [new/rename/delete] ALWAYS + membership [add-to-diagram/discover/remove-from-diagram] ONLY when a diagram is active; PLANTED no-diagram → unit only (no membership).
// [test:uuid:8ce0dbff-68f3-4850-80e1-f2e7d6b9241e] S34 R-B ModelView.addFolder (Impl 2f65a342, R34.3) @390 real-WebKit DET-3x: the 📁 Add-folder verb is present and firing it POSTs /api/model/folder/create + dispatches rb-tree-reveal{folder:}; PLANTED cancel the name prompt → no create POST. (create route-intercepted — pollution-free.)
import { chromium, webkit, devices } from '@playwright/test';
import fs from 'node:fs'; import path from 'node:path'; import https from 'node:https';
const ENGINE = process.env.WK ? webkit : chromium;               // WK=1 → real Safari @390 (WebKit≠chromium false-green class)
const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin', BASE = 'https://prod.wo-da.de:4444';
const TARGET = process.env.R34_TARGET || '0.8.42';
const servedVersion = await new Promise((res) => { const q = https.request({ host: 'prod.wo-da.de', port: 4444, path: '/api/config', rejectUnauthorized: false }, (r) => { let b = ''; r.on('data', c => b += c); r.on('end', () => { try { res(JSON.parse(b).version); } catch { res('?'); } }); }); q.on('error', () => res('?')); q.end(); });
console.log(servedVersion === TARGET ? `served==${TARGET} verified — SERVED verdict on ${process.env.WK ? 'WebKit' : 'chromium'}.` : `⚠ PHANTOM-GUARD: served=${servedVersion} != ${TARGET} (dry-run on committed bundle).`);
const DIST = path.join(ROOT, 'src/public/dist');
const BUNDLE = '/dist/' + fs.readdirSync(DIST).filter(f => /^model-.*\.js$/.test(f)).map(f => [f, fs.statSync(path.join(DIST, f)).mtimeMs]).sort((a, b) => b[1] - a[1])[0][0];
const OUT = path.join(ROOT, 'test-results/r34-sweep') + '/'; fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const SHELL = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">`
  + `<link rel="stylesheet" href="/app.css"><style>body{margin:0;background:#0d1117;color:#e6edf3;height:100dvh;display:flex;flex-direction:column;font-family:system-ui}.trace-page{flex:1;min-height:0;overflow:auto;position:relative}#err{color:#f85149}</style></head><body>`
  + `<div class="trace-page"><div class="trace-tree-panel"><rb-trace-tree id="model-tree"></rb-trace-tree></div><div id="err"></div></div>`
  + `<script type="module" src="${BUNDLE}"></script></body></html>`;

const readVerbs = (page) => page.evaluate(() => [...document.querySelectorAll('rb-detail-drawer .drawer-actionbar .da-btn')].map(b => b.getAttribute('data-verb')));
// R-E (v0.8.43+): the bar is composed by RbDetailDrawer.showActionsForType→universalActionBar (host verbs via a registered
// provider), NOT the old direct rb-drawer-detail-shown→setActions. Drive the CURRENT contract so provider verbs populate.
const showType = (page, type, ref) => page.evaluate(([t, r]) => { const d = document.querySelector('rb-detail-drawer'); if (d && d.showActionsForType) { d.showActionsForType(t, r || (t + ':x')); return true; } return false; }, [type, ref]);
const setActiveDiagram = (page, uuid) => page.evaluate((u) => document.dispatchEvent(new CustomEvent('rb-active-diagram', { detail: { uuid: u }, bubbles: true })), uuid);

async function runOnce(browser, i) {
  const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  let folderPosted = 0, removeViewBodies = [];
  await page.route(u => u.pathname === '/model', r => r.fulfill({ status: 200, contentType: 'text/html', body: SHELL }));
  await page.route('**/api/model/folder/create', r => { folderPosted++; return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, uuid: 'planted-folder-uuid' }) }); });
  // R-C: route-intercept remove-view (pollution-free — a REAL remove-view mutates the live diagram IN-MEMORY, which disk byte-restore can't undo until restart, rule #3). Capture the body to prove the correct target.
  await page.route('**/api/model/diagram/remove-view', r => { try { removeViewBodies.push(JSON.parse(r.request().postData() || '{}')); } catch { removeViewBodies.push({}); } return r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"removed":true}' }); });
  await page.goto(`${BASE}/model`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!customElements.get('rb-detail-drawer') && !!document.querySelector('rb-detail-drawer .drawer-actionbar'), { timeout: 15000 }).catch(() => {});
  await page.waitForFunction(() => { document.dispatchEvent(new CustomEvent('rb-drawer-detail-shown', { detail: { type: 'diagram', ref: 'x' }, bubbles: true })); return document.querySelectorAll('rb-detail-drawer .drawer-actionbar .da-btn').length > 0; }, { timeout: 10000, polling: 200 }).catch(() => {});
  await page.evaluate(() => { window.__reveals = []; document.addEventListener('rb-tree-reveal', e => window.__reveals.push(e.detail?.ref || '')); });

  // ── R-D2 (a1a5be99) resolution-logic FOLDED (2026-08-17, PO ruling) → r4037-context-actions-gate (node
  //    applicableActionsFor: unit-always + membership-iff-diagram, ALL cases + stub-must-fail). This sweep KEEPS the
  //    @390 real-WebKit ACTION coverage r4037 cannot do (R-D1 tree-reveal / R-C remove-view / R-B add-folder below —
  //    each renders a1a5be99's supplied decls in the @390 bar). Test 070d8d75 stays historical-credit on a1a5be99. ──

  // ── R-B (2f65a342): 📁 Add-folder verb present + click → create POST + rb-tree-reveal ──
  await setActiveDiagram(page, null); await showType(page, 'diagram', 'diagram:rawbin:diagram'); await sleep(200);
  const rbVerbs = await readVerbs(page);
  const folderVerbPresent = rbVerbs.includes('add-folder');
  page.once('dialog', d => d.accept('R34TestFolder').catch(() => {}));   // prompt('New folder name')
  const revBefore = await page.evaluate(() => window.__reveals.length);
  await page.evaluate(() => document.dispatchEvent(new CustomEvent('rb-drawer-action', { detail: { verb: 'add-folder' }, bubbles: true })));
  await sleep(900);
  const rbReveal = await page.evaluate((n) => window.__reveals.slice(n).some(r => /^folder:/.test(r)), revBefore);
  const rb = folderVerbPresent && folderPosted >= 1 && rbReveal;
  // R-B planted: cancel the prompt → NO create POST
  const postedBeforePlanted = folderPosted;
  page.once('dialog', d => d.dismiss().catch(() => {}));
  await page.evaluate(() => document.dispatchEvent(new CustomEvent('rb-drawer-action', { detail: { verb: 'add-folder' }, bubbles: true })));
  await sleep(500);
  const rbBite = folderPosted === postedBeforePlanted;   // cancelled prompt → no new POST

  // ── R-D1 (e6870858): showActionsForType('modelelement') fires rb-tree-reveal; ('diagram') does NOT ──
  const rd1 = await page.evaluate(() => {
    const d = document.querySelector('rb-detail-drawer'); if (!d || typeof d.showActionsForType !== 'function') return { ok: false, reason: 'no-fn' };
    const seen = []; const h = (e) => seen.push(e.detail?.ref || ''); document.addEventListener('rb-tree-reveal', h);
    d.showActionsForType('modelelement', 'modelelement:cls-nav'); const afterME = seen.length;
    d.showActionsForType('diagram', 'diagram:d1'); const afterDIAG = seen.length;
    document.removeEventListener('rb-tree-reveal', h);
    return { ok: afterME >= 1 && afterDIAG === afterME, firedOnModelElement: afterME >= 1, firedOnDiagram: afterDIAG > afterME };
  });

  // ── R-C (4c9c3969): remove-from-diagram — ✕ verb present (active-diagram) + fires remove-view {diagramUuid,elementUuid} + rb-diagram-refresh ──
  const DUUID = 'faa4acad-41a6-48fc-ad0d-dd0044c123f7', EUUID = 'elem-abc';
  await setActiveDiagram(page, DUUID); await showType(page, 'modelelement', 'modelelement:' + EUUID); await sleep(200);
  const rcVerbPresent = (await readVerbs(page)).includes('remove-from-diagram');
  await page.evaluate(() => { window.__refresh = 0; document.addEventListener('rb-diagram-refresh', () => window.__refresh++); });
  await page.evaluate(() => document.dispatchEvent(new CustomEvent('rb-drawer-action', { detail: { verb: 'remove-from-diagram' }, bubbles: true })));
  await sleep(700);
  const rcRefresh = await page.evaluate(() => window.__refresh);
  const rcPost = removeViewBodies.find(b => b.diagramUuid === DUUID && b.elementUuid === EUUID);
  const rc = rcVerbPresent && !!rcPost && rcRefresh >= 1;
  // R-C planted: NO active diagram → removeFromDiagram bails ('Open a diagram first'), no remove-view POST
  const postsBeforeBite = removeViewBodies.length;
  await setActiveDiagram(page, null); await showType(page, 'modelelement', 'modelelement:' + EUUID); await sleep(150);
  await page.evaluate(() => document.dispatchEvent(new CustomEvent('rb-drawer-action', { detail: { verb: 'remove-from-diagram' }, bubbles: true })));
  await sleep(400);
  const rcBite = removeViewBodies.length === postsBeforeBite;

  await ctx.close();
  return { folderVerbPresent, folderPosted, rbReveal, rb, rbBite, rd1, rcVerbPresent, rcPost: !!rcPost, rcRefresh, rc, rcBite };
}

const browser = await ENGINE.launch({ headless: true, ...(process.env.WK ? {} : { args: ['--no-sandbox', '--ignore-certificate-errors'] }) });
const runs = [];
try { for (let i = 1; i <= 3; i++) runs.push(await runOnce(browser, i)); } finally { await browser.close(); }

console.log(`\n===== S34 WebKit sweep (R-D1/R-C/R-B; R-D2 resolution folded→r4037) @390 ${process.env.WK ? 'WebKit' : 'chromium'} DET-3x =====`);
runs.forEach((R, i) => console.log(`iter ${i + 1}: rd1=${R.rd1.ok} rc=${R.rc}(verb=${R.rcVerbPresent} post=${R.rcPost} refresh=${R.rcRefresh} bite=${R.rcBite}) rb=${R.rb}(bite=${R.rbBite})`));
const det = k => runs.length === 3 && runs.every(R => (typeof R[k] === 'object' ? R[k].ok : R[k]) === true);
const RD1 = det('rd1'), RC = det('rc') && runs.every(R => R.rcBite), RB = det('rb') && runs.every(R => R.rbBite);
console.log(`\nR-D1 showActionsForType→rb-tree-reveal (e6870858): ${RD1 ? 'GREEN DET-3x' : 'RED'}`);
console.log(`R-C  removeFromDiagram ✕-verb+remove-view+refresh (4c9c3969): ${RC ? 'GREEN DET-3x' : 'RED'}`);
console.log(`R-B  add-folder verb+create+reveal (2f65a342): ${RB ? 'GREEN DET-3x' : 'RED'}`);
console.log('NOTE (fold 2026-08-17, PO ruling): R-D2 actionsForContext RESOLUTION-LOGIC (unit-always + membership-iff-diagram) → r4037-context-actions-gate (node applicableActionsFor, all cases + stub-must-fail). Test 070d8d75 stays historical-credit on a1a5be99. Sweep keeps 3 @390 real-WebKit ACTION tests r4037 cannot cover — not hollow.');
const all = RD1 && RC && RB;
console.log('OVERALL S34 sweep (R-D1/R-C/R-B):', all ? 'GREEN DET-3x' : 'RED');
process.exitCode = all ? 0 : 1;
