// R40.10 AC(a) — the approve/decline UI SURFACES + is FIREABLE on a real task detail @390 (shipped v0.8.77 as R40.5
// action units in universal-actions.ts). Companion to r4010-qa-verdict-gate.ts (server logic b/c/d/e). Real-WebKit
// iPhone-12 @390, DET-3x. Pollution-safe: the POST /api/task/*/approve is ROUTE-INTERCEPTED (never reaches prod → no
// real approve on Tron's board). Asserts: (1) ✓ Approve + ✗ Decline SURFACE on a task detail; (2) FIREABLE — tapping
// fires POST /api/task/<uuid>/approve; (3) ★ NO CLIENT PRE-GATE (server is the sole Done-authority): the client
// surfaces the server's verdict VERBATIM — a 200 shows 'Approved — Done', a 403 shows the REFUSAL and NEVER a fake
// 'Approved' (a client that pre-decided Done would be a false second authority). FINAL owner-tap sliver → Tron device.
import { webkit, devices } from '@playwright/test';
const BASE = 'https://prod.wo-da.de:4444';
const TASK = 'task:92bdca8b-6c08-459d-a540-98073b80c020'; // a real QA-Review task; POST is intercepted so nothing is written
const iPhone = devices['iPhone 12'];
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// use the PAGE'S OWN drawer (registerUniversalActions is _wired to it — a fresh drawer would have NO action provider)
const mountTask = (page) => page.evaluate((ref) => {
  let d = document.querySelector('rb-detail-drawer');
  if (!d) { d = document.createElement('rb-detail-drawer'); document.body.appendChild(d); }
  d.setAttribute('open', ''); d.removeAttribute('minimized'); d.setAttribute('ref', ref);
}, TASK);
const banner = (page) => page.evaluate(() => document.querySelector('rb-detail-drawer .qa-verdict-result')?.textContent || '');

const browser = await webkit.launch();
const results = [];
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ...iPhone, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
    const page = await ctx.newPage();
    let postFired = false;
    await page.route('**/api/task/*/approve', (route) => { postFired = true; route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, status: 'Done', approvedBy: 'ce981242', approvedAt: '2026-08-09T00:00:00Z' }) }); });
    await page.goto(`${BASE}/trace`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => !!customElements.get('rb-detail-drawer'), { timeout: 20000 }).catch(() => {});
    await mountTask(page); await sleep(1500);

    // (1) buttons SURFACE on the task detail
    const approveBtn = page.locator('rb-detail-drawer .drawer-actionbar [data-verb="qa-approve"]');
    const declineBtn = page.locator('rb-detail-drawer .drawer-actionbar [data-verb="qa-decline"]');
    const surface = (await approveBtn.isVisible().catch(() => false)) && (await declineBtn.isVisible().catch(() => false));

    // (2)+(3a) FIREABLE + reflects a 200 verbatim → 'Approved — Done'
    await approveBtn.click({ timeout: 5000 }).catch(() => {});
    await sleep(900);
    const b200 = await banner(page);
    const fires = postFired && /Approved/.test(b200) && /Done/.test(b200);

    // (3b) NO PRE-GATE: same tap, server 403 → client shows the REFUSAL, NEVER a fake 'Approved — Done'
    await page.unroute('**/api/task/*/approve');
    await page.route('**/api/task/*/approve', (route) => route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ ok: false, error: 'forbidden' }) }));
    await mountTask(page); await sleep(1200);
    await page.locator('rb-detail-drawer .drawer-actionbar [data-verb="qa-approve"]').click({ timeout: 5000 }).catch(() => {});
    await sleep(900);
    const b403 = await banner(page);
    const noPreGate = /owner only|403|NOT recorded/i.test(b403) && !/Approved — status now Done/.test(b403);

    const pass = surface && fires && noPreGate;
    results.push(pass);
    console.log(`iter ${i}: (1)surface=${surface} (2)fireable+reflects-200=${fires}(fired=${postFired}, "${b200.slice(0, 44)}") (3)no-pre-gate-on-403=${noPreGate}("${b403.slice(0, 48)}") => ${pass ? 'GREEN' : 'RED'}`);
    if (i === 1) await page.screenshot({ path: 'test-results/r4010/verdict-403-refusal-iter1.png' }).catch(() => {});
    await ctx.close();
  }
} finally { await browser.close(); }

console.log('\n===== R40.10 AC(a) approve/decline UI @390 real-WebKit (DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x — UI surfaces, fires, no pre-gate' : 'RED');
process.exitCode = green ? 0 : 1;
