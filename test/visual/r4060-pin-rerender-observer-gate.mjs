// Tron live-MVC PIN RE-RENDER — TWO-CLIENT OBSERVER gate (PO-authorized). Covers the path the acting-tab gate can't:
// a page left OPEN while the current changes from ELSEWHERE must re-render its pin from the WS BROADCAST (not the local
// notify). SCRATCH @HEAD (0.8.136 specimen; HEAD==deploy), safe to fire make-current. NEVER touches prod.
// ORDER: client-1 opens /trace (pin shows A) → an EXTERNAL actor fires make-current(B) (server broadcasts) → watch
// client-1's pin slot up to 10s → assert it re-renders to B live. DISCRIMINATE lag-vs-never: if it never repaints live,
// reload client-1 → if reload shows B, the broadcast-render path is broken (RED, reload-heals). FAIL-CLOSED: pin not found ≠ pass.
import { setupFoundation } from './r4031-foundation.mjs';
import { webkit } from '@playwright/test';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const B = '9a70ce5e-7e88-45f9-b921-0f8e9caf07a6';  // Sprint-40 Task 40.10, declined to a band so the designation STICKS
const B8 = B.slice(0, 8);
const CS = 'current-sprint-singleton-0000-000000000001';
const IOS = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, isMobile: false, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', ignoreHTTPSErrors: true };
const sleep = ms => new Promise(r => setTimeout(r, ms));

const f = await setupFoundation({ commit: 'HEAD', buildDist: true });
const oh = f.ownerHeaders();
console.log(`scratch@HEAD served=${f.servedVersion} sha=${f.worktreeSha} owner=${f.ownerIsServerManager}`);
const serverCurrent = async () => { const r = await fetch(`${f.base}/api/trace/children/${CS}?mode=trace`).catch(() => null); if (!r) return null; const d = await r.json(); const ch = d.children || d; const c = (Array.isArray(ch) ? ch : []).find(x => x.role === 'current'); return c ? c.uuid : null; };

const b = await webkit.launch({ headless: true });
try {
  // make B stick, before opening client-1
  await fetch(`${f.base}/api/task/${B}/decline`, { method: 'POST', headers: oh }).catch(() => {});

  // client-1 = the OBSERVER page (left open). Seed owner token so it is a fully-authed client like Tron.
  const ctx1 = await b.newContext({ ...IOS, serviceWorkers: 'block' });
  await ctx1.addInitScript(t => { try { localStorage.setItem('rawbin-player-id', t) } catch {} }, oh['x-player-token']);
  const sm = (oh['Cookie'] || '').match(/sm_session=([^;]+)/); if (sm) await ctx1.addCookies([{ name: 'sm_session', value: sm[1], domain: 'localhost', path: '/' }]);
  const p1 = await ctx1.newPage();
  await p1.goto(`${f.base}/trace`, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await p1.waitForFunction(() => (document.querySelector('rb-trace-tree')?.innerText || '').includes('Current'), { timeout: 20000 }).catch(() => {});
  await sleep(1200);
  await p1.evaluate(() => { window.__nr = 'alive'; });
  const pinText = () => p1.evaluate(() => { const m = (document.querySelector('rb-trace-tree')?.innerText || '').match(/📌 Current[^\n]*/); return m ? m[0].slice(0, 70) : null; });
  const A_pin = await pinText();
  console.log(`(1) client-1 open, pin shows A: "${A_pin}" | server-current=${(await serverCurrent() || '?').slice(0, 8)}`);

  // (2) EXTERNAL actor fires make-current(B) → server broadcasts to all connected clients (incl client-1)
  const mc = await fetch(`${f.base}/api/task/${B}/make-current`, { method: 'POST', headers: oh }).then(r => r.status).catch(() => 0);
  console.log(`(2) external make-current(B) → ${mc}; server-current now = ${(await serverCurrent() || '?').slice(0, 8)} (expect ${B8})`);

  // (3) watch client-1's pin slot up to 10s (broadcast + eager-lazy re-fetch); no interaction on client-1
  const timeline = [];
  let prev = 0;
  for (const t of [500, 1500, 3500, 6000, 10000]) { await sleep(t - prev); prev = t; const pt = await pinText(); timeline.push({ t, pin: pt, showsB: !!(pt && pt.includes('40.10')) }); console.log(`  t+${t}ms: showsB=${timeline[timeline.length-1].showsB} pin="${pt}"`); }
  const noReload = await p1.evaluate(() => window.__nr === 'alive');
  const B_server = await serverCurrent();

  // ── VERDICT (fail-closed + lag-vs-never discriminator) ──
  const pinFound = timeline.every(x => x.pin !== null);
  const preconditionServerB = B_server === B;
  const reRenderedLive = timeline.some(x => x.showsB);
  console.log('\n── VERDICT (two-client observer, scratch 0.8.136) ──');
  if (!pinFound) { console.log('FAIL-CLOSED: pin slot not found during watch — NOT a pass.'); }
  else if (!preconditionServerB) { console.log(`PRECONDITION-FAIL: server-current is ${(B_server||'?').slice(0,8)}, not B — designation did not stick; not misattributing.`); }
  else if (reRenderedLive) {
    const firstAt = timeline.find(x => x.showsB).t;
    console.log(`GREEN: client-1's pin re-rendered to B from the broadcast, live (no reload), first at +${firstAt}ms. Broadcast→pin path works${firstAt >= 3000 ? ` (NOTE: ${firstAt}ms lag)` : ''}.`);
  } else {
    // never repainted live in 10s → discriminate: does a reload show B? (proves server right + broadcast-render broken)
    await p1.reload({ waitUntil: 'networkidle' }).catch(() => {});
    await p1.waitForFunction(() => (document.querySelector('rb-trace-tree')?.innerText || '').includes('Current'), { timeout: 20000 }).catch(() => {});
    await sleep(1200);
    const afterReload = await pinText();
    const reloadShowsB = !!(afterReload && afterReload.includes('40.10'));
    console.log(`  client-1 never repainted live in 10s (noReload=${noReload}); after RELOAD pin="${afterReload}" showsB=${reloadShowsB}`);
    console.log(reloadShowsB
      ? `RED (Tron's defect reproduced — OBSERVER path): client-1's pin stayed on A for 10s after an external make-current(B); only a RELOAD showed B. The WS broadcast → CurrentSprint pin re-fetch is broken for an open observer page.`
      : `INCONCLUSIVE: pin didn't update live AND reload didn't show B either — server/broadcast setup issue, re-check (not a clean observer RED).`);
  }
} finally { const td = await f.teardown(); console.log(`teardown prodUp=${td.prodUp} leftover=${td.leftover}`); }
