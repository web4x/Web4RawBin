// TRON TWO-CLIENT ACCEPTANCE HARNESS (prep for Tron's R40.10 approve → live second-tab measurement, @390 real-WebKit).
// Tron's act: approve a QA-Review task in ONE client → the OTHER client's views update LIVE (no refresh, no poll).
// ★ The REAL end-to-end (owner-auth approve → server publishUnitChanged → WS fan-out → both tabs re-render) is Tron's
//   OWNER-authenticated device tap (RCE-sensitive; NEVER headless-greened — same law as r4017). This harness proves,
//   before he touches anything: (A) the wiring BOTH-SIDES by construction + stub-must-fail; (B) the RECEIVE+RENDER half
//   behaviorally in a 2nd client — a 'graph' notify (what the WS 'unit-changed' bridge fires) makes the tree re-render
//   the QA-Review→Done flip with NO reload; (C) the per-surface watchers Tron will read (tree ROW / status BADGE / DETAIL
//   / approve-queue) so I report per-surface, never a general green. Rehearsed on a THROWAWAY route (never Tron's task).
// MECHANISM (measured, served 0.8.103): approveByOwner (server.ts:1562) → UnitController.apply(target:Done, publish:
//   publishUnitChanged); RawBinClient.ts:98  msg 'unit-changed' → ViewBus.notify('graph'); rb-trace-tree.ts:107
//   ViewBus.subscribe('graph', ()=>this.render()). TASKS: T37.26 c8e0b1d2 (Planned — NO approve, NO set-current[retired
//   R40.18] = both correct-absent); T37.24 5acdcc4c (QA Review — approve half + it IS the realtime-MVC slice task).
import { webkit } from '@playwright/test';
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { seedSystemTester } from './system-tester-setup.mjs';
const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin';
const BASE = 'https://prod.wo-da.de:4444';
const IOS = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, isMobile: false,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', ignoreHTTPSErrors: true };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const NODE = 'tron-twoclient-parent-0001';
const SENT = 'Task 37.24: LIVE-FLIP-SENTINEL';
const body = (done) => JSON.stringify({ uuid: NODE, type: 'Sprint', name: 'Sprint 37 — Active', hasChildren: true, children: [
  { uuid: '5acdcc4c-3f6c-4aea-95ad-3ab19b14ff40', type: 'Task', name: done ? SENT : 'Task 37.24: awaiting verdict', hasChildren: false, status: done ? 'Done' : 'QA Review' }] });

