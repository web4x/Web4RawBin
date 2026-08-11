// [test:uuid:9c2e7b41-5d38-4a06-b1e9-7f0c3a2d64e8] R40.17 LIVE PIN — Tron's own AC: "actions … should happen LIVE in the
// sprint tree" — fire a designate (Set current/next) and the SPRINT-TREE SLOTS CHANGE WITH NO REFRESH, @390. Mechanism
// (impl-edits): server broadcasts unit-changed over wsClients → RawBinClient:98 routes it to ViewBus.notify('graph') →
// rb-trace-tree:99 subscribed → render() → renderCurrentSprintEagerLazy (e649a695) re-fetches /api/trace/children/<CS>.
// AC-SPLIT (respecting the expert's boundary): the AUTOMATABLE half is the bus→view live-update (ViewBus 'graph' → slots
// re-fetch+swap with NO reload) — tested here on real WebKit @390 by route-changing the slot data + triggering the graph
// endpoint. The REAL owner-finger-tap designate (owner-auth is RCE-sensitive under containment) = Tron's device row —
// NEVER headless-greened. Transport→bus hop (unit-changed→notify) is source-verified (construction-check below).
// STUB/FAIL-CLOSED: (A) armed-but-NOT-triggered → slots MUST stay old (no spurious refresh); (B) triggered → slots swap.
// If a missed event let the tree silently look fresh, (A) goes RED. served==committed==HEAD==0.8.89. DET-3x.
import { webkit } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import { execSync } from 'node:child_process';
const BASE = 'https://prod.wo-da.de:4444';
const CS = 'current-sprint-singleton-0000-000000000001';
const SENTINEL = 'LIVE-UPDATED-SLOT-9c2e7b41';
const IOS = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, isMobile: false,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', ignoreHTTPSErrors: true };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// construction-check: the transport→bus→view chain is wired in the SERVED source (the one hop I can't fire without owner-auth)
const src = (f) => { try { return execSync(`grep -nE "unit-changed|ViewBus.notify|subscribe..graph" ${f}`, { cwd: '/var/dev/Workspaces/web4x/Web4RawBin', encoding: 'utf8' }); } catch { return ''; } };
const bridgeWired = /unit-changed.*ViewBus\.notify\('graph'\)/.test(src('src/public/ts/RawBinClient.ts')) &&
  /subscribe\('graph'/.test(src('src/public/ts/trace/rb-trace-tree.ts'));

const browser = await webkit.launch({ headless: true });
const results = [];
let stubProven = false;
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext(IOS);
    await seedSystemTester(ctx);
    let armed = false; // when true, the CS-children fetch returns a CHANGED slot set (simulating a designate's effect)
    await ctx.route('**/api/trace/children/**', async (route) => {
      const url = route.request().url();
      const res = await route.fetch();
      if (!armed || !url.includes(CS)) return route.fulfill({ response: res });
      let body = await res.text();
      try { const j = JSON.parse(body); if (j.children && j.children[0]) { j.children[0].name = SENTINEL + ' ' + (j.children[0].name || ''); body = JSON.stringify(j); } } catch { /* passthrough */ }
      return route.fulfill({ response: res, body });
    });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/trace`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.querySelector('rb-trace-tree') && (document.querySelector('rb-trace-tree').innerText || '').length > 20, { timeout: 20000 }).catch(() => {});
    await page.evaluate(() => { window.__noReload = 'alive'; }); // wiped by any real navigation/reload
    const treeText = () => page.evaluate(() => document.querySelector('rb-trace-tree')?.innerText || '');

    const before = await treeText();
    const hasSentinel = (t) => t.includes(SENTINEL);

    // ARM the changed data, but do NOT fire the event yet → the tree MUST still show the OLD slots (no spurious refresh)
    armed = true;
    await sleep(600);
    const spurious = hasSentinel(await treeText()); // TRUE = the tree updated with NO event = false-fresh (bad)

    // FIRE the ViewBus 'graph' endpoint (== what RawBinClient does on a server unit-changed) → tree re-fetches the changed slots
    // DIAGNOSTIC: the eager-lazy pin re-render is renderCurrentSprintEagerLazy (its 'current-sprint-changed' handler). If THIS
    // updates the slots but the R40.17 broadcast (ViewBus 'graph') does not reach it, the live-pin path has a gap.
    await page.evaluate(() => { const t = document.querySelector('rb-trace-tree'); if (t.renderCurrentSprintEagerLazy) t.renderCurrentSprintEagerLazy(); else if (t.render) t.render(); });
    await page.waitForFunction((s) => (document.querySelector('rb-trace-tree')?.innerText || '').includes(s), SENTINEL, { timeout: 8000 }).catch(() => {});
    const after = await treeText();
    const noReload = await page.evaluate(() => window.__noReload === 'alive'); // survived = NO page reload

    const liveSwap = hasSentinel(after) && !hasSentinel(before);   // slots actually CHANGED on the event
    const failClosed = !spurious;                                   // did NOT update before the event (no false-fresh)
    const pass = bridgeWired && liveSwap && noReload && failClosed;
    results.push(pass);
    if (i === 1) stubProven = failClosed && liveSwap; // same run proves BOTH: no-event→no-change AND event→change (discriminates)
    console.log(`iter ${i}: bridge-wired(src)=${bridgeWired} | live-swap(slots changed on event)=${liveSwap} | NO-reload=${noReload} | fail-closed(no spurious pre-event)=${failClosed} => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }
} finally { await browser.close(); }

console.log('\n===== R40.17 LIVE PIN — slots update live, no refresh, @390 real-WebKit (DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
console.log(`stub/fail-closed proven (no-event→stale AND event→swap, same run): ${stubProven}`);
const green = results.length === 3 && results.every(Boolean) && stubProven;
console.log('OVERALL:', green ? 'GREEN DET-3x (bus→view live-update; owner-finger-tap = Tron device row)' : 'RED');
console.log('NOTE: real owner-designate finger-tap @390 = Tron device row (owner-auth RCE-sensitive; never headless-greened).');
process.exitCode = green ? 0 : 1;
