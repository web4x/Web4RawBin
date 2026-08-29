// [test:uuid:9c2e7b41-5d38-4a06-b1e9-7f0c3a2d64e8] R40.17 LIVE PIN — Tron's AC: a designate (Set-as-Current) makes the
// SPRINT-TREE pin slot change LIVE, no refresh, @390. RELIABLY — not "eventually", not "on a lucky run".
//
// ★ RETARGET (PO 2026-08-29): the prior version MOCKED the CurrentSprint channel (page.route served the CS body) and
//   DIRECTLY called renderCurrentSprintEagerLazy() — so it proved the callback swaps mock data while mocking AWAY the exact
//   real make-current→ViewBus.notify→eager-lazy-re-fetch→render path where the RACE lives. It GREENed while the real
//   behaviour is racy (measured r4060: sometimes a 3.5-5.6s lag, sometimes NEVER re-renders even after the re-fetch
//   resolves). That is a timing-dependent false-GREEN — a gate that passes when the re-render happens to fire.
//   NOW: exercise the REAL owner make-current on SCRATCH (owner-auth proven headless via the R40.31 foundation; the old
//   "never headless-greened" caveat is obsolete) over N iterations, and REQUIRE the pin to re-render to the designated
//   task within a TIGHT window EVERY time. FAIL on the racy-never case AND on the multi-second lag (a 3.5s+ stale pin
//   after an explicit action is not acceptable). RED now (defect live) → GREEN when the expert makes the re-render fire
//   reliably + cuts the ~5s CS re-fetch. A behavioural gate on the REAL path does not rot on a source rename.
// FAMILY = reliable-live-render-or-timing-dependent-green (a gate that greens on a lucky re-render = the trap).
import { setupFoundation } from './r4031-foundation.mjs';
import { webkit } from '@playwright/test';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const A = '9f11a990-79bd-46e4-95e2-abe066f4b95b'; // Sprint-40 Task 40.28 (declined to a band so the designation STICKS)
const B = '9a70ce5e-7e88-45f9-b921-0f8e9caf07a6'; // Sprint-40 Task 40.10 (band)
const CS = 'current-sprint-singleton-0000-000000000001';
const WINDOW_MS = 2500;   // "reliable" bar: an explicit action's pin re-render must land within 2.5s (a 3.5s+ stale pin is a fail)
const ITERS = 4;          // catch the RACE: any single non-re-render across N designations = RED (no timing-dependent green)
const IOS = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, isMobile: false, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', ignoreHTTPSErrors: true };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const tag = (u) => u === A ? '40.28' : '40.10';

const f = await setupFoundation({ commit: 'HEAD', buildDist: true });
const oh = f.ownerHeaders();
console.log(`R40.17 retarget — REAL make-current pin re-render reliability, scratch@HEAD ${f.servedVersion} (${ITERS}× within ${WINDOW_MS}ms each)`);
const serverCurrent = async () => { const r = await fetch(`${f.base}/api/trace/children/${CS}?mode=trace`).catch(() => null); if (!r) return null; const d = await r.json(); const ch = d.children || d; const c = (Array.isArray(ch) ? ch : []).find(x => x.role === 'current'); return c ? c.uuid : null; };

