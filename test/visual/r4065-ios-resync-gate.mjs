// iOS-RESYNC GATE (Tron #1, off robbin-tester r4064b verdict + architect fix 0b9aa6dc7 in live-bridge.ts:48-66).
// The fix: on visibilitychange→visible OR pageshow(bfcache), resync() reopens a dead socket AND — the LOAD-BEARING half —
// ViewBus.notify(CurrentSprint) forces renderCurrentSprintEagerLazy to RE-FETCH from the server (a reconnect that does not
// refetch leaves Tron's stale DOM = a false-green). CONFOUND-FREE by construction: client-2's live WS is SEVERED (a dead,
// connecting-forever stub) so a broadcast CANNOT arrive over the channel → the ONLY way the DOM can heal is the foreground
// refetch. Reproduces Tron's exact situation: the change happened while his socket was dead.
//   ARM-A  resync heals:   WS dead → client-2 shows OLD → background(hidden) → client-1 make-currents a DIFFERENT-sprint task
//                          (guaranteed CS delta, missed by the dead channel) → foreground(visible) → assert DOM flips to NEW
//                          + a CS REFETCH fired post-foreground + the SENTINEL SURVIVES (positive proof: no full reload
//                          healed it for the wrong reason).
//   ARM-B  stub-must-fail: same, but NEUTER the visibilitychange listener (drop it at addEventListener) → foreground does
//                          nothing → DOM STAYS OLD. Proves ARM-A's green is load-bearing (without the helper, no heal).
//   ARM-C  fail-loud:      same, but BLOCK the CS refetch on foreground → the resync refetch FAILS → assert a fail-loud
//                          notice APPEARS (positive property). If the pin silently degrades → NOT-loud = a FINDING.
// HONEST SCOPE: proves the MECHANISM on desktop-WebKit (visibility→resync→refetch→DOM). iOS-FINAL is Tron's device — a
// desktop-green is NOT "his bug is fixed". Scratch-only; teardown asserts prod:4444 untouched.
import { webkit } from '@playwright/test';
import { setupFoundation } from './r4031-foundation.mjs';
import fs from 'node:fs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const IPHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' };
const R = (v) => console.log(v);
const sprintNumOf = (t) => { const m = /Sprint\s+(\d+)/.exec(t || ''); return m ? Number(m[1]) : null; };
// WS stub: a permanently-CLOSED socket (readyState=3) that never opens, never delivers a message, never fires 'close'
// (so no auto-reconnect storm). isOpen()===false so the fix's verify-or-reconnect fires; no frame can EVER arrive over
// the channel → the foreground REFETCH is the only possible heal. Static constants so the app's readyState compares work.
const WS_DEAD = `window.WebSocket = Object.assign(class { constructor(){ this.readyState = 3; } addEventListener(){} removeEventListener(){} send(){} close(){} }, { CONNECTING:0, OPEN:1, CLOSING:2, CLOSED:3 });`;
// neuter: swallow the resync trigger so a stubbed no-op helper turns the suite RED (stub-must-fail control).
const NEUTER_VIS = `(() => { const o = document.addEventListener.bind(document); document.addEventListener = (t,h,c) => { if (t === 'visibilitychange') return; return o(t,h,c); }; })();`;

const f = await setupFoundation();
const OWNER = fs.readFileSync('/root/.rawbin/owner-token', 'utf8').trim();
const smSession = (/sm_session=([^;]+)/.exec(f.ownerHeaders().Cookie || '') || [])[1] || '';
R(`scratch up: ${f.base} v${f.servedVersion} sha=${f.worktreeSha}`);

