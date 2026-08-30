// Tron-facing: the 47 S40 task units must RENDER in the GUI he actually looks at — the /trace Sprint-40 view @390 mobile.
// ★ Asserts the RENDERED ARTIFACT (rb-object-item rows in the live DOM), NOT disk presence (disk-presence is the proxy
// error that let this ship — units were minted to main via a worktree, 0 in the served hotfix tree, so Tron saw nothing).
// RED baseline NOW (pre-cherry-pick): S40 serves childCount 16, Task 40.19/40.25/40.45 ABSENT. GREEN after the expert
// cherry-picks the backfill onto the served branch + restart: the 47 render as rows. If they DON'T render even once the
// units are in the served tree ⇒ a SECOND defect (index not re-read / view not regenerated / needs restart) — report precisely.
// @390 iPhone-12 real-WebKit, authenticated (SystemTester seed). READ-ONLY (same-origin GET; no mutation).
import { webkit, devices } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
const BASE = 'https://prod.wo-da.de:4444';
const S40 = '8e8b32d6-22bf-46f7-bf5c-7da31ef41e19';           // Sprint 40 (from /api/trace/sprints)
const MUST_RENDER = ['Task 40.19', 'Task 40.25', 'Task 40.45']; // representative of the 47 he can't see
const iPhone = devices['iPhone 12'];
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const browser = await webkit.launch({ headless: true });
const results = [];
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ...iPhone, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
    await seedSystemTester(ctx);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/trace`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForFunction(() => !!customElements.get('rb-trace-tree'), { timeout: 20000 }).catch(() => {});
    await sleep(800);

    // drive the REAL tree the way a tap does: S40 lives under a COLLAPSED "Sprints 01-40" collection, so expand that
    // FIRST (a tap), let S40 render, THEN expand S40 → it fetches /api/trace/children/<S40> and renders the task rows.
    const toggle = (sel) => page.evaluate((s) => { const it = document.querySelector(s); if (it) it.dispatchEvent(new CustomEvent('toggle-children', { bubbles: true, detail: { open: true } })); return !!it; }, sel);
    await toggle('rb-object-item[ref*="sprints-collection"]');       // (1) open the Sprints collection
    await sleep(2200);
    await toggle(`rb-object-item[ref*="${S40}"]`);                    // (2) open Sprint 40 (now rendered)
    await sleep(2800);                                                // fetch + render the task rows

    // COUNT THE RENDERED ROWS (the artifact Tron sees), not disk
    const r = await page.evaluate(() => {
      const rows = [...document.querySelectorAll('rb-object-item')];
      const taskRows = rows.map(el => (el.getAttribute('name') || el.getAttribute('title') || el.textContent || '').trim())
        .filter(txt => /Task 40\.\d+/.test(txt));
      return { s40Rendered: taskRows.map(t => (t.match(/Task 40\.\d+/) || [''])[0]), total: taskRows.length };
    });
    const rendered = new Set(r.s40Rendered);
    const allPresent = MUST_RENDER.every(t => [...rendered].some(x => x === t.replace('Task ', 'Task ') || x === t));
    const missing = MUST_RENDER.filter(t => ![...rendered].includes(t));
    const jumped = r.total > 16; // a real jump from the pre-cherry-pick baseline of 16 (informational corroboration)
    const pass = allPresent && jumped; // HARD assertion = the 47's representatives render; count corroborates the jump
    results.push(pass);
    console.log(`iter ${i}: S40 Task-40.x rows RENDERED=${r.total} (baseline was 16) | must-render present=${allPresent}${missing.length ? ' MISSING=' + missing.join(',') : ''} | jumped>16=${jumped} => ${pass ? 'GREEN' : 'RED'}`);
    if (i === 1) { console.log(`  rendered 40.x: ${[...rendered].sort().join(' ')}`); await page.screenshot({ path: 'test-results/r4063-s40-render.png' }).catch(() => {}); }
    await ctx.close();
  }
} finally { await browser.close(); }

console.log('\n===== S40 task-units RENDER on /trace @390 (real-WebKit) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN — the 47 S40 tasks RENDER as rows @390' : 'RED — S40 tasks NOT rendered (pre-cherry-pick = expected; post-cherry-pick = a SECOND defect: index not re-read / view not regenerated / needs restart)');
process.exit(green ? 0 : 1);
