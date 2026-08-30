// SELF-DRIVEN LIVE-MVC CAPTURE (PO #1, 2026-08-30) — reproduce Tron's "pin updates only after reload" symptom
// OURSELVES on the R40.31 isolated scratch server, so the team stops waiting on his device reload. ZERO prod mutation
// (all owner actions hit the scratch server:4643; teardown asserts prod:4444 untouched).
//
// PROCEDURE (PO): scratch up + owner minted → TWO real-WebKit @390 clients on /trace (owner-authed) → client-1 performs an
// owner ACTION (make-current) → client-2 stays PASSIVE (never acts) → observe whether client-2 updates from the broadcast
// alone → reload client-2 (= the sendBeacon trigger) → read the scratch server's live-mvc diag capture → discriminate:
//   frame + listeners==0            → STALE/DEAD SUBSCRIPTION
//   frame + listeners>0 + no change → iOS RENDER (fired, DOM didn't reflect) — but we're WebKit, so "no change" here = a real render gap
//   no frame near the action        → SUSPENDED SOCKET (client-2 never got the broadcast)
//   frame + threw                   → re-render EXCEPTION
// DOES-NOT-REPRODUCE (client-2 updates fine) → symptom is iOS-Safari-SPECIFIC (a major narrowing, per PO worth as much).
import { webkit } from '@playwright/test';
import { setupFoundation } from './r4031-foundation.mjs';
import fs from 'node:fs';
import path from 'node:path';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const IPHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' };
const CS_REF = 'current-sprint-singleton-0000-000000000001'; // the ref /trace's tree subscribes to; make-current notifies it

const R = (v) => console.log(v);
const f = await setupFoundation();
const scratchDir = fs.readdirSync('/tmp').filter((d) => d.startsWith(`r4031-scratch-${process.pid}-`)).map((d) => path.join('/tmp', d))[0] || null;
const smSession = (/sm_session=([^;]+)/.exec(f.ownerHeaders().Cookie || '') || [])[1] || '';
const OWNER = fs.readFileSync('/root/.rawbin/owner-token', 'utf8').trim(); // browser identity seed — NEVER printed

R(`scratch up: ${f.base} v${f.servedVersion} sha=${f.worktreeSha} | ownerSession=${!!smSession} | scratchDir=${scratchDir}`);
const readCapture = () => {
  if (!scratchDir) return null;
  const d = new Date();
  const name = `rawbin-live-mvc-diag-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}.log`;
  const p = path.join(scratchDir, 'data/logs', name);
  try { return fs.readFileSync(p, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)); } catch { return null; }
};

