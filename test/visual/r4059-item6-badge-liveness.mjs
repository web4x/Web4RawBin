// Item (6) REGULAR-ROW BADGE LIVENESS falsifier — planner specimen Task 40.28 = 9f11a990 (honestly QA-Review, NOT the
// current/pin-slot, tree-visible under Sprint 40, chain-complete-to-Test). Interim emitting path (0.2/PO): approve it
// through the seam on scratch@HEAD → real status transition QA-Review→Done → observe the ROW badge @390 real-WebKit.
//
// ★ CORRECT READER (agent-trainer 2026-08-24): rb-object-item exposes status as an OBSERVED ATTRIBUTE, and refreshLive()
//   does setAttribute('status', <derived>) on a ws unit-changed (rb-object-item.ts:35,86) → the `status` ATTRIBUTE is the
//   live signal. The badge is a COLOUR SPAN `.oi-status.oi-status-<colour>` (green ✓ = done, purple 👁 = qa-review;
//   rb-object-item.ts:246) — it is NOT emoji innerText. The earlier reader read innerText for 🧪/🏁 glyphs that don't
//   exist here → blank/false reads. ★ RETRACTED: any earlier "NOT-GUARANTEED" line was a FALSE-READ of that broken
//   sampler, NOT evidence — it is not inherited as a finding. This run reads getAttribute('status') + the .oi-status class.
//
// ★ WATCH 0.5/1.5/3.5/6s (banked transient-lag lesson). live (→done by first read, no reload) ⇒ I-GUARANTEE regular-row
//   badge liveness + #3 alone explains Tron's dead board. LAGS (reaches done only after seconds) ⇒ SECOND GAP: a lag is
//   the drawer-re-render-latency family = dead-board + stale-button are ONE systemic defect. never-live (needs reload) ⇒
//   the notify/subscribe path is dead for regular rows. SCRATCH only (approve records approvedBy/At = Tron-gate data).
import { setupFoundation } from './r4031-foundation.mjs';
import { webkit } from '@playwright/test';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const TASK = '9f11a990-79bd-46e4-95e2-abe066f4b95b'; const T8 = TASK.slice(0, 8);
const IOS = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, isMobile: false, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', ignoreHTTPSErrors: true };
const sleep = ms => new Promise(r => setTimeout(r, ms));

