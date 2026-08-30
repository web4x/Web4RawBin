// CLOSING CAPTURE RUN (PO #1, Tron's diagnosis) — the DELTA-FORCING sibling of r4064.
// r4064 proved the MECHANISM (broadcast reaches passive client-2, CS ref has live listeners, no throw) but its
// mutation was a SYNTHETIC orphan whose make-current landed in the SAME derived-current sprint → before==after was a
// DATA no-op, not a render-gap (reported null — PO "right call"). This run supplies the GUARANTEED VISIBLE DELTA the
// recipe calls for: make-current a REAL Planned task in a sprint OTHER than the one shown as "CurrentSprint: Sprint N".
// That re-derives current (max lastAdvancedAt flips to the new sprint) → the CS pin label + 3 eager slot children MUST
// change. Then discriminate on PASSIVE client-2:
//   passive client-2 shows the NEW sprint from the broadcast ALONE      → live-MVC WORKS on WebKit ⇒ Tron's symptom is iOS-Safari-SPECIFIC (major narrowing)
//   passive shows OLD, reload shows NEW (desktop/WebKit here)           → RENDER-GAP CONFIRMED (general, not iOS) — fixable + gatable WITHOUT Tron
// Cross-referenced with the scratch server's live-mvc diag capture (frames/listeners/throw on the CS singleton ref) to
// name WHICH gap. SANITY: the pin must read OLD pre-mutation and NEW post-reload, else the fixture didn't force a real
// delta and the result is null (not a diagnosis). Scratch-only (server:4643); teardown asserts prod:4444 untouched.
import { webkit } from '@playwright/test';
import { setupFoundation } from './r4031-foundation.mjs';
import fs from 'node:fs';
import path from 'node:path';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const IPHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' };
const R = (v) => console.log(v);
const sprintNumOf = (txt) => { const m = /Sprint\s+(\d+)/.exec(txt || ''); return m ? Number(m[1]) : null; };

const f = await setupFoundation();
const scratchDir = fs.readdirSync('/tmp').filter((d) => d.startsWith(`r4031-scratch-${process.pid}-`)).map((d) => path.join('/tmp', d))[0] || null;
const smSession = (/sm_session=([^;]+)/.exec(f.ownerHeaders().Cookie || '') || [])[1] || '';
const OWNER = fs.readFileSync('/root/.rawbin/owner-token', 'utf8').trim(); // browser identity seed — NEVER printed

