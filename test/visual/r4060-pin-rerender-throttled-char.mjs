// Tron pin re-render — CHARACTERIZE the drawer-path 3.5s lag + THROTTLE to mobile conditions to see if it goes permanent.
// scratch @HEAD (0.8.136). Instruments: when does the pin's eager-lazy re-fetch (/api/trace/children/<CS>) FIRE vs RESOLVE
// relative to the Set-as-Current click? (fires-late = client delay/timer; resolves-late = network). Then re-run THROTTLED
// (+2s/request, slow-mobile) and watch to 15s: self-corrects-slower = the lag; never-corrects = a permanent-stale path.
import { setupFoundation } from './r4031-foundation.mjs';
import { webkit } from '@playwright/test';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const B = '9a70ce5e-7e88-45f9-b921-0f8e9caf07a6'; const B8 = B.slice(0, 8);
const CS = 'current-sprint-singleton-0000-000000000001';
const IOS = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, isMobile: false, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', ignoreHTTPSErrors: true };
const sleep = ms => new Promise(r => setTimeout(r, ms));

const f = await setupFoundation({ commit: 'HEAD', buildDist: true });
const oh = f.ownerHeaders();
console.log(`scratch@HEAD served=${f.servedVersion} sha=${f.worktreeSha}`);
const b = await webkit.launch({ headless: true });

async function runOnce(label, throttleMs) {
  const ctx = await b.newContext({ ...IOS, serviceWorkers: 'block' });
  await ctx.addInitScript(t => { try { localStorage.setItem('rawbin-player-id', t) } catch {} }, oh['x-player-token']);
  const sm = (oh['Cookie'] || '').match(/sm_session=([^;]+)/); if (sm) await ctx.addCookies([{ name: 'sm_session', value: sm[1], domain: 'localhost', path: '/' }]);
  const p = await ctx.newPage();
  if (throttleMs) await p.route('**/api/**', async r => { await sleep(throttleMs); r.continue(); }); // slow-mobile: latency on every API call
  const marks = { click: 0, refetchFire: 0, refetchDone: 0 };
  p.on('request', r => { if (r.url().includes(`/api/trace/children/${CS}`) && marks.click && !marks.refetchFire) marks.refetchFire = Date.now() - marks.click; });
  p.on('requestfinished', r => { if (r.url().includes(`/api/trace/children/${CS}`) && marks.click && !marks.refetchDone && marks.refetchFire) marks.refetchDone = Date.now() - marks.click; });

  await p.goto(`${f.base}/trace`, { waitUntil: 'networkidle', timeout: 40000 }).catch(() => {});
  await p.waitForFunction(() => (document.querySelector('rb-trace-tree')?.innerText || '').includes('Current'), { timeout: 20000 }).catch(() => {});
  await sleep(1200);
  await p.evaluate(() => { window.__nr = 'alive'; });
  const pinText = () => p.evaluate(() => { const m = (document.querySelector('rb-trace-tree')?.innerText || '').match(/📌 Current[^\n]*/); return m ? m[0].slice(0, 55) : null; });
  // open B detail + WAIT for the Set-as-Current button to actually render (robust to throttle), then click
  await p.evaluate((ref) => { const d = document.querySelector('rb-detail-drawer'); if (d) { d.setAttribute('open', ''); d.setAttribute('ref', ref); } }, `task:${B}`);
  await p.waitForFunction(() => [...document.querySelectorAll('button,[data-verb]')].some(e => /set as current/i.test(e.textContent || '') || e.getAttribute?.('data-verb') === 'set-current'), { timeout: throttleMs ? 30000 : 15000 }).catch(() => {});
  marks.click = Date.now();
  const clicked = await p.evaluate(() => { const x = [...document.querySelectorAll('button,[data-verb]')].find(e => /set as current/i.test(e.textContent || '') || e.getAttribute?.('data-verb') === 'set-current'); if (!x) return false; x.click(); return true; });

  const watch = throttleMs ? [2000, 4000, 6000, 9000, 13000, 18000, 25000] : [1000, 2000, 3000, 4000, 5000, 7000, 10000, 15000];
  let first = null, prev = 0;
  for (const t of watch) { await sleep(t - prev); prev = t; const pt = await pinText(); if (!first && pt && pt.includes('40.10')) first = t; }
  const noReload = await p.evaluate(() => window.__nr === 'alive');
  console.log(`[${label}] clicked=${clicked} | re-fetch FIRED@${marks.refetchFire || '—'}ms RESOLVED@${marks.refetchDone || '—'}ms | pin showed B @${first || 'NEVER'}ms | noReload=${noReload}`);
  await ctx.close();
  return { first, marks, clicked };
}

try {
  console.log('\n── PASS 1: fast (localhost) — characterize the base lag ──');
  const fast = await runOnce('fast', 0);
  console.log('\n── PASS 2: throttled +2s/API (slow-mobile) — does the lag go PERMANENT? ──');
  const slow = await runOnce('throttled', 2000);

  console.log('\n── FINDING ──');
  const fastSelfCorrects = fast.first !== null;
  const slowSelfCorrects = slow.first !== null;
  const lagIsClientSide = fast.marks.refetchFire >= 2000; // on localhost, a late FIRE = client delay/timer, not network
  console.log(`fast: pin@${fast.first || 'NEVER'}ms (re-fetch fired@${fast.marks.refetchFire}ms) — ${lagIsClientSide ? 'the lag is CLIENT-SIDE (re-fetch fires late even on localhost = a debounce/timer, not network)' : 'lag ≈ network/server'}`);
  console.log(`throttled: pin@${slow.first || 'NEVER'}ms — ${slowSelfCorrects ? 'still self-corrects (slower) = the LAG, worse on mobile' : 'NEVER self-corrected in 15s = a PERMANENT-STALE path on slow mobile'}`);
  if (fastSelfCorrects && slowSelfCorrects) console.log('VERDICT: the defect is a RE-RENDER LAG (self-corrects), amplified on mobile — NOT a permanent stale on this (drawer) path. A photo faster than the lag = Tron\'s screenshot. Fix = cut the lag (fire the pin re-fetch immediately on the local notify).');
  else if (!slowSelfCorrects) console.log('VERDICT: PERMANENT-STALE reproduced under slow-mobile — the pin never re-renders live within 15s; the eager-lazy re-fetch does not survive mobile latency. Tron\'s real defect.');
} finally { await b.close(); const td = await f.teardown(); console.log(`teardown prodUp=${td.prodUp} leftover=${td.leftover}`); }