const b = await webkit.launch({ headless: true });
const results = [];
try {
  await fetch(`${f.base}/api/task/${A}/decline`, { method: 'POST', headers: oh }).catch(() => {}); // both bands so designations stick
  await fetch(`${f.base}/api/task/${B}/decline`, { method: 'POST', headers: oh }).catch(() => {});
  const ctx = await b.newContext({ ...IOS, serviceWorkers: 'block' });
  await ctx.addInitScript(t => { try { localStorage.setItem('rawbin-player-id', t) } catch {} }, oh['x-player-token']);
  const sm = (oh['Cookie'] || '').match(/sm_session=([^;]+)/); if (sm) await ctx.addCookies([{ name: 'sm_session', value: sm[1], domain: 'localhost', path: '/' }]);
  const p = await ctx.newPage();
  await p.goto(`${f.base}/trace`, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await p.waitForFunction(() => (document.querySelector('rb-trace-tree')?.innerText || '').includes('Current'), { timeout: 20000 }).catch(() => {});
  await sleep(1000);
  const pinShows = (t) => p.evaluate(s => (document.querySelector('rb-trace-tree')?.innerText || '').includes(`Task ${s}`) && /📌 Current/.test(document.querySelector('rb-trace-tree')?.innerText || ''), t);
  const setCurrent = (uuid) => p.evaluate((ref) => { const d = document.querySelector('rb-detail-drawer'); if (d) { d.setAttribute('open', ''); d.setAttribute('ref', ref); } }, `task:${uuid}`)
    .then(() => p.waitForFunction(() => [...document.querySelectorAll('button,[data-verb]')].some(e => /set as current/i.test(e.textContent || '') || e.getAttribute?.('data-verb') === 'set-current'), { timeout: 12000 }).catch(() => {}))
    .then(() => p.evaluate(() => { const x = [...document.querySelectorAll('button,[data-verb]')].find(e => /set as current/i.test(e.textContent || '') || e.getAttribute?.('data-verb') === 'set-current'); if (x) x.click(); }));

  for (let i = 1; i <= ITERS; i++) {
    // designate whichever band task is NOT currently pinned, so success REQUIRES a genuine transition (no vacuous OK)
    const svrBefore = await serverCurrent();
    const target = svrBefore === B ? A : B;
    const wasShowingTarget = await pinShows(tag(target));   // must be false → the OK below proves a real change
    await p.evaluate(() => { window.__nr = 'alive'; });
    await setCurrent(target);
    let renderedAt = null; const t0 = Date.now();
    while (Date.now() - t0 <= WINDOW_MS) { if (await pinShows(tag(target))) { renderedAt = Date.now() - t0; break; } await sleep(200); }
    const noReload = await p.evaluate(() => window.__nr === 'alive');
    const precondition = (await serverCurrent()) === target;        // server actually moved to target
    const transition = !wasShowingTarget;                           // pin was NOT already on target → a real re-render is required
    const ok = precondition && transition && renderedAt !== null && noReload;
    results.push({ i, target: tag(target), renderedAt, noReload, precondition, transition, ok });
    console.log(`iter ${i}: designate ${tag(target)} (pin was ${wasShowingTarget ? 'ALREADY '+tag(target)+' — vacuous, skip' : 'other'}) → re-rendered ${renderedAt !== null ? `@${renderedAt}ms` : `NEVER within ${WINDOW_MS}ms`} | server-moved=${precondition} noReload=${noReload} => ${ok ? 'OK' : (!precondition ? 'PRECOND-FAIL' : !transition ? 'VACUOUS-SKIP' : 'MISS')}`);
    await sleep(800);
  }
  await ctx.close();
} finally { await b.close(); const td = await f.teardown(); console.log(`teardown prodUp=${td.prodUp} leftover=${td.leftover}`); }

console.log('\n===== R40.17 LIVE PIN — REAL make-current re-renders the pin RELIABLY @390 (fail on ANY valid miss) =====');
results.forEach(r => console.log(`  iter ${r.i} (${r.target}): ${r.ok ? 'OK' : (!r.precondition ? 'PRECOND-FAIL' : !r.transition ? 'VACUOUS-SKIP' : 'MISS')}${r.renderedAt !== null ? ` @${r.renderedAt}ms` : ''}`));
const valid = results.filter(r => r.precondition && r.transition);         // iterations that genuinely required a re-render
const misses = valid.filter(r => !r.ok).length;                            // valid designations whose pin did NOT re-render in-window
const green = valid.length >= 2 && misses === 0;                           // need real coverage AND zero racy/slow misses
if (valid.length < 2) console.log(`INSUFFICIENT-COVERAGE: only ${valid.length} valid transition(s) — cannot certify (fix setup, do not score GREEN).`);
console.log('OVERALL:', green ? `GREEN (pin re-rendered within ${WINDOW_MS}ms on ALL ${valid.length} valid designations)` : `RED — ${misses}/${valid.length} valid designations did NOT re-render the pin within ${WINDOW_MS}ms (racy/slow live-pin = Tron's defect)`);
process.exitCode = green ? 0 : 1;
