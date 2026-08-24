// R40.57 RUNTIME TRACE (architect/PO request, design 056211d82) — settle the concurrent-render-race candidate on v0.8.125.
// Instrument the CLIENT (prototype-wrap, no rebuild): every universalActionBar call logs {id, ref, _currentSlotUuid@entry,
// _shownRef, _currentSlotUuid@end, barSetCurrent@end}; refreshCurrentSlot logs {csBefore, csAfter, shownType, fired-103};
// a MutationObserver on .drawer-actionbar logs each PAINT {t, hasSetCurrent, _currentSlotUuid}. Answers the 3 questions:
// (1) does the :103 re-derive fire? (2) which render PAINTS LAST? (3) does the last paint carry an empty _currentSlotUuid?
// Scenario = open-after-designation @390 (the fresh-render repro where the RED shows). Scratch v0.8.125, own session, no prod mutation.
import { setupFoundation } from './r4031-foundation.mjs';
import { webkit } from '@playwright/test';
import fs from 'fs';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const TASK = '7a956c21-5f37-4062-b921-9bdd5a461546'; // Task 40.1
const CSU = 'current-sprint-singleton-0000-000000000001';
const IOS = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, isMobile: false,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', ignoreHTTPSErrors: true };
const OUT = 'test-results/r4057-trace'; fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const INIT = `(() => {
  window.__ub = []; window.__rcs = []; window.__paints = []; let n = 0;
  const iv = setInterval(() => {
    const C = customElements.get('rb-detail-drawer'); if (!C) return; clearInterval(iv);
    const P = C.prototype;
    const origUB = P.universalActionBar;
    P.universalActionBar = function(type, ref) {
      const id = ++n;
      const rec = { id, tEntry: Math.round(performance.now()), ref: ref, csEntry: this._currentSlotUuid, shownRefEntry: this._shownRef };
      window.__ub.push(rec);
      const p = origUB.call(this, type, ref);
      Promise.resolve(p).then(() => {
        rec.tEnd = Math.round(performance.now());
        rec.csEnd = this._currentSlotUuid;
        const bar = this.querySelector('.drawer-actionbar');
        rec.barSetCurrentAtEnd = /Set as Current/i.test((bar && bar.innerText) || '');
        rec.guardBailed = this._shownRef !== ref; // :502 — a newer selection landed
      });
      return p;
    };
    const origRCS = P.refreshCurrentSlot;
    if (origRCS) P.refreshCurrentSlot = function() {
      const rec = { tStart: Math.round(performance.now()), csBefore: this._currentSlotUuid, shownTypeAtStart: this._shownType };
      window.__rcs.push(rec);
      const p = origRCS.call(this);
      Promise.resolve(p).then(() => { rec.tEnd = Math.round(performance.now()); rec.csAfter = this._currentSlotUuid; rec.shownTypeAtEnd = this._shownType; rec.fired103 = !!this._shownType; });
      return p;
    };
    const oi = setInterval(() => {
      const bar = document.querySelector('rb-detail-drawer .drawer-actionbar'); if (!bar) return; clearInterval(oi);
      const drawer = document.querySelector('rb-detail-drawer');
      new MutationObserver(() => { window.__paints.push({ t: Math.round(performance.now()), hasSetCurrent: /Set as Current/i.test(bar.innerText || ''), cs: drawer._currentSlotUuid }); }).observe(bar, { childList: true, subtree: true, characterData: true });
    }, 8);
  }, 4);
})()`;

const f = await setupFoundation({ commit: 'HEAD', buildDist: true });
const oh = f.ownerHeaders();
console.log(`scratch: ${f.base} servedVersion=${f.servedVersion} sha=${f.worktreeSha}`);
const jf = (u) => fetch(`${f.base}${u}`, { headers: oh }).then(r => r.json()).catch(() => null);
const resolvedCurrent8 = async () => { const d = await jf(`/api/trace/children/${CSU}`); const c = (d?.children || []).find(k => /Current\b/.test(String(k.name || '')) && !/CurrentSprint/.test(String(k.name || ''))); return c?.uuid?.slice?.(0, 8) || null; };

