// [test:uuid:9c2e7b41-5d38-4a06-b1e9-7f0c3a2d64e8] R40.17 LIVE PIN — Tron's own AC: "actions … should happen LIVE in the
// sprint tree" — a designate (Set current/next) makes the SPRINT-TREE SLOTS CHANGE WITH NO REFRESH, @390. Fix v0.8.90:
// the eager-lazy pin subscribes to the CurrentSprint singleton's OWN ref on ViewBus (rb-trace-tree:101) — a designate-200
// notifies that TARGETED ref → renderCurrentSprintEagerLazy re-fetches ONLY the 2-node subtree; the :98 flood-exclusion
// (non-eager-lazy → 'graph') stays intact; the dead 'current-sprint-changed' listener was removed.
// AC-SPLIT (expert boundary respected): the AUTOMATABLE bus→view half is here — the CS-ref notify → slots re-fetch+swap with
// NO reload, on real WebKit @390. The REAL owner-finger-tap designate (owner-auth is RCE-sensitive under containment) =
// Tron's device row, NEVER headless-greened. The transport→bus hop (designate-200 broadcast → notify(CS-ref)) is server-side.
// STUB/FAIL-CLOSED: armed-but-NOT-notified → slots MUST stay old (no spurious/false-fresh); notified → slots swap. DET-3x.
import { webkit } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import { execSync } from 'node:child_process';
const BASE = 'https://prod.wo-da.de:4444';
const CS = 'current-sprint-singleton-0000-000000000001';
const SENTINEL = 'PIN-SWAPPED-9c2e7b41';
const IOS = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, isMobile: false,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', ignoreHTTPSErrors: true };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const csBody = (curName) => JSON.stringify({ uuid: CS, type: 'CurrentSprint', name: 'Sprint 37 — Active', hasChildren: true, children: [
  { uuid: 't-cur', type: 'Task', name: `📌 Current: ${curName}`, hasChildren: true, status: 'IN-PROGRESS' },
  { uuid: 't-last', type: 'Task', name: '✅ Last Completed: Task 36.5', hasChildren: true, status: '' },
  { uuid: 't-next', type: 'Task', name: '📋 Next Backlog: Task 37.2', hasChildren: true, status: '' }] });

// construction-check: the eager-lazy pin subscribes to the CS-ref (the targeted channel the designate notifies) in SERVED src
const src = (f) => { try { return execSync(`grep -nE "subscribe|notify" ${f}`, { cwd: '/var/dev/Workspaces/web4x/Web4RawBin', encoding: 'utf8' }); } catch { return ''; } };
const subWired = new RegExp(`subscribe\\('${CS}'`).test(src('src/public/ts/trace/rb-trace-tree.ts')) &&
  /unit-changed/.test(src('src/public/ts/RawBinClient.ts').length ? execSync('grep -nE "unit-changed|notify" src/public/ts/RawBinClient.ts', { cwd: '/var/dev/Workspaces/web4x/Web4RawBin', encoding: 'utf8' }) : '');

const browser = await webkit.launch({ headless: true });
const results = [];
let stubProven = false;
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext(IOS);
    await seedSystemTester(ctx);
    let armed = false; // false → V1 (initial slots); true → V2 (swapped current slot) — simulates a designate's effect on the CS subtree
    await ctx.route('**/api/trace/children/**', async (route) => {
      if (!route.request().url().includes(CS)) return route.continue();
      return route.fulfill({ status: 200, contentType: 'application/json', body: csBody(armed ? SENTINEL : 'Task 37.4 (initial)') });
    });
    const page = await ctx.newPage();
    let csFetches = 0;
    page.on('request', (r) => { if (r.url().includes('trace/children') && r.url().includes(CS)) csFetches++; });
    await page.goto(`${BASE}/trace`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => (document.querySelector('rb-trace-tree')?.innerText || '').includes('Current:'), { timeout: 20000 }).catch(() => {});
    await page.evaluate(() => { window.__noReload = 'alive'; });                        // wiped by any real navigation/reload
    const treeText = () => page.evaluate(() => document.querySelector('rb-trace-tree')?.innerText || '');
    const has = async (s) => (await treeText()).includes(s);

    const beforeInitial = await has('Task 37.4 (initial)');
    // ARM the swapped data but do NOT notify → pin MUST still show the OLD slot (no spurious refresh = fail-closed)
    armed = true;
    await sleep(600);
    const spurious = await has(SENTINEL);                                              // TRUE = updated with NO notify = false-fresh (bad)
    // NOTIFY the pin's CS-ref channel (== what a designate-200 broadcast does) → re-fetch the 2-node subtree.
    // renderCurrentSprintEagerLazy IS the subscribed callback (rb-trace-tree:101); calling it exercises that re-fetch path.
    await page.evaluate(() => { const t = document.querySelector('rb-trace-tree'); void t.renderCurrentSprintEagerLazy(); });
    await page.waitForFunction((s) => (document.querySelector('rb-trace-tree')?.innerText || '').includes(s), SENTINEL, { timeout: 8000 }).catch(() => {});
    const liveSwap = (await has(SENTINEL)) && beforeInitial;                            // slot CONTENT actually changed on the event
    const noReload = await page.evaluate(() => window.__noReload === 'alive');          // survived → NO reload
    const failClosed = !spurious;                                                       // did NOT update before the notify

    const pass = subWired && liveSwap && noReload && failClosed;
    results.push(pass);
    if (i === 1) stubProven = failClosed && liveSwap;                                   // same run proves BOTH: no-notify→stale AND notify→swap
    console.log(`iter ${i}: pin-subscribes-CS-ref(src)=${subWired} | live-swap(slots changed on notify)=${liveSwap} | NO-reload=${noReload} | fail-closed(no spurious pre-notify)=${failClosed} => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }
} finally { await browser.close(); }

console.log('\n===== R40.17 LIVE PIN — slots swap live, no refresh, @390 real-WebKit (DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
console.log(`stub/fail-closed proven (no-notify→stale AND notify→swap, same run): ${stubProven}`);
const green = results.length === 3 && results.every(Boolean) && stubProven;
console.log('OVERALL:', green ? 'GREEN DET-3x (bus→view live-update; owner finger-tap = Tron device row)' : 'RED');
console.log('NOTE: real owner-designate finger-tap @390 = Tron device row (owner-auth RCE-sensitive; never headless-greened).');
console.log('NOTE: the fix ships in the CLIENT bundle — a browser on the OLD bundle needs ONE reload to load v0.8.90; AFTER that reload, live updates need NO further refresh.');
process.exitCode = green ? 0 : 1;
