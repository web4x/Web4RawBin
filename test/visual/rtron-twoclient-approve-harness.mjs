// TRON TWO-CLIENT APPROVE→OBSERVER gate — the REAL broadcast→receive→render path, no mock.
// ★ RETARGET (PO 2026-08-29): this was a MOCKED FALSE-GREEN (the mock-blindness class audit's 1 blind gate) — it
//   route.fulfill'd /api/trace/children with a fake Done flip AND called t.render() DIRECTLY, standing in for the exact
//   ViewBus.subscribe('graph')→render receive path it claimed to prove. It greened even if that path were fully broken.
//   This is TRON'S defect class (approve on one tab → the OTHER tab's view must update live), so a blind gate here was
//   blind exactly where it mattered. NOW: client-1 does a REAL owner approve on scratch (owner-auth headless-provable via
//   r4031-foundation); PASSIVE client-2 must re-render from the SERVER BROADCAST ALONE — no reload, no direct render call,
//   no route mock. Transition-checked (QA-Review → Done, a real change) + precondition (server actually reached Done) +
//   fail-closed (detail not found ≠ pass) + unscoreable runs EXCLUDED, not counted. RED if client-2 stays stale; GREEN
//   only when the real WS→ViewBus→render receive path delivers. Mechanism: approveByOwner(server.ts) → publishUnitChanged
//   → RawBinClient 'unit-changed' → ViewBus.notify → the observer view re-derives.
import { setupFoundation } from './r4031-foundation.mjs';
import { webkit } from '@playwright/test';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const IOS = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, isMobile: false, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', ignoreHTTPSErrors: true };
const sleep = ms => new Promise(r => setTimeout(r, ms));

const f = await setupFoundation({ commit: 'HEAD', buildDist: true });
const oh = f.ownerHeaders();
const QA = f.seeded.qaReview;   // full-evidence QA-Review task → approveByOwner genuinely reaches Done + fires the broadcast
console.log(`two-client approve→observer, scratch@HEAD ${f.servedVersion}, task ${QA.slice(0, 8)} (QA-Review, full evidence)`);
const statusOf = async (u) => { const r = await fetch(`${f.base}/api/ior/ior:instance:${u}`).catch(() => null); if (!r) return '?'; const d = await r.json(); return d?.unit?.model?.status ?? '?'; };

const b = await webkit.launch({ headless: true });
try {
  const mk = async () => { const c = await b.newContext({ ...IOS, serviceWorkers: 'block' }); await c.addInitScript(t => { try { localStorage.setItem('rawbin-player-id', t) } catch {} }, oh['x-player-token']); const sm = (oh['Cookie'] || '').match(/sm_session=([^;]+)/); if (sm) await c.addCookies([{ name: 'sm_session', value: sm[1], domain: 'localhost', path: '/' }]); return c; };
  // client-2 = PASSIVE observer: open the task detail (QA-Review), then never touch it again
  const c2 = await mk(); const p2 = await c2.newPage();
  await p2.goto(`${f.base}/trace`, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await p2.waitForFunction(() => !!customElements.get('rb-detail-drawer'), { timeout: 20000 }).catch(() => {});
  await p2.evaluate((ref) => { const d = document.querySelector('rb-detail-drawer'); if (d) { d.setAttribute('open', ''); d.setAttribute('ref', ref); } }, `task:${QA}`);
  await sleep(1500);
  await p2.evaluate(() => { window.__nr = 'alive'; });
  const detailStatus = () => p2.evaluate(() => { const d = document.querySelector('rb-detail-drawer'); const panel = d?.querySelector('.drawer-panel-detail') || d; for (const el of (panel?.querySelectorAll('.sv-field,.dv-field,[class*=field],li,tr,div') || [])) { const m = (el.textContent || '').trim().match(/^Status[:\s]+(.+)$/i); if (m) return m[1].trim().slice(0, 30); } return null; });
  const before = await detailStatus();
  console.log(`client-2 observer detail status BEFORE: "${before}"`);

  // client-1 = actor: REAL owner approve (its own page action would also work; a fetch is the same server broadcast trigger)
  const c1 = await mk(); const p1 = await c1.newPage(); await p1.goto(`${f.base}/trace`, { waitUntil: 'domcontentloaded' }).catch(() => {});
  const ap = await fetch(`${f.base}/api/task/${QA}/approve`, { method: 'POST', headers: oh }).then(r => r.status).catch(() => 0);
  const svr = await statusOf(QA);
  console.log(`client-1 approve → ${ap}; server status now "${svr}"`);

  // client-2 must re-render to Done from the BROADCAST alone
  let flippedAt = null; const t0 = Date.now();
  while (Date.now() - t0 <= 8000) { const s = await detailStatus(); if (s && /done/i.test(s)) { flippedAt = Date.now() - t0; break; } await sleep(250); }
  const noReload = await p2.evaluate(() => window.__nr === 'alive');
  const after = await detailStatus();

  const precondition = ap === 200 && /done/i.test(String(svr));           // the approve genuinely reached Done server-side
  const transition = before !== null && !/done/i.test(String(before));    // observer was NOT already Done → a real change is required
  const found = before !== null && after !== null;
  console.log(`client-2 observer detail status AFTER: "${after}" | flipped-to-Done @${flippedAt !== null ? flippedAt + 'ms' : 'NEVER within 8s'} | noReload=${noReload}`);
  console.log('\n── VERDICT (two-client approve→observer, scratch) ──');
  if (!found) console.log('FAIL-CLOSED: observer detail not found — cannot score as a pass.');
  else if (!precondition) console.log(`UNSCOREABLE (excluded): approve did not reach Done server-side (status=${ap}/${svr}) — not misattributing to the receive path.`);
  else if (!transition) console.log('UNSCOREABLE (excluded): observer was already Done before approve — no transition to observe.');
  else if (flippedAt !== null && noReload) console.log(`GREEN: client-2 re-rendered QA-Review→Done from the broadcast alone @${flippedAt}ms, no reload — the real WS→ViewBus→render receive path delivers.`);
  else console.log(`RED (Tron's defect class): client-1 approve reached Done server-side, but PASSIVE client-2's view stayed "${after}" for 8s with no reload — the broadcast→receive→render path did NOT update the observer.`);
} finally { await b.close(); const td = await f.teardown(); console.log(`teardown prodUp=${td.prodUp} leftover=${td.leftover}`); }
