// Tron live-MVC PIN RE-RENDER defect — failable gate in TRON'S ORDER, on SCRATCH @HEAD (identical 0.8.136 client bundle;
// safe to fire make-current — prod pin untouched). The server is CORRECT after a make-current; the DEFECT is the pin slot
// does not re-render live (only a reload heals it — confirmed: a fresh served load renders the right pin).
// ORDER: (1) tree visible, pin shows task A; (2) client '📌 Set as Current' on task B, NO reload; (3) watch the pin slot
// 0.5/1.5/3.5/6s (transient-vs-permanent); (4) assert the PIN SLOT re-renders to B. Precondition: server-current must
// actually become B (else the designation didn't stick — reported, NOT misattributed to re-render).
// FAIL-CLOSED: pin slot / Set-as-Current button / B-detail not found ⇒ NEVER a pass. Expect RED on 0.8.136 pre-fix.
import { setupFoundation } from './r4031-foundation.mjs';
import { webkit } from '@playwright/test';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const B = '9a70ce5e-7e88-45f9-b921-0f8e9caf07a6';  // real Sprint-40 Task 40.10 (declined to a band so the designation STICKS — clean-QA auto-advances per #86-4)
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
  const ctx = await b.newContext({ ...IOS, serviceWorkers: 'block' });
  await ctx.addInitScript(t => { try { localStorage.setItem('rawbin-player-id', t) } catch {} }, oh['x-player-token']);
  const sm = (oh['Cookie'] || '').match(/sm_session=([^;]+)/); if (sm) await ctx.addCookies([{ name: 'sm_session', value: sm[1], domain: 'localhost', path: '/' }]);
  const p = await ctx.newPage();

  // make B a band so a Set-as-Current designation STICKS (server-side setup, before the page opens)
  await fetch(`${f.base}/api/task/${B}/decline`, { method: 'POST', headers: oh }).catch(() => {});

  // (1) tree visible, pin shows A
  await p.goto(`${f.base}/trace`, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await p.waitForFunction(() => (document.querySelector('rb-trace-tree')?.innerText || '').includes('Current'), { timeout: 20000 }).catch(() => {});
  await sleep(1200);
  await p.evaluate(() => { window.__nr = 'alive'; }); // wiped by any reload
  const pinText = () => p.evaluate(() => { const m = (document.querySelector('rb-trace-tree')?.innerText || '').match(/📌 Current[^\n]*/); return m ? m[0] : null; });
  const A_pin = await pinText();
  const A_server = await serverCurrent();
  console.log(`(1) pin shows A: "${A_pin}" | server-current A=${(A_server||'?').slice(0,8)}`);

  // (2) client '📌 Set as Current' on B — open B's detail, click the real action button (NO reload)
  await p.evaluate((ref) => { const d = document.querySelector('rb-detail-drawer'); if (d) { d.setAttribute('open', ''); d.setAttribute('ref', ref); } }, `task:${B}`);
  await sleep(1200);
  const clicked = await p.evaluate(() => {
    const btns = [...document.querySelectorAll('button, [role=button], .action-btn, [data-verb]')];
    const btn = btns.find(x => /set as current/i.test(x.textContent || '') || (x.getAttribute && x.getAttribute('data-verb') === 'set-current'));
    if (!btn) return false; btn.click(); return true;
  });
  console.log(`(2) '📌 Set as Current' on B clicked: ${clicked}`);

  // (3) watch the pin slot several seconds + (4) server-current
  const timeline = [];
  let prev = 0;
  for (const t of [500, 1500, 3500, 6000]) { await sleep(t - prev); prev = t; const pt = await pinText(); timeline.push({ t, pin: pt, showsB: !!(pt && pt.includes('40.10')) }); }
  const B_server = await serverCurrent();
  const noReload = await p.evaluate(() => window.__nr === 'alive');
  timeline.forEach(x => console.log(`  t+${x.t}ms: pin="${x.pin}" showsB=${x.showsB}`));
  console.log(`  server-current after = ${(B_server||'?').slice(0,8)} (expect B=${B8}) | noReload=${noReload}`);

  // ── VERDICT (fail-closed) ──
  const btnFound = clicked;
  const pinFound = timeline.every(x => x.pin !== null);
  const preconditionServerMovedToB = B_server === B;             // the action worked server-side (designation stuck)
  const pinReRenderedToB = timeline.some(x => x.showsB);          // the property under test
  console.log('\n── VERDICT (pin re-render, Tron order, scratch 0.8.136) ──');
  if (!btnFound) { console.log('FAIL-CLOSED: Set-as-Current button not found on B — cannot assert; NOT a pass.'); }
  else if (!pinFound) { console.log('FAIL-CLOSED: pin slot not found during watch — cannot read as a pass.'); }
  else if (!preconditionServerMovedToB) { console.log(`PRECONDITION-FAIL (not the re-render defect): server-current did NOT become B (=${(B_server||'?').slice(0,8)}) — designation did not stick; not misattributing to re-render.`); }
  else if (pinReRenderedToB && noReload) { console.log('GREEN: server moved to B AND the pin slot re-rendered to B live (no reload).'); }
  else { console.log(`RED (Tron's defect reproduced): server-current moved to B (${B8}) but the PIN SLOT did NOT re-render — it still shows "${timeline[timeline.length-1].pin}" after 6s, no reload. The eager-lazy pin never re-fetched after Set-as-Current.`); }
} finally { const td = await f.teardown(); console.log(`teardown prodUp=${td.prodUp} leftover=${td.leftover}`); }