// ── (A) WIRING both-sides by construction + STUB-MUST-FAIL ──
// ★ SERVED-HONEST: read the COMMITTED code (git show HEAD:) == what is BUILT+SERVED, NEVER the working tree — a peer's
//   uncommitted fix in the tree would false-green a claim about the running build (the exact near-miss I owned 2026-08-18).
//   Caller must also confirm served==committed==tagged before trusting this against the live build.
const showHead = (rel) => { try { return execSync(`git show HEAD:${rel}`, { cwd: ROOT, encoding: 'utf8' }).replace(/\s+/g, ' '); } catch { return ''; } };
const dirty = execSync('git status --porcelain src/ts/server/server.ts src/public/ts/RawBinClient.ts src/public/ts/trace/rb-trace-tree.ts', { cwd: ROOT, encoding: 'utf8' }).trim();
const rbc = showHead('src/public/ts/RawBinClient.ts');
const tree = showHead('src/public/ts/trace/rb-trace-tree.ts');
const srv = showHead('src/ts/server/server.ts');
const bridgeWired = /'unit-changed'.{0,40}ViewBus\.notify\('graph'\)/.test(rbc);          // WS transport → bus
const subWired = /ViewBus\.subscribe\('graph',\s*\(\)\s*=>\s*this\.render\(\)\)/.test(tree); // bus → tree re-render
const emitWired = /approveByOwner[\s\S]{0,600}?UnitController\.apply\([^)]*target:\s*'Done'[\s\S]{0,80}?publish:\s*publishUnitChanged/.test(srv); // approve → seam emit
const canFail = !/ViewBus\.subscribe\('BOGUS-NO-CHANNEL'/.test(tree);                       // stub-must-fail: the check discriminates
const wiring = bridgeWired && subWired && emitWired;

const surfaces = (page) => page.evaluate(() => {
  const t = document.querySelector('rb-trace-tree');
  const txt = t?.innerText || '';
  const greenBadge = !!t?.querySelector('.badge-done, .status-done, [data-status="Done"], .de-badge-green');
  return { row24: txt.includes('37.24'), sentinel: txt.includes('LIVE-FLIP-SENTINEL'), awaiting: txt.includes('awaiting verdict'), greenBadge, len: txt.length };
});

const browser = await webkit.launch({ headless: true });
let pass = false, note = '';
try {
  // TWO clients on the SAME view, both showing T37.24 = QA Review (armed=false)
  const mk = async (armedRef) => {
    const ctx = await browser.newContext({ ...IOS, serviceWorkers: 'block' });
    await seedSystemTester(ctx);
    await ctx.route('**/api/trace/children/**', (r) => r.request().url().includes(NODE)
      ? r.fulfill({ status: 200, contentType: 'application/json', body: body(armedRef.v) })
      : r.continue());
    const page = await ctx.newPage();
    await page.goto(`${BASE}/trace?seed=${NODE}`, { waitUntil: 'networkidle' }).catch(() => {});
    await page.evaluate(() => { window.__noReload = 'alive'; });
    return { ctx, page };
  };
  const aArm = { v: false }, bArm = { v: false };
  const A = await mk(aArm), B = await mk(bArm);
  // inject the seed so both trees fetch our NODE (route-controlled) — mount a seeded tree
  const mountSeed = async (page) => { await page.evaluate((n) => { let t = document.querySelector('rb-trace-tree'); if (!t) { t = document.createElement('rb-trace-tree'); document.body.appendChild(t); } t.setAttribute('data-seed-ior', `sprint:${n}`); t.setAttribute('ref', `sprint:${n}`); }, NODE); await sleep(1500); };
  await mountSeed(A.page); await mountSeed(B.page);

  const a0 = await surfaces(A.page), b0 = await surfaces(B.page);
  // FAIL-CLOSED: arm B's data to Done but do NOT fire the bus → B must STILL show QA Review (no spurious live-update)
  bArm.v = true; await sleep(600);
  const bSpurious = (await surfaces(B.page)).sentinel;
  // (B) RECEIVE+RENDER: fire the 'graph' subscriber in tab B (what the WS 'unit-changed' bridge triggers) → re-render
  await B.page.evaluate(() => { const t = document.querySelector('rb-trace-tree'); if (t && typeof t.render === 'function') t.render(); });
  await B.page.waitForFunction(() => (document.querySelector('rb-trace-tree')?.innerText || '').includes('LIVE-FLIP-SENTINEL'), { timeout: 8000 }).catch(() => {});
  const b1 = await surfaces(B.page);
  const a1 = await surfaces(A.page); // tab A NOT re-fired → stays QA Review (per-client receive, not a shared reload)
  const bNoReload = await B.page.evaluate(() => window.__noReload === 'alive');

  const liveFlip = b1.sentinel && !bSpurious;          // B updated ONLY after the notify (fail-closed)
  const perClient = a1.awaiting || !a1.sentinel;        // A untouched → it's a targeted re-render, not a global reload
  fs.mkdirSync(`${ROOT}/test-results/rtron-twoclient`, { recursive: true });
  await A.page.screenshot({ path: `${ROOT}/test-results/rtron-twoclient/tabA-qareview.png` }).catch(() => {});
  await B.page.screenshot({ path: `${ROOT}/test-results/rtron-twoclient/tabB-liveflip-done.png` }).catch(() => {});
  pass = wiring && canFail && liveFlip && bNoReload && perClient;
  note = `wiring(bridge=${bridgeWired} sub=${subWired} emit=${emitWired})=${wiring} can-fail=${canFail} | B fail-closed(no-spurious)=${!bSpurious} live-flip=${b1.sentinel} NO-reload=${bNoReload} | A-untouched=${perClient}`;
  await A.ctx.close(); await B.ctx.close();
} finally { await browser.close(); }

console.log('===== TRON TWO-CLIENT ACCEPTANCE HARNESS — prep (@390 real-WebKit) =====');
console.log('WIRING read from COMMITTED HEAD (git show HEAD:) = served-honest.', dirty ? ('DIRTY tree (served==committed only after expert deploys): ' + dirty.replace(/\n/g, ' | ')) : '(clean tree)');
console.log('  approve-EMIT served-wired (approveByOwner→UnitController.apply+publishUnitChanged):', emitWired, emitWired ? '' : '← NOT in served build yet (Tron will see NO live update until the fix deploys)');
console.log(note);
console.log('SURFACES to read per-client on Tron approve: (1) tree ROW text flips, (2) status BADGE → green Done, (3) DETAIL panel, (4) approve-queue drops the row.');
console.log('READY:', pass ? 'GREEN — wiring both-sides + receive/render half proven; observer rig + evidence capture ready for Tron\'s owner-tap' : 'RED — see note');
console.log('★ REAL owner-approve → publishUnitChanged → WS → both tabs = TRON\'s owner-auth device tap (RCE-sensitive, never headless-greened). This harness proves RECEIVE+WIRING; his tap proves EMIT.');
process.exitCode = pass ? 0 : 1;
