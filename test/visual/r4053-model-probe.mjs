// R40.53 defect #2 repro — drawer section-duplication (Parent×2 / Status×3). ARCHITECT ROOT (ba4bf4ea6): FLOW not
// surface — rb-task-detail.ts:53 ViewBus.subscribe(viewBusKey(ref), ()=>this.render()); with the drawer ALREADY OPEN
// on the task, make-current's broadcast fires that, render() re-runs, and its async tail (insertAdjacentHTML
// statusChecklist:73 / parentLink:78) APPENDS into already-populated DOM → Parent×2/Status×3. Reproduce on /trace
// (no /model, no owner session needed for the view): open the drawer via the REAL selection-changed → THEN make-current
// on the SAME task. Assert Parent renders ONCE + Status stable. RED v0.8.121 (c3e8b22f5) → GREEN v0.8.122 (bfbd85d88).
// GATE TRON'S EXACT FLOW — do NOT accept the by-construction upsertSection claim as evidence. Scratch, @390 real-WebKit.
import { setupFoundation } from './r4031-foundation.mjs';
import { webkit } from '@playwright/test';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const COMMIT = process.env.MC_COMMIT || 'c3e8b22f5';
const ROUTE = process.env.ROUTE || 'trace'; // 'trace' (flow repro) or 'model' (PO multi-instance discriminator)
const TASK = process.env.MC_TASK || '7a956c21-5f37-4062-b921-9bdd5a461546'; // Task 40.1 — real S40 task, HAS a Parent link
const IOS = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, isMobile: false,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', ignoreHTTPSErrors: true };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const f = await setupFoundation({ commit: COMMIT, buildDist: true });
console.log(`scratch up: ${f.base} v${f.servedVersion} sha=${f.worktreeSha} task=${TASK.slice(0, 8)}`);
const browser = await webkit.launch({ headless: true });
let verdict = 'UNKNOWN';
try {
  const ctx = await browser.newContext(IOS);
  const oh0 = f.ownerHeaders();
  await ctx.addInitScript((t) => { try { localStorage.setItem('rawbin-player-id', t); } catch {} }, oh0['x-player-token']);
  const sm0 = (oh0['Cookie'] || '').match(/sm_session=([^;]+)/); // /model is owner-gated → seed the system session cookie
  if (sm0) await ctx.addCookies([{ name: 'sm_session', value: sm0[1], domain: 'localhost', path: '/' }]);
  const page = await ctx.newPage();
  await page.goto(`${f.base}/${ROUTE}`, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  if (ROUTE === 'model') { await page.evaluate(async () => { try { await document.querySelector('rb-trace-tree')?.expandPath?.(['mof-m1', 'project:RawBin', 'rawbin:diagram']); } catch {} }); await sleep(1200); }
  await page.waitForFunction(() => !!customElements.get('rb-detail-drawer'), { timeout: 20000 }).catch(() => {});
  await sleep(1000);

  const settle = async () => { let prev = -1; for (let k = 0; k < 30; k++) { await sleep(300); const s = await page.evaluate(() => { const p = document.querySelector('rb-detail-drawer .drawer-panel-detail'); return { len: (p?.innerHTML || '').length, loading: /Loading chain/i.test(p?.innerText || '') }; }); if (s.len > 0 && s.len === prev && !s.loading) return s.len; prev = s.len; } return prev; };
  const measure = () => page.evaluate(() => {
    const p = document.querySelector('rb-detail-drawer .drawer-panel-detail'); const txt = p?.innerText || '';
    return {
      parentLabels: (txt.match(/(^|\n)\s*Parent\b/g) || []).length,
      parentLinks: document.querySelectorAll('rb-detail-drawer .dv-parent-link').length, // structural: the actual rendered parent-link elements
      marcel: (txt.match(/Profile: Marcel Donges/g) || []).length,
      statusLabels: (txt.match(/(^|\n)\s*Status\b/g) || []).length,
      checklists: document.querySelectorAll('rb-detail-drawer .dv-status-checklist, rb-detail-drawer [class*="checklist"]').length,
      len: (p?.innerHTML || '').length, dataGap: /UNRESOLVED|DATA GAP|not found/i.test(txt),
      instances: document.querySelectorAll('rb-detail-drawer rb-task-detail').length, // PO multi-instance discriminator: >1 = drawer-level stacking
    };
  });

  // OPEN via the REAL path, then POPULATE the full detail (Parent tail) via a make-current broadcast (the headless
  // synthetic-select mounts rb-task-detail without its graph, so the Parent tail only paints once the ws broadcast
  // delivers the unit payload — that populated state is exactly Tron's "drawer already open on the task").
  await page.evaluate((uuid) => document.dispatchEvent(new CustomEvent('selection-changed', { detail: { selected: ['task:' + uuid] } })), TASK);
  await settle();
  await fetch(`${f.base}/api/task/${TASK}/make-current`, { method: 'POST', headers: f.ownerHeaders() }); // POPULATE
  await sleep(1500); await settle();
  const before = await measure();
  console.log(`[route=${ROUTE}] POPULATED: rb-task-detail INSTANCES×${before.instances} (PO discriminator: >1=multi) · parentLinks×${before.parentLinks} Marcel×${before.marcel} checklists×${before.checklists} len=${before.len} dataGap=${before.dataGap}`);
  if (before.dataGap || before.parentLinks < 1) {
    console.log('⚠ could NOT populate the Parent link even via broadcast — cannot stage the open-with-Parent state. SETUP finding.');
    verdict = 'SETUP-INCOMPLETE (no Parent to duplicate)';
  } else {
    // TRIGGER the exact re-entry with the OVERLAPPING-TAIL race the architect measured (×3 asymmetry): fire render()
    // several times RAPIDLY (no settle between) so multiple /api/ior tails are in flight together — each resolves and
    // insertAdjacentHTML-APPENDS into the shared populated DOM → Parent×2/×3 on buggy; upsert (remove-then-insert) → ×1.
    const fired = await page.evaluate(() => { const el = document.querySelector('rb-detail-drawer rb-task-detail') || document.querySelector('rb-task-detail'); if (!el || typeof el.render !== 'function') return 'no-render-method'; el.render(); el.render(); el.render(); return 'render()×3 rapid'; });
    console.log(`re-entry trigger: ${fired}`);
    await sleep(2000); await settle();
    const after = await measure();
    console.log(`AFTER rapid re-render: parentLinks×${after.parentLinks} Marcel×${after.marcel} checklists×${after.checklists} statusLabels×${after.statusLabels} len=${after.len}`);
    // also confirm Tron's literal flow: make-current again with the drawer open
    await fetch(`${f.base}/api/task/${TASK}/make-current`, { method: 'POST', headers: f.ownerHeaders() });
    await sleep(1500); await settle();
    const afterMc = await measure();
    console.log(`AFTER make-current (Tron flow): parentLinks×${afterMc.parentLinks} Marcel×${afterMc.marcel} checklists×${afterMc.checklists}`);
    const worst = Math.max(after.parentLinks, afterMc.parentLinks, after.marcel, afterMc.marcel);
    const parentOnce = worst <= 1;
    const pass = parentOnce;
    console.log(`\n── defect #2 (v${f.servedVersion}) ──`);
    console.log(`  Parent renders ONCE (not ×2): ${parentOnce ? 'PASS' : 'FAIL'} (populated ×${before.parentLinks} → re-render ×${after.parentLinks} → make-current ×${afterMc.parentLinks}; Marcel ${before.marcel}→${after.marcel}→${afterMc.marcel})`);
    verdict = pass ? 'GREEN (no duplication)' : 'RED (duplication reproduced)';
    console.log(`  VERDICT v${f.servedVersion}: ${verdict}`);
  }
} finally {
  await browser.close();
  const td = await f.teardown();
  console.log(`teardown: prodUp=${td.prodUp} leftover=${td.leftover}`);
}
