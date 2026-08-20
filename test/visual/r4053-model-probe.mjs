// [test:uuid:4c811eb5-1941-4fb5-857f-fbcb3c40fe76] R40.53 defect #2 — RbTaskDetail.render (Impl 1ff4d2bb) idempotent under
// the overlapping-async-tail race: a live re-render fired while a prior render's /api/ior tail is still in flight must NOT
// duplicate detail sections. The R37.12(B) fix routes every section insert through upsertSection/upsertParentLink
// (assign-once per marker class = remove-prior-then-insert), so Parent renders ONCE even under N overlapping tails.
// RED on v0.8.121 (c3e8b22f5): render()×3 rapid → Parent×3/Status×4. GREEN on Ship-1 v0.8.122 (bfbd85d88): stays ×1.
// Gates BOTH surfaces (ROUTE=trace flow / ROUTE=model = Tron's actual surface; INSTANCES×1 rules out multi-instance
// drawer stacking). @390 real-WebKit, scratch + system-literal owner session (never prod:4444/Tron cred). DET-3x.
import { setupFoundation } from './r4031-foundation.mjs';
import { webkit } from '@playwright/test';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const COMMIT = process.env.MC_COMMIT || 'bb8c11eb9'; // default = the CURRENT served build v0.8.123 (marker-delegation fix; GREEN DET-3x both surfaces, behavior-identical to v0.8.122). MC_COMMIT=c3e8b22f5 = the v0.8.121 RED baseline.
const ROUTE = process.env.ROUTE || 'trace';
const TASK = process.env.MC_TASK || '97e8a6ad-46db-440f-a9be-cfb97ca64df4'; // real task with a Parent link ('Profile: Marcel Donges'), resolvable on both surfaces
const IOS = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, isMobile: false,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', ignoreHTTPSErrors: true };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const f = await setupFoundation({ commit: COMMIT, buildDist: true });
console.log(`scratch up: ${f.base} v${f.servedVersion} sha=${f.worktreeSha} route=${ROUTE} task=${TASK.slice(0, 8)}`);
const browser = await webkit.launch({ headless: true });
const runs = [];
try {
  const ctx = await browser.newContext(IOS);
  const oh = f.ownerHeaders();
  await ctx.addInitScript((t) => { try { localStorage.setItem('rawbin-player-id', t); } catch {} }, oh['x-player-token']);
  const sm = (oh['Cookie'] || '').match(/sm_session=([^;]+)/); // /model is owner-gated → seed the system session cookie
  if (sm) await ctx.addCookies([{ name: 'sm_session', value: sm[1], domain: 'localhost', path: '/' }]);
  const page = await ctx.newPage();
  await page.goto(`${f.base}/${ROUTE}`, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await page.waitForFunction(() => !!customElements.get('rb-detail-drawer'), { timeout: 20000 }).catch(() => {});
  if (ROUTE === 'model') { await page.evaluate(async () => { try { await document.querySelector('rb-trace-tree')?.expandPath?.(['mof-m1', 'project:RawBin', 'rawbin:diagram']); } catch {} }); await sleep(1200); }

  const settle = async () => { let prev = -1; for (let k = 0; k < 30; k++) { await sleep(300); const s = await page.evaluate(() => { const p = document.querySelector('rb-detail-drawer .drawer-panel-detail'); return { len: (p?.innerHTML || '').length, loading: /Loading chain/i.test(p?.innerText || '') }; }); if (s.len > 0 && s.len === prev && !s.loading) return s.len; prev = s.len; } return prev; };
  const measure = () => page.evaluate(() => {
    const p = document.querySelector('rb-detail-drawer .drawer-panel-detail'); const txt = p?.innerText || '';
    return { parentLinks: document.querySelectorAll('rb-detail-drawer .dv-parent-link').length, marcel: (txt.match(/Profile: Marcel Donges/g) || []).length,
      instances: document.querySelectorAll('rb-detail-drawer rb-task-detail').length, len: (p?.innerHTML || '').length, dataGap: /UNRESOLVED|DATA GAP|not found/i.test(txt) };
  });

  // DET-3x: three independent open → populate → overlapping-tail-race → assert cycles.
  for (let i = 1; i <= 3; i++) {
    await page.evaluate(() => document.dispatchEvent(new CustomEvent('selection-changed', { detail: { selected: [] } }))); await sleep(300); // deselect
    await page.evaluate((u) => document.dispatchEvent(new CustomEvent('selection-changed', { detail: { selected: ['task:' + u] } })), TASK); await settle();
    await fetch(`${f.base}/api/task/${TASK}/make-current`, { method: 'POST', headers: oh }); await sleep(1200); await settle(); // POPULATE the full detail (Parent×1)
    const pop = await measure();
    // the overlapping-tail RACE: fire render() 3× rapidly (no settle between) → multiple /api/ior tails in flight together
    await page.evaluate(() => { const el = document.querySelector('rb-detail-drawer rb-task-detail') || document.querySelector('rb-task-detail'); if (el && typeof el.render === 'function') { el.render(); el.render(); el.render(); } });
    await sleep(2000); await settle();
    const raced = await measure();
    const ok = pop.parentLinks === 1 && !pop.dataGap && raced.parentLinks <= 1 && raced.marcel <= 1 && raced.instances === 1;
    runs.push(ok);
    console.log(`iter ${i} [${ROUTE}]: populated P×${pop.parentLinks} → race×3 → Parent×${raced.parentLinks} Marcel×${raced.marcel} INSTANCES×${raced.instances} len ${pop.len}→${raced.len} => ${ok ? 'GREEN' : 'RED'}`);
  }
} finally {
  await browser.close();
  const td = await f.teardown();
  console.log(`teardown: prodUp=${td.prodUp} leftover=${td.leftover}`);
}
const green = runs.length === 3 && runs.every(Boolean);
console.log(`\nVERDICT v${f.servedVersion} [route=${ROUTE}] DET-3x: ${green ? 'GREEN (Parent renders once under the overlapping-tail race, single-instance)' : 'RED (duplication)'}`);
process.exitCode = green ? 0 : 1;