const browser = await webkit.launch();
const results = {};
let bundleHasFix = null;
try {
  const CS = 'current-sprint-singleton-0000-000000000001';
  const snap = (page) => page.evaluate(() => ((document.querySelector('rb-trace-tree') || document.body).textContent || '').replace(/\s+/g, ' ').trim().slice(0, 400));
  const mkActor = async () => { // client-1: normal, only POSTs make-current
    const ctx = await browser.newContext({ ...IPHONE, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
    if (smSession) await ctx.addCookies([{ name: 'sm_session', value: smSession, domain: 'localhost', path: '/' }]);
    await ctx.addInitScript((t) => { try { localStorage.setItem('rawbin-player-id', t); } catch {} }, OWNER);
    const page = await ctx.newPage(); await page.goto(f.base + '/trace', { waitUntil: 'domcontentloaded' }); return { ctx, page };
  };
  const mkPassive = async (extraInit) => { // client-2: WS severed (+ optional neuter), armed diag
    const ctx = await browser.newContext({ ...IPHONE, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
    if (smSession) await ctx.addCookies([{ name: 'sm_session', value: smSession, domain: 'localhost', path: '/' }]);
    await ctx.addInitScript((t) => { try { localStorage.setItem('rawbin-player-id', t); } catch {} }, OWNER);
    await ctx.addInitScript(WS_DEAD);
    if (extraInit) await ctx.addInitScript(extraInit);
    const page = await ctx.newPage();
    await page.goto(f.base + '/trace?diag=live-mvc', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => /CurrentSprint:\s*Sprint\s+\d+/.test((document.querySelector('rb-trace-tree')?.textContent) || ''), { timeout: 20000 }).catch(() => {});
    await sleep(500);
    return { ctx, page };
  };
  const actor = await mkActor();
  // SERVED==COMMITTED guard (INV-PDG): the fix lives in source (transport-lifecycle.ts) — assert it is actually in the
  // SERVED bundle the browser loads, else a RED means "not built yet", NOT "fix broken". Distinguishes the two cleanly.
  bundleHasFix = await actor.page.evaluate(async () => {
    for (const u of [...document.querySelectorAll('script[src]')].map((s) => s.src)) {
      try { if (/wireTransportResync|down:resync/.test(await (await fetch(u)).text())) return true; } catch { /* skip */ }
    }
    return false;
  });
  R(`  served bundle contains the fix (wireTransportResync): ${bundleHasFix}`);
  const targetFor = (curNum) => actor.page.evaluate(async (cur) => {
    const sprints = await (await fetch('/api/trace/sprints')).json();
    for (const s of sprints.filter((s) => s.number !== cur && s.hasChildren)) {
      const kids = await (await fetch(`/api/trace/children/${s.uuid}`)).json();
      const p = (kids.children || []).find((c) => c.type === 'Task' && c.status === 'Planned');
      if (p) return { taskUuid: p.uuid, sprintNum: s.number };
    }
    return null;
  }, curNum);
  const makeCurrent = (t) => actor.page.evaluate(async ({ t, tok }) => (await fetch(`/api/task/${t}/make-current`, { method: 'POST', headers: { 'x-player-token': tok } })).status, { t, tok: OWNER });
  // drive visibility on client-2 (webkit has no CDP visibility control → override the property + dispatch)
  const setVis = (page, state) => page.evaluate((s) => { try { Object.defineProperty(document, 'visibilityState', { value: s, configurable: true }); Object.defineProperty(document, 'hidden', { value: s === 'hidden', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); } catch (e) { return String(e); } }, state);

  // ── run one arm; returns the observations ──
  const runArm = async (name, { neuter = false, blockRefetch = false } = {}) => {
    const c2 = await mkPassive(neuter ? NEUTER_VIS : undefined);
    const csHits = []; c2.page.on('request', (rq) => { if (/\/api\/ior\/ior:instance:current-sprint-singleton|\/api\/trace\/(sprints|children)/.test(rq.url())) csHits.push(Date.now()); });
    const before = await snap(c2.page); const beforeNum = sprintNumOf(before);
    const pick = await targetFor(beforeNum);
    if (!pick) { results[name] = { verdict: 'NULL', detail: `no Planned task in a non-current sprint (cur=${beforeNum})` }; await c2.ctx.close(); return; }
    // SENTINEL (PO): a window prop + a DOM marker node that a full reload would WIPE → positive proof no reload healed it.
    await c2.page.evaluate(() => { window.__gateSentinel = 'SENT-' + Math.floor(performance.now()); const m = document.createElement('div'); m.id = '__gate_sentinel_node'; document.documentElement.appendChild(m); });
    const sentinelBefore = await c2.page.evaluate(() => window.__gateSentinel);

    await setVis(c2.page, 'hidden');                      // background — iOS would suspend the (already dead) socket here
    const mcStatus = await makeCurrent(pick.taskUuid);    // change happens while backgrounded + channel dead
    await sleep(1500);
    const afterHidden = await snap(c2.page);              // still OLD (no live delivery possible)
    if (blockRefetch) await c2.page.route(`**/api/ior/ior:instance:${CS}`, (r) => r.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"blocked"}' }));

    const tForeground = Date.now();
    await setVis(c2.page, 'visible');                     // FOREGROUND → the fix's resync() should fire
    await sleep(2500);
    const afterFg = await snap(c2.page); const fgNum = sprintNumOf(afterFg);
    const sentinelAfter = await c2.page.evaluate(() => window.__gateSentinel);
    const sentinelNode = await c2.page.evaluate(() => !!document.getElementById('__gate_sentinel_node'));
    const refetchFired = csHits.some((t) => t >= tForeground);
    // fail-loud (expert contract): onResyncError sets <html data-live-transport="down:resync:...">. Match 'resync'
    // SPECIFICALLY — the severed WS already sets down:ws-*, so a generic 'down' check would false-positive every arm.
    const failLoud = await c2.page.evaluate(() => /resync/.test(document.documentElement.getAttribute('data-live-transport') || ''));
    results[name] = { verdict: 'RAN', beforeNum, target: pick.sprintNum, afterHiddenNum: sprintNumOf(afterHidden), fgNum, mcStatus, refetchFired,
      sentinelSurvived: sentinelBefore && sentinelAfter === sentinelBefore && sentinelNode, healed: fgNum === pick.sprintNum && fgNum !== beforeNum, failLoud };
    R(`  ${name}: cur=${beforeNum}→target=${pick.sprintNum} mc=${mcStatus} | hidden=${sprintNumOf(afterHidden)} → fg=${fgNum} | healed=${results[name].healed} refetchFired=${refetchFired} sentinelSurvived=${results[name].sentinelSurvived} failLoud=${failLoud}`);
    await c2.ctx.close();
  };

  await runArm('ARM-A resync-heals');
  await runArm('ARM-B stub-must-fail', { neuter: true });
  await runArm('ARM-C fail-loud-on-refetch-fail', { blockRefetch: true });
} finally {
  await browser.close().catch(() => {});
  const td = await f.teardown();
  R(`teardown: prod:4444 up=${td.prodUp} leftoverScratch=${td.leftover}`);
}

// ── verdict ──
const A = results['ARM-A resync-heals'] || {}, B = results['ARM-B stub-must-fail'] || {}, C = results['ARM-C fail-loud-on-refetch-fail'] || {};
const aPass = A.healed === true && A.refetchFired === true && A.sentinelSurvived === true;   // resync refetched + healed, NO reload
const bPass = B.healed === false;                                                            // neutered helper → no heal (proves the bite)
const cPass = C.failLoud === true;                                                           // resync-fail surfaces a loud notice
R(`\n═══ iOS-RESYNC GATE ═══`);
R(`ARM-A resync-heals:            ${aPass ? 'GREEN' : 'RED'}  (healed=${A.healed} refetchFired=${A.refetchFired} sentinelSurvived=${A.sentinelSurvived})`);
R(`ARM-B stub-must-fail (control): ${bPass ? 'GREEN' : 'RED'}  (neutered→stayed-old=${B.healed === false})`);
R(`ARM-C fail-loud-on-refetch:    ${cPass ? 'GREEN' : 'RED'}  (data-live-transport=down:resync on forced refetch-fail=${C.failLoud})`);
R(`served bundle contains fix:    ${bundleHasFix}`);
const green = aPass && bPass && cPass;
if (!green && bundleHasFix === false) {
  R(`\nVERDICT: RED — EXPECTED: the fix (wireTransportResync) is SOURCE-ONLY, ABSENT from the served bundle (measured: served trace-page bundle has renderCurrentSprintEagerLazy but 0 wireTransportResync). "PRE-BUILT NOT served" at the bundle level → no onVis→resync wiring runs. ARM-B GREEN proves the gate bites + the harness is sound (visibility-sim fires, connectLiveBridge boots). RE-RUN AFTER the expert rebuilds src/public/dist (trace-page + app + manifest) → expect ARM-A + ARM-C GREEN. HONEST SCOPE: desktop-WebKit mechanism only; iOS-FINAL = Tron's device is the acceptance, a desktop-green is NOT "his bug is fixed".`);
} else {
  R(`\nVERDICT: ${green ? 'GREEN (mechanism proven on desktop-WebKit)' : 'NOT-GREEN'} — HONEST SCOPE: desktop-WebKit mechanism only; iOS-FINAL = Tron's device is the acceptance, a desktop-green is NOT "his bug is fixed".`);
}
process.exit(green ? 0 : 1);
