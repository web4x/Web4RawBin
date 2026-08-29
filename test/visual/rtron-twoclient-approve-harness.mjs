// TRON TWO-CLIENT APPROVE→OBSERVER gate — asserts the TREE ROW (the board Tron watches), the REAL broadcast path, no mock.
// ★ RETARGET (PO 2026-08-29): originally a MOCKED false-green (route.fulfill fake flip + direct t.render()). A first
//   retarget observed the DETAIL DRAWER and GREENed — but that was the 5th weaker-property substitution: the DETAIL
//   subscribes per-task ref (known to update live), while rb-trace-tree subscribes ONLY to the CurrentSprint pin ref +
//   the structural 'graph' channel and NOT to per-task refs (planner-measured). So a detail-GREEN says nothing about the
//   BOARD. This gate asserts the TREE ROW's status badge — the surface where Tron's dead board actually lives.
//   client-1 does a REAL owner approve on scratch; PASSIVE client-2 must see the task's TREE ROW badge flip QA-Review→Done
//   from the SERVER BROADCAST ALONE — no reload, no mock, no direct render call. Transition-checked + precondition(server
//   reached Done) + fail-closed(row not found ≠ pass) + unscoreable-excluded. EXPECTED RED (tree row does not subscribe
//   per-task) = the board-liveness defect finally getting a gate on Tron's surface. Reader = rb-object-item getAttribute('status').
import { setupFoundation } from './r4031-foundation.mjs';
import { webkit } from '@playwright/test';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const TASK = '9f11a990-79bd-46e4-95e2-abe066f4b95b'; // real Sprint-40 Task 40.28 (renders as a tree row; full evidence attached → approve reaches Done)
const T8 = TASK.slice(0, 8);
const IOS = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, isMobile: false, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', ignoreHTTPSErrors: true };
const sleep = ms => new Promise(r => setTimeout(r, ms));

const f = await setupFoundation({ commit: 'HEAD', buildDist: true, attachEvidenceTo: TASK });
const oh = f.ownerHeaders();
console.log(`two-client approve→TREE-ROW observer, scratch@HEAD ${f.servedVersion}, task ${T8} (real Sprint-40 QA-Review row)`);
const statusOf = async (u) => { const r = await fetch(`${f.base}/api/ior/ior:instance:${u}`).catch(() => null); if (!r) return '?'; const d = await r.json(); return d?.unit?.model?.status ?? '?'; };
const b = await webkit.launch({ headless: true });
try {
  const c2 = await b.newContext({ ...IOS, serviceWorkers: 'block' });
  await c2.addInitScript(t => { try { localStorage.setItem('rawbin-player-id', t) } catch {} }, oh['x-player-token']);
  const sm = (oh['Cookie'] || '').match(/sm_session=([^;]+)/); if (sm) await c2.addCookies([{ name: 'sm_session', value: sm[1], domain: 'localhost', path: '/' }]);
  const p2 = await c2.newPage();
  await p2.goto(`${f.base}/trace`, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await p2.waitForFunction(() => !!customElements.get('rb-object-item'), { timeout: 20000 }).catch(() => {});
  await sleep(1000);
  // navigate client-2's tree to the task's ROW (expand toward Sprint 40)
  const rowStatus = () => p2.evaluate(u => { const r = [...document.querySelectorAll('rb-object-item')].find(x => (x.getAttribute('ref') || '') === `task:${u}`); return r ? r.getAttribute('status') : null; }, TASK);
  for (let round = 0; round < 12; round++) { if (await rowStatus() !== null) break; await p2.evaluate(() => { for (const it of document.querySelectorAll('rb-object-item')) { const t = it.innerText || ''; if (/Sprints?\b|Sprint 40|Sprint 4/i.test(t)) { const tog = it.querySelector('.oi-expand,.expander,[class*="expand"],[class*="chevron"]') || it; try { tog.click(); } catch {} } } }); await sleep(1000); }
  const before = await rowStatus();
  await p2.evaluate(() => { window.__nr = 'alive'; });
  console.log(`client-2 TREE ROW status BEFORE approve: "${before}"`);

  const c1 = await b.newContext({ ...IOS, serviceWorkers: 'block' }); const p1 = await c1.newPage(); await p1.goto(`${f.base}/trace`, { waitUntil: 'domcontentloaded' }).catch(() => {});
  const ap = await fetch(`${f.base}/api/task/${TASK}/approve`, { method: 'POST', headers: oh }).then(r => r.status).catch(() => 0);
  const svr = await statusOf(TASK);
  console.log(`client-1 approve → ${ap}; server status now "${svr}"`);

  let flippedAt = null; const t0 = Date.now();
  while (Date.now() - t0 <= 8000) { const s = await rowStatus(); if (s && /done/i.test(String(s))) { flippedAt = Date.now() - t0; break; } await sleep(250); }
  const noReload = await p2.evaluate(() => window.__nr === 'alive');
  const after = await rowStatus();

  const precondition = ap === 200 && /done/i.test(String(svr));
  const transition = before !== null && !/done/i.test(String(before));
  const found = before !== null;
  console.log(`client-2 TREE ROW status AFTER: "${after}" | flipped-to-Done @${flippedAt !== null ? flippedAt + 'ms' : 'NEVER within 8s'} | noReload=${noReload}`);
  console.log('\n── VERDICT (two-client approve→TREE-ROW observer, scratch) ──');
  if (!found) console.log('FAIL-CLOSED: task tree row not located after expansion — cannot score (adapt navigation).');
  else if (!precondition) console.log(`UNSCOREABLE (excluded): approve did not reach Done server-side (${ap}/${svr}).`);
  else if (!transition) console.log('UNSCOREABLE (excluded): row was already Done before approve.');
  else if (flippedAt !== null && noReload) console.log(`GREEN: client-2's TREE ROW badge flipped QA-Review→Done from the broadcast alone @${flippedAt}ms, no reload — the board updates live (unexpected per planner's per-task-no-subscribe measurement; a finding worth understanding).`);
  else console.log(`RED (board-liveness defect, on Tron's surface): approve reached Done server-side, but client-2's TREE ROW stayed "${after}" for 8s, no reload — rb-trace-tree does NOT re-render the task row from the broadcast (subscribes pin-ref + structural graph, not per-task). The DETAIL surface updates; the BOARD does not.`);
} finally { await b.close(); const td = await f.teardown(); console.log(`teardown prodUp=${td.prodUp} leftover=${td.leftover}`); }