const browser = await webkit.launch();
let verdict = 'INCONCLUSIVE', exit = 1;
try {
  const mkClient = async (label, arm) => {
    const ctx = await browser.newContext({ ...IPHONE, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
    if (smSession) await ctx.addCookies([{ name: 'sm_session', value: smSession, domain: 'localhost', path: '/' }]);
    await ctx.addInitScript((tok) => { try { localStorage.setItem('rawbin-player-id', tok); } catch {} }, OWNER);
    const page = await ctx.newPage();
    await page.goto(f.base + '/trace' + (arm ? '?diag=live-mvc' : ''), { waitUntil: 'domcontentloaded' });
    // wait for the live transport to connect (bootstrapPage sets window.__liveTransport / data-live-transport)
    await page.waitForFunction(() => {
      const c = window.__rawbinClient; return (c && c.connected === true) || document.documentElement.getAttribute('data-live-transport') === 'up';
    }, { timeout: 20000 }).catch(() => {});
    await sleep(800);
    const state = await page.evaluate(() => ({
      connected: (window.__rawbinClient && window.__rawbinClient.connected) === true,
      liveTransport: window.__liveTransport || document.documentElement.getAttribute('data-live-transport') || null,
      recorderWrapped: /ring|sanitizeRef|live-mvc/.test(String(window.ViewBus && window.ViewBus.notify)) || undefined,
    }));
    R(`  ${label}: connected=${state.connected} transport=${JSON.stringify(state.liveTransport)}`);
    return { ctx, page };
  };

  const c1 = await mkClient('client-1 (actor)', false);
  const c2 = await mkClient('client-2 (PASSIVE, armed)', true);

  // snapshot client-2's observable current-sprint region BEFORE the action (passive — no click)
  const snap = (page) => page.evaluate(() => {
    const el = document.querySelector('[data-current-sprint], .current-sprint, #current-sprint, rb-trace-tree') || document.body;
    return (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 400);
  });
  const before = await snap(c2.page);

  // (3) CLIENT-1 performs the owner ACTION from its OWN context: make-current on the seeded Planned task.
  const planned = f.seeded.planned;
  const act = await c1.page.evaluate(async ({ planned, tok }) => {
    const r = await fetch(`/api/task/${planned}/make-current`, { method: 'POST', headers: { 'x-player-token': tok } });
    return { status: r.status, body: await r.text().catch(() => '') };
  }, { planned, tok: OWNER });
  R(`  client-1 make-current(${planned.slice(0, 8)}) → HTTP ${act.status}`);

  // (5) observe whether client-2 (passive) updates from the broadcast ALONE
  await sleep(4000);
  const after = await snap(c2.page);
  const domChanged = before !== after;
  R(`  client-2 DOM changed from broadcast alone: ${domChanged}`);

  // (6) reload client-2 = the sendBeacon trigger (pagehide) AND the discriminator: a reload re-fetches from the server,
  // so if the reloaded DOM differs from the passive-after DOM, the broadcast FAILED to apply what a reload reveals =
  // Tron's exact "only-after-reload" symptom. If they match, the mutation had no visible delta (fixture artifact).
  await c2.page.evaluate(() => { try { document.dispatchEvent(new Event('visibilitychange')); } catch {} });
  await c2.page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
  await c2.page.waitForFunction(() => (window.__rawbinClient && window.__rawbinClient.connected) === true || document.documentElement.getAttribute('data-live-transport') === 'up', { timeout: 15000 }).catch(() => {});
  await sleep(1200);
  const afterReload = await snap(c2.page);
  const reloadRevealed = afterReload !== after; // the reload showed a change the passive broadcast did NOT apply
  R(`  client-2 reload revealed a change the broadcast missed: ${reloadRevealed} (before==after:${before === after}, after==reload:${after === afterReload})`);
  await sleep(300); // let the pre-reload beacon POST + server append

  // (7) read the scratch server's capture
  const cap = readCapture();
  const mine = (cap || []).flatMap((c) => (c.events || []).map((e) => ({ ...e, _ver: c.version })));
  const frames = mine.filter((e) => e.k === 'frame');
  const renders = mine.filter((e) => e.k === 'render');
  const sockets = mine.filter((e) => e.k === 'socket');
  // NOTE: sanitizeRef lowercases + strips '-' inside the type segment → 'current-sprint:...' becomes 'currentsprint:...'.
  const csFrames = frames.filter((e) => /current-?sprint/.test(e.ref || ''));
  R(`  CAPTURE: file=${!!cap} totalEvents=${mine.length} frames=${frames.length} (cs=${csFrames.length}) renders=${renders.length} sockets=${sockets.length}`);
  if (frames.length) R(`  frames sample: ${JSON.stringify(frames.slice(0, 6).map((e) => ({ ref: e.ref, listeners: e.listeners, conn: e.conn })))}`);
  if (sockets.length) R(`  socket states: ${JSON.stringify(sockets.map((e) => e.state))}`);

  // ── DISCRIMINATE (centre on the CS singleton = the ref passive /trace actually subscribes to; the task ref is a by-design 0-sub red herring) ──
  const threw = renders.some((e) => e.threw === true);
  const anyFrame = frames.length > 0;
  const csGotFrame = csFrames.length > 0;
  const csLive = csFrames.some((e) => (e.listeners || 0) > 0);   // CS ref had live subscribers when notified
  const csDead = csGotFrame && csFrames.every((e) => (e.listeners || 0) === 0);
  if (act.status !== 200) { verdict = `BLOCKED: client-1 make-current returned HTTP ${act.status} (not 200) — could not drive the action; ${act.body.slice(0, 120)}`; exit = 1; }
  else if (threw) { verdict = `REPRODUCES → RE-RENDER EXCEPTION: a frame arrived and the re-render THREW. Root = an exception in the notify→render path.`; exit = 0; }
  else if (!reloadRevealed && (domChanged || csLive)) { verdict = `DOES-NOT-REPRODUCE (for me, WebKit@390): the CS ref got frames WITH live listeners (${csFrames.map((e)=>e.listeners).join('/')}) and a reload revealed NOTHING the broadcast missed (after==reload) → the passive live-MVC path FUNCTIONS on WebKit. Tron's "only-after-reload" symptom is iOS-Safari-SPECIFIC (major narrowing) OR needs a mutation with a real visible delta. NOTE: my seeded task is synthetic → 'no DOM change' is partly a fixture artifact; the STRONG signal is reload-revealed-nothing + live listeners + no throw.`; exit = 0; }
  else if (reloadRevealed && csDead) { verdict = `REPRODUCES → STALE/DEAD SUBSCRIPTION: reload revealed a change the broadcast missed, AND the CS ref frames had listenerCount==0 → no live subscriber received it. Reload re-subscribes → heals. THE lead hypothesis, captured.`; exit = 0; }
  else if (reloadRevealed && csLive) { verdict = `REPRODUCES → RENDER GAP: reload revealed a change the broadcast MISSED even though the CS ref had live listeners (${csFrames.map((e)=>e.listeners).join('/')}) and did not throw → notify fired to live subscribers but the DOM did not reflect it. A render-path gap, not a dead subscription.`; exit = 0; }
  else if (reloadRevealed && !csGotFrame) { verdict = `REPRODUCES → SUSPENDED/NO BROADCAST on the CS ref: reload revealed a change but NO current-sprint frame reached client-2 (frames on other refs=${frames.length}). The CS notify never arrived → socket/delivery gap for that channel. sockets=${JSON.stringify(sockets.map((e) => e.state))}.`; exit = 0; }
  else { verdict = `INCONCLUSIVE: reloadRevealed=${reloadRevealed} domChanged=${domChanged} csFrames=${csFrames.length} csLive=${csLive} file=${!!cap}. Raw=${JSON.stringify(mine.slice(0, 10))}`; exit = 1; }
} finally {
  await browser.close().catch(() => {});
  const td = await f.teardown();
  R(`teardown: prod:4444 up=${td.prodUp} leftoverScratch=${td.leftover}`);
}
R(`\n═══ VERDICT ═══\n${verdict}`);
process.exit(exit);
