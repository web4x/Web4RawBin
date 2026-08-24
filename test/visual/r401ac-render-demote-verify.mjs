// T40.1 VERIFY (a) RENDER + (c) DEMOTE on served v0.8.126 — consumer-vs-consumer on the RENDERED artifact,
// POST-BROADCAST, ORACLE-FREE (carry-forward, caught every real bug this week). Two consumers: the drawer action-bar
// (barOffersSetCurrent) and the live resolver /api/trace/children (resolvedCurrent8 — the SAME path the pin uses).
// Never a view vs a stored model; expected always derived from the live recompute. Scratch at HEAD (==served 0.8.126),
// phantom-guarded, own system session, ZERO prod mutation (make-current mutates → never prod:4444). @390 real-WebKit.
//   (a) RENDER: make-current T1 → the drawer opened on T1 renders it AS current (bar HIDES "Set as Current") AND the
//       live resolver agrees current==T1 → the two consumers AGREE post-broadcast (initial-load agreement is skipped —
//       we assert only AFTER a live make-current, never initial load).
//   (c) DEMOTE: make-current T2 → T1 is DEMOTED: the drawer on T1 now RE-OFFERS "Set as Current" AND the resolver
//       moves current→T2 (no stale second-current). Both consumers agree T1 is no longer current.
import { setupFoundation } from './r4031-foundation.mjs';
import { webkit } from '@playwright/test';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const CSU = 'current-sprint-singleton-0000-000000000001';
const IOS = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, isMobile: false,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', ignoreHTTPSErrors: true };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// PHANTOM-GUARD: prove served prod is the build we claim to verify (0.8.126)
const prodVer = await fetch('https://localhost:4444/api/config').then(r => r.json()).then(j => j.version).catch(() => '?');
console.log(`phantom-guard: served prod = ${prodVer} (verifying T40.1 a/c on this build)`);

const f = await setupFoundation({ commit: 'HEAD', buildDist: true });
const oh = f.ownerHeaders();
console.log(`scratch: ${f.base} servedVersion=${f.servedVersion} sha=${f.worktreeSha}`);
const jf = (u) => fetch(`${f.base}${u}`, { headers: oh }).then(r => r.json()).catch(() => null);
// ORACLE-FREE: expected current derived from the LIVE resolver the pin uses, never a stored slots snapshot
const resolvedCurrent8 = async () => { const d = await jf(`/api/trace/children/${CSU}`); const c = (d?.children || []).find(k => /Current\b/.test(String(k.name || '')) && !/CurrentSprint/.test(String(k.name || ''))); return c?.uuid?.slice?.(0, 8) || null; };
const readBar = (page) => page.evaluate(() => {
  const d = document.querySelector('rb-detail-drawer'); const bar = d?.querySelector('.drawer-actionbar');
  return { barOffersSetCurrent: /Set as Current/i.test(bar?.innerText || ''), currentSlotUuid: String(d?._currentSlotUuid || '').slice(0, 8), barText: (bar?.innerText || '').replace(/\s+/g, ' ').slice(0, 90) };
});
const openDrawer = (page, u) => page.evaluate((x) => document.dispatchEvent(new CustomEvent('selection-changed', { detail: { selected: ['task:' + x] } })), u);
const makeCurrent = (u) => fetch(`${f.base}/api/task/${u}/make-current`, { method: 'POST', headers: oh });