const f = await setupFoundation({ commit: 'HEAD', buildDist: true }); const oh = f.ownerHeaders();
console.log(`scratch@HEAD served=${f.servedVersion} sha=${f.worktreeSha} · specimen Task40.28=${T8} (regular QA-Review row, NOT pin-slot)`);
const b = await webkit.launch({ headless: true });
try {
  const ctx = await b.newContext({ ...IOS, serviceWorkers: 'block' });
  await ctx.addInitScript(t => { try { localStorage.setItem('rawbin-player-id', t) } catch {} }, oh['x-player-token']);
  const sm = (oh['Cookie'] || '').match(/sm_session=([^;]+)/); if (sm) await ctx.addCookies([{ name: 'sm_session', value: sm[1], domain: 'localhost', path: '/' }]);
  const p = await ctx.newPage();
  await p.goto(`${f.base}/trace`, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await p.waitForFunction(() => !!customElements.get('rb-object-item'), { timeout: 20000 }).catch(() => {});
  await sleep(1000);

  // navigate to the row: expand nodes toward Sprint 40 until the specimen row renders (navigation confirmed working)
  const findRow = (uuid) => p.evaluate(u => { const r = [...document.querySelectorAll('rb-object-item')].find(x => (x.getAttribute('ref') || '').includes(u)); return r ? { ref: r.getAttribute('ref') } : null; }, uuid);
  for (let round = 0; round < 8; round++) {
    const row = await findRow(T8);
    if (row) { console.log(`row found (round ${round}): ref=${row.ref}`); break; }
    await p.evaluate(() => { for (const it of document.querySelectorAll('rb-object-item')) { const t = it.innerText || ''; if (/Sprints?\b|Sprint 40|Sprint40/i.test(t)) { const tog = it.querySelector('.expander,.toggle,[class*="expand"],[class*="chevron"],.oi-toggle') || it; try { tog.click(); } catch {} } } });
    await sleep(1200);
  }

  // ── CLEAN READER: status ATTRIBUTE (the live signal) + the .oi-status colour span (NOT emoji innerText) ──
  const readRow = (u) => p.evaluate((uu) => {
    const r = [...document.querySelectorAll('rb-object-item')].find(x => (x.getAttribute('ref') || '').includes(uu));
    if (!r) return { found: false };
    const badge = r.querySelector('.oi-status');
    const cls = (badge && (badge.className.baseVal || badge.className)) || '';
    const colour = (String(cls).match(/oi-status-(\w+)/) || [])[1] || '';
    return { found: true, status: (r.getAttribute('status') || ''), badgeColour: colour, badgeSym: (badge?.textContent || '').trim(), noReload: window.__nr === 'alive' };
  }, u).catch(() => ({ found: false }));

  // one-time INSPECT of the found row (evidence the reader targets the right element)
  const inspect = await p.evaluate((u) => {
    const r = [...document.querySelectorAll('rb-object-item')].find(x => (x.getAttribute('ref') || '').includes(u)); if (!r) return { none: true };
    const badge = r.querySelector('.oi-status');
    return { statusAttr: r.getAttribute('status'), badgeClass: badge ? (badge.className.baseVal || badge.className) : '(no .oi-status)', badgeText: (badge?.textContent || '').trim(), outer: r.outerHTML.slice(0, 320) };
  }, T8);
  console.log('ROW INSPECT:', JSON.stringify(inspect));

  await p.evaluate(() => { window.__nr = 'alive'; });
  const before = await readRow(T8);
  console.log(`BEFORE approve: found=${before.found} status="${before.status}" badge=${before.badgeColour}/${before.badgeSym} (expect QA-Review → purple 👁)`);

  if (!before.found) {
    console.log('SETUP-INCOMPLETE: specimen row not rendered after expand — visible rows for adaptation:');
    console.log(await p.evaluate(() => [...document.querySelectorAll('rb-object-item')].slice(0, 25).map(x => ((x.innerText || '').split('\n')[0] || '').slice(0, 42))));
    console.log('\nVERDICT: SETUP-INCOMPLETE (no verdict — row not reached). NOT a liveness finding.');
  } else {
    const ap = await fetch(`${f.base}/api/task/${TASK}/approve`, { method: 'POST', headers: oh });
    console.log(`approve POST → ${ap.status} (QA-Review→Done through the seam; scratch-only, records approvedBy/At)`);
    const timeline = [];
    let prev = 0;
    for (const t of [500, 1500, 3500, 6000]) { await sleep(t - prev); prev = t; const r = await readRow(T8); timeline.push({ t, ...r }); console.log(`  t+${t}ms: status="${r.status}" badge=${r.badgeColour}/${r.badgeSym} noReload=${r.noReload}`); }

    const isDone = (r) => /done|pass|gate-proven|resolved/i.test(r.status) || r.badgeColour === 'green';
    const firstDoneIdx = timeline.findIndex(isDone);
    const fin = timeline[timeline.length - 1];
    const liveImmediate = firstDoneIdx === 0 && fin.noReload;         // green by the 500ms read = live
    const lagged = firstDoneIdx > 0 && fin.noReload;                  // eventually green (seconds) = transient re-render lag
    const neverLive = firstDoneIdx === -1;                            // never reached done without reload
    console.log(`\n⇒ regular-row badge: firstDone@${firstDoneIdx < 0 ? 'never' : timeline[firstDoneIdx].t + 'ms'} noReload=${fin.noReload}`);
    if (liveImmediate) console.log('VERDICT: LIVE — regular-row badge reaches Done (green ✓) live, no reload ⇒ I-GUARANTEE regular-row badge liveness; #3 alone explains Tron\'s dead board.');
    else if (lagged) console.log(`VERDICT: LAGGED — badge reached Done only at +${timeline[firstDoneIdx].t}ms (transient re-render lag, no reload) ⇒ SECOND GAP: same family as the bar/drawer re-render latency = dead-board + stale-button are ONE systemic defect.`);
    else if (neverLive) console.log('VERDICT: NOT-LIVE — badge never reached Done without a reload ⇒ the notify/subscribe path is dead for regular rows (strongest form of the dead-board defect).');
  }
} finally { const td = await f.teardown(); console.log(`teardown prodUp=${td.prodUp} leftover=${td.leftover}`); }