try {
  // PARK current away from 40.1 so it starts NOT-current, then (below) open the drawer, THEN designate 40.1 LIVE
  const PARK = '4bc1b3d5-...';
  const tree0 = await jf(`/api/trace/children/${CSU}`);
  const park = (tree0?.children||[]).map(k=>k.uuid).find(u=>u && u.slice(0,8)!=='7a956c21') || TASK;
  await fetch(`${f.base}/api/task/${park}/make-current`, { method: 'POST', headers: oh });
  console.log(`parked current to ${(await resolvedCurrent8())} (40.1 starts not-current)`);
  const browser = await webkit.launch({ headless: true });
  try {
    const ctx = await browser.newContext({ ...IOS, serviceWorkers: 'block' });
    await ctx.addInitScript((t) => { try { localStorage.setItem('rawbin-player-id', t); } catch {} }, oh['x-player-token']);
    await ctx.addInitScript(INIT);
    const sm = (oh['Cookie'] || '').match(/sm_session=([^;]+)/); if (sm) await ctx.addCookies([{ name: 'sm_session', value: sm[1], domain: 'localhost', path: '/' }]);
    const page = await ctx.newPage();
    await page.goto(`${f.base}/trace`, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
    await page.waitForFunction(() => !!customElements.get('rb-detail-drawer'), { timeout: 15000 }).catch(() => {});
    await sleep(400);
    // LIVE-UPDATE: open drawer BEFORE designation, then designate live → connectedCallback fetch races the onDetailShown show-render
    await page.evaluate((u) => document.dispatchEvent(new CustomEvent('selection-changed', { detail: { selected: ['task:' + u] } })), TASK);
    await sleep(1800); // drawer open on 40.1 (NOT current yet) → bar should offer Set-as-Current
    await fetch(`${f.base}/api/task/${TASK}/make-current`, { method: 'POST', headers: oh }); // DESIGNATE 40.1 LIVE (broadcast)
    console.log(`LIVE designated 40.1 → slots.current=${await resolvedCurrent8()}`);
    await sleep(3500); // let the broadcast → _csPinUnsub → refreshCurrentSlot → :103 re-derive settle
    const trace = await page.evaluate(() => ({ ub: window.__ub, rcs: window.__rcs, paints: window.__paints, finalBar: /Set as Current/i.test(document.querySelector('rb-detail-drawer .drawer-actionbar')?.innerText || ''), finalCs: document.querySelector('rb-detail-drawer')?._currentSlotUuid }));
    await ctx.close();

    fs.writeFileSync(`${OUT}/r4057-trace-raw-v${f.servedVersion}.json`, JSON.stringify(trace, null, 2));
    const short = (s) => s ? String(s).slice(0, 8) : (s === '' ? "''(empty)" : '(nil)');
    console.log('\n=== universalActionBar CALLS (id: entry to end) ===');
    trace.ub.forEach(c => console.log('  #' + c.id + ' ref=' + short(c.ref) + ' csEntry=' + short(c.csEntry) + ' csEnd=' + short(c.csEnd) + ' barSetCurrentAtEnd=' + c.barSetCurrentAtEnd + ' guardBailed=' + c.guardBailed + ' tEntry=' + c.tEntry + ' tEnd=' + c.tEnd));
    console.log('=== refreshCurrentSlot CALLS ===');
    trace.rcs.forEach(r => console.log('  csBefore=' + short(r.csBefore) + ' csAfter=' + short(r.csAfter) + ' shownTypeAtEnd=' + r.shownTypeAtEnd + ' fired103=' + r.fired103 + ' tStart=' + r.tStart + ' tEnd=' + r.tEnd));
    console.log('=== PAINTS (bar mutations, chronological) ===');
    trace.paints.forEach((p, i) => console.log('  paint[' + i + '] t=' + p.t + ' hasSetCurrent=' + p.hasSetCurrent + ' cs=' + short(p.cs)));
    const lastPaint = trace.paints[trace.paints.length - 1];
    const lastUb = [...trace.ub].filter(c => c.tEnd != null).sort((a, b) => a.tEnd - b.tEnd).pop();
    console.log('\n=== ANSWERS ===');
    console.log('  (1) does the :103 re-derive fire? ' + (trace.rcs.some(r => r.fired103) ? 'YES (refreshCurrentSlot fired universalActionBar with csAfter set)' : 'NO (:103 did NOT re-derive)'));
    console.log('  (2) which render PAINTS LAST? last-paint hasSetCurrent=' + (lastPaint && lastPaint.hasSetCurrent) + ' cs=' + short(lastPaint && lastPaint.cs) + ' ; last-resolving UB #' + (lastUb && lastUb.id) + ' csEnd=' + short(lastUb && lastUb.csEnd) + ' barSetCurrent=' + (lastUb && lastUb.barSetCurrentAtEnd));
    const lastCsEmpty = !lastPaint || !lastPaint.cs;
    console.log('  (3) does the last paint carry EMPTY _currentSlotUuid? ' + (lastCsEmpty ? 'YES (empty at last paint)' : 'NO (cs=' + short(lastPaint.cs) + ' at last paint, yet bar hasSetCurrent=' + lastPaint.hasSetCurrent + ')'));
    console.log('  FINAL bar hasSetCurrent=' + trace.finalBar + ' FINAL _currentSlotUuid=' + short(trace.finalCs));
    const verdict = (lastPaint && lastPaint.hasSetCurrent && lastUb && lastUb.csEnd) ? 'NOT-A-SIMPLE-PAINT-RACE: the last-resolving call HAD a non-empty _currentSlotUuid yet the bar still shows Set-as-Current -> the role compute/apply is the gap'
      : ((lastPaint && lastPaint.hasSetCurrent && (!lastUb || !lastUb.csEnd)) ? 'RACE-CONFIRMED: last paint shows Set-as-Current with empty _currentSlotUuid (pre-fetch render painted last)'
      : 'see raw trace');
    console.log('\n  VERDICT: ' + verdict);
  } finally { await browser.close(); }
} finally {
  const td = await f.teardown();
  console.log(`teardown: prodUp=${td.prodUp} leftover=${td.leftover}`);
}
