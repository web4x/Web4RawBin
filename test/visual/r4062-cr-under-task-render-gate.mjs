// R40.62 CR-under-task render — RED BASELINE on TRON'S SURFACE FROM HIS ENTRY (CMM3 step 1 + step 4 in one capture).
// Tron opens T40.1 on /trace and sees NO ChangeRequest. Measured (structural): his 5 CRs hang 5 expand-steps deep under
// the Test (T40.1→UC→Method→Impl→Test c4f8a1d6→CR) — invisible from his entry. THIS gate renders it @390 real-WebKit
// FROM HIS ENTRY (the task node on /trace), expands ONE level, and asserts the number of his CRs visible.
// RED NOW = 0 of his 5 CRs visible one level from T40.1 (defect present). The under-task itemView render (his master-list
// model, no data migration) must flip this GREEN: expand one level from T40.1 → his CRs ARE visible. DET-3x.
// ★ Asserts the PROPERTY ON HIS SURFACE (rendered tree row), never the reachable-graph proxy that just burned us.
import { webkit } from '@playwright/test';
const BASE = 'https://prod.wo-da.de:4444';
const TASK = '7a956c21-5f37-4062-b921-9bdd5a461546';        // T40.1
const HIS_CRS = ['18ebe066', '461d5db6', '4babebb1', '7286d45a', 'c27ae455']; // the 5 CRs that ARE T40.1's (under Test c4f8a1d6)
const IOS = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, isMobile: false, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', ignoreHTTPSErrors: true };
const sleep = ms => new Promise(r => setTimeout(r, ms));

const b = await webkit.launch({ headless: true });
const results = [];
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await b.newContext({ ...IOS, serviceWorkers: 'block' });
    const p = await ctx.newPage();
    await p.goto(`${BASE}/trace`, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
    await p.waitForFunction(() => !!customElements.get('rb-object-item'), { timeout: 20000 }).catch(() => {});
    await sleep(1000);
    // navigate to T40.1's row (HIS entry: the task on the board) — expand toward Sprint 40
    const findTask = () => p.evaluate(u => !!document.querySelector(`rb-object-item[ref="task:${u}"]`), TASK);
    for (let r = 0; r < 12 && !(await findTask()); r++) { await p.evaluate(() => { for (const it of document.querySelectorAll('rb-object-item')) { const t = it.innerText || ''; if (/Sprints?\b|Sprint 40|Sprint 4/i.test(t)) { const tg = it.querySelector('.oi-expand,.expander,[class*="expand"],[class*="chevron"]') || it; try { tg.click(); } catch {} } } }); await sleep(900); }
    const found = await findTask();
    // expand T40.1 exactly ONE level (his first click on his task)
    await p.evaluate(u => { const row = document.querySelector(`rb-object-item[ref="task:${u}"]`); const tg = row?.querySelector('.oi-expand,.expander,[class*="expand"],[class*="chevron"]') || row; try { tg?.click(); } catch {} }, TASK);
    await sleep(1200);
    // count how many of HIS CRs are now VISIBLE anywhere in the rendered tree (his surface), + total CR-type nodes
    const seen = await p.evaluate((crs) => {
      const items = [...document.querySelectorAll('rb-object-item')];
      const isVisible = e => (e.offsetHeight || 0) > 0;
      const crNodes = items.filter(e => /change|cr:/i.test((e.getAttribute('type') || '') + (e.getAttribute('ref') || '')) && isVisible(e));
      const hisVisible = crs.filter(id => items.some(e => (e.getAttribute('ref') || '').includes(id) && isVisible(e)));
      return { hisVisibleCount: hisVisible.length, hisVisible, crNodeCount: crNodes.length };
    }, HIS_CRS);
    const red = found && seen.hisVisibleCount === 0;   // RED baseline: NONE of his CRs visible one level from his task
    results.push({ i, found, ...seen, red });
    console.log(`iter ${i}: T40.1-row-found=${found} → after 1-level expand: HIS CRs visible=${seen.hisVisibleCount}/5 ${JSON.stringify(seen.hisVisible)} (any CR-type node visible=${seen.crNodeCount}) => ${red ? 'RED (0 of his CRs on his surface)' : 'not-RED'}`);
    await ctx.close();
  }
} finally { await b.close(); }

console.log('\n===== R40.62 CR-under-task render — RED baseline @390 from T40.1 (his entry), DET-3x =====');
const allFound = results.every(r => r.found);
const allRed = results.length === 3 && results.every(r => r.red);
if (!allFound) console.log('SETUP: T40.1 row not located in some run — adapt navigation before trusting the baseline.');
results.forEach(r => console.log(`  iter ${r.i}: ${r.red ? 'RED' : 'not-RED'} (his CRs visible ${r.hisVisibleCount}/5)`));
console.log('VERDICT:', allFound && allRed
  ? 'RED DET-3x — 0 of T40.1\'s 5 CRs are visible one level from his task (defect confirmed on his surface). The fix must flip this: his CRs visible one level from T40.1.'
  : 'NOT the clean RED baseline — see runs.');
process.exitCode = (allFound && allRed) ? 1 : 0;  // exit 1 = the RED baseline is present (the defect); the fix makes this exit 0 by rendering his CRs
