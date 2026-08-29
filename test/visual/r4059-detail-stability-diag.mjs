// DIAGNOSE the T40.1 detail-sub-step INSTABILITY (PO 2026-08-29): decide (i) my capture RACES the render (measurement
// defect → fix method: wait on a deterministic signal, never sleep) vs (ii) the detail GENUINELY empties after tree-nav
// when the row is not visible (a REAL content-vanish defect on Tron's nav path). NOT re-capture-until-green: open the
// drawer ONCE and WAIT on a deterministic load signal (panel shows 'Task 40.1' + a Status field), bounded. loads ⇒ (i);
// times out ⇒ (ii). Compare no-nav vs post-nav. READ-ONLY served prod @390. Termination pattern applied.
import { webkit } from '@playwright/test';
const BASE = 'https://prod.wo-da.de:4444';
const TASK = '7a956c21-5f37-4062-b921-9bdd5a461546';
const IOS = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, isMobile: false, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', ignoreHTTPSErrors: true };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const HARD_MS = Number(process.env.GATE_HARD_MS || 150000);
const WD = setTimeout(() => { console.log(`RED: WATCHDOG — exceeded ${HARD_MS}ms without terminating.`); process.exit(1); }, HARD_MS);

// open the drawer ONCE, then wait DETERMINISTICALLY for the detail to populate (bounded). Returns {loaded, ms, snap}.
const openAndWait = async (p, timeout = 10000) => {
  await p.evaluate((ref) => { const d = document.querySelector('rb-detail-drawer'); if (d) { d.setAttribute('open', ''); d.setAttribute('ref', ref); } }, `task:${TASK}`);
  const t0 = Date.now();
  const loaded = await p.waitForFunction(() => {
    const d = document.querySelector('rb-detail-drawer'); const panel = d?.querySelector('.drawer-panel-detail') || d;
    const txt = panel?.innerText || ''; return /Task 40\.1\b/.test(txt) && /Status/i.test(txt);
  }, { timeout }).then(() => true).catch(() => false);
  const snap = await p.evaluate(() => {
    const d = document.querySelector('rb-detail-drawer'); const panel = d?.querySelector('.drawer-panel-detail') || d;
    const txt = panel?.innerText || '';
    const item = [...document.querySelectorAll('rb-object-item')].find(x => (x.getAttribute('ref') || '').includes('7a956c21'));
    return { detailLen: txt.length, hasTitle: /Task 40\.1\b/.test(txt), hasStatus: /Status/i.test(txt), hasSubstep: /processing change requests/i.test(txt), rowVisible: (item?.offsetHeight || 0) > 0, rowStatus: item?.getAttribute('status') || '(no row)' };
  });
  return { loaded, ms: Date.now() - t0, snap };
};

const b = await webkit.launch({ headless: true });
try {
  const ctx = await b.newContext({ ...IOS, serviceWorkers: 'block' });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/trace`, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await p.waitForFunction(() => !!customElements.get('rb-detail-drawer'), { timeout: 20000 }).catch(() => {});
  await sleep(800);

  // CASE A — NO navigation: open drawer + wait for load
  const A = await openAndWait(p);
  console.log(`CASE A (no-nav): loaded=${A.loaded} in ${A.ms}ms | detailLen=${A.snap.detailLen} title=${A.snap.hasTitle} status=${A.snap.hasStatus} sub-step=${A.snap.hasSubstep} rowVisible=${A.snap.rowVisible}`);

  // navigate the tree toward T40.1's row (reproduce the run-2 condition), then re-open + wait
  for (let round = 0; round < 10; round++) {
    const found = await p.evaluate(() => [...document.querySelectorAll('rb-object-item')].some(x => (x.getAttribute('ref') || '').includes('7a956c21')));
    if (found) break;
    await p.evaluate(() => { for (const it of document.querySelectorAll('rb-object-item')) { const t = it.innerText || ''; if (/Sprints?\b|Sprint 40|Marcel Donges/i.test(t)) { const tog = it.querySelector('.expander,.toggle,[class*="expand"],[class*="chevron"],.oi-expand') || it; try { tog.click(); } catch {} } } });
    await sleep(1000);
  }
  // close the drawer first so we test a FRESH open post-nav
  await p.evaluate(() => { const d = document.querySelector('rb-detail-drawer'); if (d) { d.removeAttribute('open'); d.removeAttribute('ref'); } });
  await sleep(500);
  const Bc = await openAndWait(p);
  console.log(`CASE B (post-nav): loaded=${Bc.loaded} in ${Bc.ms}ms | detailLen=${Bc.snap.detailLen} title=${Bc.snap.hasTitle} status=${Bc.snap.hasStatus} sub-step=${Bc.snap.hasSubstep} rowVisible=${Bc.snap.rowVisible} rowStatus="${Bc.snap.rowStatus}"`);

  console.log('\n── DIAGNOSIS ──');
  if (A.loaded && Bc.loaded) {
    console.log(`(i) MEASUREMENT RACE — the detail DOES load both no-nav and post-nav once you WAIT on a deterministic signal (A=${A.ms}ms, B=${Bc.ms}ms). My earlier empty read was a sleep racing the async /api/ior render (read() re-set ref then read synchronously). METHOD FIX: open once + waitForFunction, never sleep. NOT a feature defect.`);
  } else if (A.loaded && !Bc.loaded) {
    console.log(`(ii) REAL CONTENT-VANISH DEFECT — no-nav the detail loads (${A.ms}ms) but POST-NAV it NEVER populates within 10s (rowVisible=${Bc.snap.rowVisible}). The detail genuinely empties on Tron's own tree-navigation path when the row is not visible. This OUTRANKS the badge-map gap — content vanishing on navigation.`);
  } else {
    console.log(`INCONCLUSIVE — CASE A itself did not load (loaded=${A.loaded}); the load signal or entry is wrong, re-derive the signal before concluding (not a feature verdict).`);
  }
} finally { await b.close().catch(() => {}); clearTimeout(WD); process.exit(process.exitCode || 0); }
