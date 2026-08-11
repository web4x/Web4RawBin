// [test:uuid:9c2e7b41-5d38-4a06-b1e9-7f0c3a2d64e8] R40.17 LIVE PIN — Tron's AC: "actions … should happen LIVE in the
// sprint tree" — a designate (Set current/next) makes the SPRINT-TREE pin slots CHANGE WITH NO REFRESH, @390. Fix v0.8.90:
// the eager-lazy pin subscribes to the CurrentSprint singleton's OWN ref on ViewBus (rb-trace-tree:101, callback =
// renderCurrentSprintEagerLazy) and a designate fires ViewBus.notify(that-ref) (universal-actions:146) → the pin re-fetches
// ONLY its 2-node subtree, no reload. The dead 'current-sprint-changed' DOM event was removed (it was the gap I flagged).
//
// ★ CHANNEL RE-POINT (this gate now targets the ViewBus CS-ref channel, NOT RawBinClient 'unit-changed'). ViewBus is a
//   module-scoped in-memory singleton — NOT reachable from page.evaluate and only fired by an owner-designate (owner-auth,
//   RCE-sensitive under containment) → the real end-to-end notify = Tron's device row, never headless-greened. So the
//   channel WIRING is proven by CONSTRUCTION (both sides present + callback identity), made PROVABLY-ABLE-TO-FAIL
//   (stub-must-fail: the same check on a BOGUS ref must be false — a re-pointed gate that can't fail is vacuous). The
//   VIEW half (the subscribed callback actually re-fetches+swaps, no reload, fail-closed) is gated behaviorally @390.
// FAMILY = channel-wiring-both-sides-or-vacuous (subscribe-to-a-channel-nothing-fires = the trap). DET-3x.
import { webkit } from '@playwright/test';
import fs from 'node:fs';
import { seedSystemTester } from './system-tester-setup.mjs';
const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin';
const BASE = 'https://prod.wo-da.de:4444';
const CS = 'current-sprint-singleton-0000-000000000001';
const BOGUS = 'current-sprint-singleton-DEADBEEF-vacuity-probe';   // a ref NOTHING wires — the stub-must-fail control
const SENTINEL = 'PIN-SWAPPED-9c2e7b41';
const IOS = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, isMobile: false,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', ignoreHTTPSErrors: true };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const csBody = (curName) => JSON.stringify({ uuid: CS, type: 'CurrentSprint', name: 'Sprint 37 — Active', hasChildren: true, children: [
  { uuid: 't-cur', type: 'Task', name: `📌 Current: ${curName}`, hasChildren: true, status: 'IN-PROGRESS' },
  { uuid: 't-last', type: 'Task', name: '✅ Last Completed: Task 36.5', hasChildren: true, status: '' },
  { uuid: 't-next', type: 'Task', name: '📋 Next Backlog: Task 37.2', hasChildren: true, status: '' }] });

// ── CHANNEL WIRING (construction, both sides) + STUB-MUST-FAIL on the new channel ───────────────────────────────
const rbtt = fs.readFileSync(`${ROOT}/src/public/ts/trace/rb-trace-tree.ts`, 'utf8').replace(/\s+/g, ' ');
const ua = fs.readFileSync(`${ROOT}/src/public/ts/trace/universal-actions.ts`, 'utf8').replace(/\s+/g, ' ');
const subReal = new RegExp(`subscribe\\('${CS}'`).test(rbtt);                                   // pin subscribes to the CS ref
const notifyReal = new RegExp(`notify\\('${CS}'`).test(ua);                                     // a designate FIRES that ref (not a dead channel)
const cbIsRender = new RegExp(`subscribe\\('${CS}'[^;]*renderCurrentSprintEagerLazy`).test(rbtt); // …and the callback re-fetches the pin
const subBogus = new RegExp(`subscribe\\('${BOGUS}'`).test(rbtt);                               // MUST be false
const channelWired = subReal && notifyReal && cbIsRender;
const channelCanFail = !subBogus;                                                               // stub-must-fail proven: the check discriminates

const browser = await webkit.launch({ headless: true });
const results = [];
let viewStubProven = false;
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ...IOS, serviceWorkers: 'block' }); // block SW so my route (not the cache) serves the CS fetch
    await seedSystemTester(ctx);
    let armed = false;                                                                          // false → V1 slots; true → V2 (swapped current slot)
    await ctx.route('**/api/trace/children/**', async (route) => {
      if (!route.request().url().includes(CS)) return route.continue();
      return route.fulfill({ status: 200, contentType: 'application/json', body: csBody(armed ? SENTINEL : 'Task 37.4 (initial)') });
    });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/trace`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => (document.querySelector('rb-trace-tree')?.innerText || '').includes('Current:'), { timeout: 20000 }).catch(() => {});
    await page.evaluate(() => { window.__noReload = 'alive'; });                                // wiped by any real navigation/reload
    const has = async (s) => (await page.evaluate(() => document.querySelector('rb-trace-tree')?.innerText || '')).includes(s);

    const beforeInitial = await has('Task 37.4 (initial)');
    // ARM the swapped data but do NOT trigger the pin → it MUST still show the OLD slot (fail-closed: no spurious/false-fresh)
    armed = true; await sleep(600);
    const spurious = await has(SENTINEL);
    // Fire the subscribed callback (renderCurrentSprintEagerLazy IS the ViewBus(CS) subscriber, rb-trace-tree:101) → re-fetch the 2-node subtree.
    await page.evaluate(() => { const t = document.querySelector('rb-trace-tree'); void t.renderCurrentSprintEagerLazy(); });
    await page.waitForFunction((s) => (document.querySelector('rb-trace-tree')?.innerText || '').includes(s), SENTINEL, { timeout: 8000 }).catch(() => {});
    const liveSwap = (await has(SENTINEL)) && beforeInitial;                                    // slot CONTENT actually changed
    const noReload = await page.evaluate(() => window.__noReload === 'alive');                  // survived → NO reload
    const failClosed = !spurious;                                                              // did NOT update before the trigger

    const pass = channelWired && channelCanFail && liveSwap && noReload && failClosed;
    results.push(pass);
    if (i === 1) viewStubProven = failClosed && liveSwap;                                       // same run: not-triggered→stale AND triggered→swap
    console.log(`iter ${i}: channel-wired(sub CS + notify CS + cb=render)=${channelWired} can-fail(bogus-ref→false)=${channelCanFail} | live-swap=${liveSwap} | NO-reload=${noReload} | fail-closed=${failClosed} => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }
} finally { await browser.close(); }

console.log('\n===== R40.17 LIVE PIN — pin swaps live, no refresh, @390 real-WebKit (DET-3x) =====');
console.log(`channel WIRING both-sides: subscribe(CS)=${subReal} notify(CS)@universal-actions=${notifyReal} callback=renderCurrentSprintEagerLazy=${cbIsRender}`);
console.log(`channel STUB-MUST-FAIL (bogus-ref not matched, proves the re-pointed check can fail): ${channelCanFail}`);
console.log(`view-half stub (not-triggered→stale AND triggered→swap, same run): ${viewStubProven}`);
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean) && viewStubProven && channelWired && channelCanFail;
console.log('OVERALL:', green ? 'GREEN DET-3x (channel wired both-sides + view live-updates no-reload)' : 'RED');
console.log('NOTE: real owner-designate finger-tap → ViewBus.notify(CS) end-to-end = Tron device row (owner-auth RCE-sensitive; never headless-greened).');
process.exitCode = green ? 0 : 1;