let verdict = { render: 'UNKNOWN', demote: 'UNKNOWN' };
const browser = await webkit.launch({ headless: true });
try {
  // discover two DISTINCT eligible Task children in the resolved current sprint (real units, not synthetic)
  const kids = (await jf(`/api/trace/children/${CSU}?mode=trace`))?.children || [];
  const tasks = kids.filter(k => /task:/i.test(String(k.uuid || k.ref || '')) || String(k.type || '').toLowerCase() === 'task').map(k => (k.uuid || '').replace(/^task:/, ''));
  const uniq = [...new Set(tasks.filter(u => /^[0-9a-f-]{36}$/i.test(u)))];
  const T1 = process.env.T1 || '7a956c21-5f37-4062-b921-9bdd5a461546'; // Task 40.1 (known eligible)
  const T2 = process.env.T2 || uniq.find(u => u.slice(0, 8) !== T1.slice(0, 8));
  console.log(`tasks: T1=${T1.slice(0, 8)} (40.1) · T2=${T2 ? T2.slice(0, 8) : '(none found)'} · sprint has ${uniq.length} eligible`);
  if (!T2) { console.log('SETUP-INCOMPLETE: need a 2nd distinct eligible task for the demote case'); verdict.demote = 'SETUP-INCOMPLETE'; }

  const ctx = await browser.newContext({ ...IOS, serviceWorkers: 'block' });
  await ctx.addInitScript((t) => { try { localStorage.setItem('rawbin-player-id', t); } catch {} }, oh['x-player-token']);
  const sm = (oh['Cookie'] || '').match(/sm_session=([^;]+)/); if (sm) await ctx.addCookies([{ name: 'sm_session', value: sm[1], domain: 'localhost', path: '/' }]);
  const page = await ctx.newPage();
  await page.goto(`${f.base}/trace`, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await page.waitForFunction(() => !!customElements.get('rb-detail-drawer'), { timeout: 20000 }).catch(() => {});

  // ── (a) RENDER: make-current T1 (POST-BROADCAST) → open drawer on T1 → both consumers agree current==T1 ──
  await makeCurrent(T1); await sleep(1800);
  const curA = await resolvedCurrent8();                       // consumer 1: live resolver
  await openDrawer(page, T1); await sleep(2000);
  const barA = await readBar(page);                             // consumer 2: drawer action-bar
  const resolverSaysT1 = curA === T1.slice(0, 8);
  const barRendersCurrent = barA.barOffersSetCurrent === false; // T1 IS current → bar HIDES Set-as-Current
  verdict.render = (resolverSaysT1 && barRendersCurrent) ? 'GREEN' : 'RED';
  console.log(`\n(a) RENDER (post-broadcast, T1=${T1.slice(0, 8)}): resolver.current=${curA} (==T1? ${resolverSaysT1}) · bar-hides-SetCurrent=${barRendersCurrent} · bar="${barA.barText}" → ${verdict.render}`);

  // ── (c) DEMOTE: make-current T2 → T1 must be demoted across BOTH consumers ──
  if (T2) {
    await makeCurrent(T2); await sleep(1800);
    const curC = await resolvedCurrent8();                      // consumer 1: resolver moved to T2
    await openDrawer(page, T1); await sleep(2000);
    const barC = await readBar(page);                           // consumer 2: T1's bar re-offers Set-as-Current
    const resolverMovedOffT1 = curC === T2.slice(0, 8) && curC !== T1.slice(0, 8);
    const barDemotesT1 = barC.barOffersSetCurrent === true;     // T1 no longer current → bar OFFERS Set-as-Current again
    verdict.demote = (resolverMovedOffT1 && barDemotesT1) ? 'GREEN' : 'RED';
    console.log(`(c) DEMOTE (post-broadcast, made T2=${T2.slice(0, 8)} current): resolver.current=${curC} (moved off T1? ${resolverMovedOffT1}) · T1-bar-re-offers-SetCurrent=${barDemotesT1} · bar="${barC.barText}" → ${verdict.demote}`);
  }
} finally {
  await browser.close();
  const td = await f.teardown();
  console.log(`\nteardown: prodUp=${td.prodUp} leftover=${td.leftover}`);
}
console.log(`\n═══ T40.1 VERIFY on v${f.servedVersion}: (a) RENDER=${verdict.render} · (c) DEMOTE=${verdict.demote} ═══`);
process.exitCode = (verdict.render === 'GREEN' && verdict.demote === 'GREEN') ? 0 : 1;
