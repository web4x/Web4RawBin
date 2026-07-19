// [test:uuid:4e2c8f10-6b9d-47a3-a5e1-8c3f0d29b7a4] R30.35 save-404 FIX on Tron's REAL deep-link
// /edit/otmux?repo=oosh&left=mcdonges.latest&right=dev&3way=1 (v0.7.61, edit-CYBX5O6I.js). The diff/merge Save
// [test:uuid:8c68c361-86c3-4fb0-8a04-bb311b432149] R30.38 setCenterTitle 41504f5f - center header renders filename@currentBranch (otmux@<branch>), asserted in M3.
// [test:uuid:3d82c2c8-d896-4fac-85c6-202178f4b186] R30.38 GitApi.currentBranch a2cbd78e - /api/git/current-branch?repo=oosh resolves the Save target branch (feeds the header).
// (RbDiffEditor.save a88b2b53) now writes the merged Result to the DIFF'S repo (?repo=oosh), not rawbin → no 404.
// ANTI-CIRCULAR (measured DIFFERENTLY than the expert's curl/playwright proof) + STRICTLY NON-DESTRUCTIVE (a real save
// WRITES the served oosh working tree — the server even appends a byte per write — so this gate NEVER does a real save):
//   M1 SERVER repo-resolution (NON-WRITING): PUT ?repo=oosh with a STALE expectedMtime → 409 (otmux exists in oosh, the
//      mtime guard aborts BEFORE any write) vs no-repo → 404 control. 409-not-404 proves the save routes to the correct repo.
//   M2 BOTH BUTTONS (#tb-save toolbar + .de-save 3-Way 💾) thread ?repo=oosh + show 'saved' — via route-intercept so the
//      real merged-content write never hits disk (non-destructive by construction); assert the captured PUT url carries repo=oosh.
//   M3 center header shows 'otmux@<currentBranch>' (setCenterTitle 41504f5f + GitApi.currentBranch a2cbd78e).
// DET-3x, screenshot the toolbar. SystemTester-only.
import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
const BASE = 'https://prod.wo-da.de:4444';
const DEEP = `${BASE}/edit/otmux?repo=oosh&left=mcdonges.latest&right=dev&3way=1`;
const OUT = 'test-results/r3035-save404';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const rows = [];
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1300, height: 900 } });
    await seedSystemTester(ctx);
    const page = await ctx.newPage();
    await page.goto(DEEP, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => !!customElements.get('rb-diff-editor'), { timeout: 20000 }).catch(() => {});
    await page.waitForSelector('.de-save', { timeout: 20000 }).catch(() => {});
    await page.waitForFunction(() => (document.querySelector('rb-diff-editor')?.edCenter?.getValue?.()?.length || 0) > 0, { timeout: 20000 }).catch(() => {});
    await sleep(1200);

    // ── M1: server repo-resolution, NON-WRITING (stale expectedMtime → the mtime guard aborts BEFORE any write):
    //     ?repo=oosh → 409 (otmux EXISTS in the oosh repo, mtime mismatch, no write) proves the save routes to the
    //     correct repo; NO ?repo → 404 (rawbin has no otmux) is the control. Neither writes → truly non-destructive.
    //     A 409 (not 404) means a correct-mtime save WOULD 200 there — the fix's job (route to the right repo) is proven. ──
    const STALE = '1970-01-01T00:00:00.000Z';
    const m1 = await page.evaluate(async (stale) => {
      const put = async (u) => { try { const r = await fetch(u, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: '__RB_SAVE_PROBE__DO_NOT_WRITE__', expectedMtime: stale }) }); return r.status; } catch { return 0; } };
      return { putRepoStatus: await put('/api/files/otmux?repo=oosh'), putNoRepoStatus: await put('/api/files/otmux') };
    }, STALE);

    // ── M2: BOTH buttons thread ?repo=oosh + 'saved' — route-intercept so no real merged write lands ──
    let lastPut = null;
    await page.route('**/api/files/otmux**', route => {
      const req = route.request();
      if (req.method() === 'PUT') { lastPut = req.url(); route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"mtime":"2026-01-01T00:00:00Z"}' }); }
      else route.continue();
    });
    const deStatus = () => page.evaluate(() => (document.querySelector('rb-diff-editor .de-status')?.textContent || '').trim());

    lastPut = null;
    await page.click('rb-diff-editor .de-save', { timeout: 8000 }).catch(() => {});   // the 3-Way 💾
    await sleep(1000);
    const btnDiff = { url: lastPut, status: await deStatus() };

    lastPut = null;
    await page.click('#tb-save', { timeout: 8000 }).catch(() => {});                   // the toolbar Save
    await sleep(1000);
    const btnToolbar = { url: lastPut, status: await deStatus() };

    if (i === 1) await page.screenshot({ path: `${OUT}/toolbar-after-save-FIXED-iter1.png`, clip: { x: 0, y: 0, width: 1300, height: 120 } }).catch(() => {});

    // ── M3: center header otmux@<branch> ──
    const centerTitle = await page.evaluate(() => (document.querySelector('rb-diff-editor .de-center .de-title')?.textContent || '').trim());

    const okRepo = (u) => !!u && /[?&]repo=oosh/.test(u);
    const savedTxt = (s) => /saved/i.test(s) && !/fail|not found|404/i.test(s);
    const serverOk = m1.putRepoStatus === 409 && m1.putNoRepoStatus === 404; // repo=oosh resolves to the real otmux (409, no write); no-repo → 404
    const bothButtons = okRepo(btnDiff.url) && savedTxt(btnDiff.status) && okRepo(btnToolbar.url) && savedTxt(btnToolbar.status);
    const headerOk = /otmux@\S+/.test(centerTitle);
    const pass = serverOk && bothButtons && headerOk;
    rows.push(pass);
    console.log(`iter ${i}: SERVER(repo→409 norepo→404, non-writing)=${serverOk}(${m1.putRepoStatus}/${m1.putNoRepoStatus}) | 💾=${okRepo(btnDiff.url)}+"${btnDiff.status}" | toolbar=${okRepo(btnToolbar.url)}+"${btnToolbar.status}" | header="${centerTitle}"(${headerOk}) => ${pass ? 'GREEN' : 'RED'}`);
    await page.unroute('**/api/files/otmux**').catch(() => {});
    await ctx.close();
  }
} finally { await browser.close(); }

console.log('\n===== R30.35 save-404 FIX on Tron deep-link (v0.7.61, DET-3x) =====');
rows.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = rows.length === 3 && rows.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x (Save succeeds ?repo=oosh→200 both buttons, no 404, header@branch, non-destructive)' : 'RED');
process.exitCode = green ? 0 : 1;