R(`scratch up: ${f.base} v${f.servedVersion} sha=${f.worktreeSha} | ownerSession=${!!smSession} | scratchDir=${scratchDir}`);
const readCapture = () => {
  if (!scratchDir) return null;
  const d = new Date();
  const name = `rawbin-live-mvc-diag-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}.log`;
  try { return fs.readFileSync(path.join(scratchDir, 'data/logs', name), 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)); } catch { return null; }
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
    await page.waitForFunction(() => {
      const c = window.__rawbinClient; return (c && c.connected === true) || document.documentElement.getAttribute('data-live-transport') === 'up';
    }, { timeout: 20000 }).catch(() => {});
    // wait for the CurrentSprint pin to actually render (label present) before we treat its text as ground truth
    await page.waitForFunction(() => /CurrentSprint:\s*Sprint\s+\d+/.test((document.querySelector('rb-trace-tree')?.textContent) || ''), { timeout: 20000 }).catch(() => {});
    await sleep(600);
    const conn = await page.evaluate(() => (window.__rawbinClient && window.__rawbinClient.connected) === true);
    R(`  ${label}: connected=${conn}`);
    return { ctx, page };
  };

  const c1 = await mkClient('client-1 (actor)', false);
  const c2 = await mkClient('client-2 (PASSIVE, armed)', true);

  // the CurrentSprint pin region as PASSIVE client-2 renders it (label + 3 eager slot children)
  const snap = (page) => page.evaluate(() => {
    const el = document.querySelector('rb-trace-tree') || document.body;
    return (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 500);
  });
  const before = await snap(c2.page);
  const beforeNum = sprintNumOf(before);
  R(`  client-2 BEFORE: CurrentSprint=Sprint ${beforeNum} | region="${before.slice(0, 90)}"`);

  // ── DISCOVER a REAL Planned task in a sprint OTHER than the current one (guaranteed-delta target) ──
  const pick = await c1.page.evaluate(async (curNum) => {
    const sprints = await (await fetch('/api/trace/sprints')).json();
    // prefer a well-populated, clearly-different sprint; iterate all non-current sprints for the first Planned task
    for (const s of sprints.filter((s) => s.number !== curNum && s.hasChildren)) {
      const kids = await (await fetch(`/api/trace/children/${s.uuid}`)).json();
      const planned = (kids.children || []).find((c) => c.type === 'Task' && c.status === 'Planned');
      if (planned) return { taskUuid: planned.uuid, taskName: planned.name, sprintNum: s.number, sprintName: s.name };
    }
    return null;
  }, beforeNum);
  if (!pick) { verdict = `NULL/FIXTURE: no Planned task found in any non-current sprint (current=Sprint ${beforeNum}) → cannot force a delta. Not a diagnosis.`; throw new Error('no-candidate'); }
  R(`  target: task ${pick.taskUuid.slice(0, 8)} "${pick.taskName.slice(0, 50)}" in Sprint ${pick.sprintNum} (current is Sprint ${beforeNum})`);

  // ── client-1 performs the owner make-current on the DIFFERENT-sprint task → current MUST re-derive to pick.sprintNum ──
  const act = await c1.page.evaluate(async ({ t, tok }) => {
    const r = await fetch(`/api/task/${t}/make-current`, { method: 'POST', headers: { 'x-player-token': tok } });
    return { status: r.status, body: await r.text().catch(() => '') };
  }, { t: pick.taskUuid, tok: OWNER });
  R(`  client-1 make-current(${pick.taskUuid.slice(0, 8)}) → HTTP ${act.status}`);

  // observe PASSIVE client-2 from the broadcast ALONE (no click, no reload)
  await sleep(4000);
  const after = await snap(c2.page);
  const afterNum = sprintNumOf(after);
  const broadcastFlipped = afterNum === pick.sprintNum && afterNum !== beforeNum;
  R(`  client-2 AFTER broadcast alone: CurrentSprint=Sprint ${afterNum} (flipped to target=${broadcastFlipped})`);

  // reload client-2 = the sendBeacon trigger AND the discriminator: the reload re-fetches from the server
  await c2.page.evaluate(() => { try { document.dispatchEvent(new Event('visibilitychange')); } catch {} });
  await c2.page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
  await c2.page.waitForFunction(() => /CurrentSprint:\s*Sprint\s+\d+/.test((document.querySelector('rb-trace-tree')?.textContent) || ''), { timeout: 15000 }).catch(() => {});
  await sleep(1200);
  const afterReload = await snap(c2.page);
  const reloadNum = sprintNumOf(afterReload);
  const reloadFlipped = reloadNum === pick.sprintNum && reloadNum !== beforeNum;
  R(`  client-2 AFTER reload: CurrentSprint=Sprint ${reloadNum} (shows target=${reloadFlipped})`);
  await sleep(300); // let the pre-reload beacon POST + server append land

  // ── read the scratch server's live-mvc capture, centred on the CS singleton ref (what passive /trace subscribes to) ──
  const cap = readCapture();
  const mine = (cap || []).flatMap((c) => (c.events || []).map((e) => ({ ...e, _ver: c.version })));
  const frames = mine.filter((e) => e.k === 'frame');
  const renders = mine.filter((e) => e.k === 'render');
  const sockets = mine.filter((e) => e.k === 'socket');
  const csFrames = frames.filter((e) => /current-?sprint/.test(e.ref || '')); // sanitizeRef strips '-' → 'currentsprint:...'
  const threw = renders.some((e) => e.threw === true);
  const csLive = csFrames.some((e) => (e.listeners || 0) > 0);
  const csDead = csFrames.length > 0 && csFrames.every((e) => (e.listeners || 0) === 0);
  R(`  CAPTURE: file=${!!cap} events=${mine.length} frames=${frames.length} (cs=${csFrames.length}) csLive=${csLive} csDead=${csDead} threw=${threw}`);
  if (csFrames.length) R(`  cs frames: ${JSON.stringify(csFrames.slice(0, 6).map((e) => ({ ref: (e.ref || '').slice(0, 28), listeners: e.listeners })))}`);
  if (sockets.length) R(`  sockets: ${JSON.stringify(sockets.map((e) => e.state))}`);

  // ── DISCRIMINATE ──
  if (act.status !== 200) verdict = `BLOCKED: make-current returned HTTP ${act.status} (not 200) — could not drive the action; ${act.body.slice(0, 120)}`;
  else if (!reloadFlipped) verdict = `NULL/FIXTURE-DID-NOT-FORCE-A-DELTA: after a make-current on a Sprint ${pick.sprintNum} task, even a full RELOAD of client-2 still shows CurrentSprint=Sprint ${reloadNum} (expected ${pick.sprintNum}). The server did NOT re-derive current → this fixture proves nothing about the render path (before=${beforeNum}/after=${afterNum}/reload=${reloadNum}). Report as null, investigate the make-current→re-derive server step separately.`;
  else if (broadcastFlipped) { verdict = `DOES-NOT-REPRODUCE (WebKit@390): PASSIVE client-2 flipped CurrentSprint ${beforeNum}→${pick.sprintNum} from the BROADCAST ALONE (no reload), reload confirms same. The live-MVC pin path FUNCTIONS end-to-end on WebKit with a REAL visible delta (csLive=${csLive}, threw=${threw}). ⇒ Tron's "updates only after reload" is iOS-Safari-SPECIFIC — a major narrowing. Fix/gate must target iOS Safari (real device or iOS-WebKit quirk), not the general render path.`; exit = 0; }
  else if (threw) { verdict = `REPRODUCES → RE-RENDER EXCEPTION: reload shows the new sprint (${reloadNum}) but the passive broadcast did NOT (stayed ${afterNum}) AND a render threw. Root = an exception in the notify→renderCurrentSprintEagerLazy path. Expert: catch/inspect the throw.`; exit = 0; }
  else if (csDead) { verdict = `REPRODUCES → STALE/DEAD SUBSCRIPTION: reload reveals Sprint ${reloadNum}, the passive broadcast missed it (stayed ${afterNum}), and the CS singleton frames had listenerCount==0 → no live subscriber received the notify. Reload re-subscribes → heals. Fix = keep the CS subscription live across the pin re-render.`; exit = 0; }
  else if (csLive) { verdict = `REPRODUCES → RENDER GAP (general, not iOS): reload reveals Sprint ${reloadNum}, the passive broadcast MISSED it (stayed ${afterNum}) even though the CS singleton ref had LIVE listeners (${csFrames.map((e) => e.listeners).join('/')}) and nothing threw → notify fired to a live subscriber but the DOM did not reflect the flip. A render-path gap in renderCurrentSprintEagerLazy — fixable + gatable WITHOUT Tron. Expert: the re-fetch/re-render on the CS notify isn't repainting the pin.`; exit = 0; }
  else if (csFrames.length === 0) { verdict = `REPRODUCES → NO CS BROADCAST reached client-2: reload reveals Sprint ${reloadNum} but NO current-sprint frame arrived at the passive client (other-ref frames=${frames.length}). The CS notify never crossed the socket → delivery/socket gap on that channel. sockets=${JSON.stringify(sockets.map((e) => e.state))}.`; exit = 0; }
  else verdict = `INCONCLUSIVE: broadcastFlipped=${broadcastFlipped} reloadFlipped=${reloadFlipped} csFrames=${csFrames.length} csLive=${csLive} file=${!!cap} before/after/reload=${beforeNum}/${afterNum}/${reloadNum}. Raw=${JSON.stringify(mine.slice(0, 8))}`;
} catch (e) {
  if (!/no-candidate/.test(String(e && e.message))) verdict = `ERROR: ${String(e && e.message).slice(0, 200)}`;
} finally {
  await browser.close().catch(() => {});
  const td = await f.teardown();
  R(`teardown: prod:4444 up=${td.prodUp} leftoverScratch=${td.leftover}`);
}
R(`\n═══ CLOSING-RUN VERDICT ═══\n${verdict}`);
process.exit(exit);
