// [test:uuid:158bdfc7-eef1-4ee3-9899-96fc521e69c9] R30.42 UC1 sentinel + UC2 openRepoManager (Impl bfb92645) — add-via-dialog UI flow: ➕ Add repository FIRST option opens the Repo Manager → add-local(.git)→registers+selects→Manage(repo@branch/path/worktrees)→Clone HIDDEN. GREEN DET-3x v0.7.71, pollution-safe (POST route-intercepted, live registry builtins-only).
// R30.42 add-via-dialog UI FLOW gate (UC1 sentinel + UC2 dialog), v0.7.71, on Tron's real deep-link.
// FLOW: .de-repo select → '➕ Add repository…' is the FIRST option (__add__) → opens the Repo Manager dialog →
//   ➕ Add local repository (.rm-path .git input + Validate&Add) → registers + SELECTS the new repo → Manage panel
//   (repo @ currentBranch / path / worktrees) → Clone section HIDDEN (V1). Screenshot, DET-3x.
// ★ POLLUTION-SAFE by construction (banked hard lesson: the add-local registry is Tron-visible-live + V1 has NO delete
//   endpoint → a real POST is irreversible without a server restart). So the polluting POST /api/git/repos is ROUTE-INTERCEPTED
//   (fulfilled 200, NEVER hits the live server) + the GET is shape-preservingly augmented so the new repo appears → the CLIENT
//   flow (registers+selects) is faithfully gated with ZERO live registration. The real server-side register is covered by R30.43
//   (r3043-uc4-add-local-gate). A final FRESH un-routed context asserts LIVE /api/git/repos == builtins-only (proof of no pollution).
import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
const BASE = 'https://prod.wo-da.de:4444';
const DEEP = `${BASE}/edit/otmux?repo=oosh&left=mcdonges.latest&right=dev&3way=1`;
const OUT = 'test-results/r3042-add-repo';
const MOCK_KEY = 'rb-uitest-mock', MOCK_LABEL = 'UI Test Mock';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const rows = [];
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1300, height: 900 } });
    await seedSystemTester(ctx);
    const page = await ctx.newPage();
    let registered = false, sawPost = false;
    // POLLUTION-SAFE intercept: POST → fulfilled 200 (no live register); GET → real response + mock appended once registered.
    await page.route('**/api/git/repos', async route => {
      if (route.request().method() === 'POST') { sawPost = true; registered = true; return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, key: MOCK_KEY, label: MOCK_LABEL }) }); }
      const resp = await route.fetch(); const j = await resp.json();
      const arr = Array.isArray(j) ? j : (j.repos || []);
      if (registered && !arr.some(r => r.key === MOCK_KEY)) arr.push({ key: MOCK_KEY, label: MOCK_LABEL, builtin: false, removable: true });
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(Array.isArray(j) ? arr : { ...j, repos: arr }) });
    });

    await page.goto(DEEP, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => !!customElements.get('rb-diff-editor'), { timeout: 20000 }).catch(() => {});
    await page.waitForFunction(() => { const s = document.querySelector('.de-repo[data-side="left"]'); return s && s.options.length > 1; }, { timeout: 20000 }).catch(() => {});

    // (1) '➕ Add repository…' is the FIRST option (value __add__)
    const opt0 = await page.evaluate(() => { const s = document.querySelector('.de-repo[data-side="left"]'); return { val: s?.options[0]?.value, txt: s?.options[0]?.textContent }; });
    const sentinelFirst = opt0.val === '__add__' && /add repositor/i.test(opt0.txt || '');

    // (2) select it → dialog opens
    await page.selectOption('.de-repo[data-side="left"]', '__add__').catch(() => {});
    await page.waitForSelector('.de-overlay .rm-path', { timeout: 10000 }).catch(() => {});
    await sleep(500);
    if (i === 1) await page.screenshot({ path: `${OUT}/dialog-opened-iter1.png`, clip: { x: 0, y: 0, width: 1300, height: 620 } }).catch(() => {});

    // (3) dialog structure: add-local inputs + Manage + Clone HIDDEN
    const dlg = await page.evaluate(() => {
      const w = document.querySelector('.de-overlay');
      const t = (w?.textContent || '');
      return {
        hasPath: !!w?.querySelector('.rm-path'), pathPlaceholder: w?.querySelector('.rm-path')?.getAttribute('placeholder') || '',
        hasLabel: !!w?.querySelector('.rm-label'), hasAdd: !!w?.querySelector('.rm-add'), hasManage: !!w?.querySelector('.rm-manage'),
        addLocalHeading: /add local repositor/i.test(t), manageHeading: /Manage/.test(t),
        cloneHidden: !/clone/i.test(t) && !w?.querySelector('.rm-clone,[class*="clone"]'),
      };
    });
    const structureOk = dlg.hasPath && /\.git/.test(dlg.pathPlaceholder) && dlg.hasLabel && dlg.hasAdd && dlg.hasManage && dlg.addLocalHeading && dlg.manageHeading && dlg.cloneHidden;

    // (5-first, read BEFORE the add auto-closes the dialog @700ms) Manage panel = repo @ branch / path (real read-only repo-info GET)
    await page.waitForFunction(() => { const m = document.querySelector('.de-overlay .rm-manage'); return m && m.textContent && !/loading/i.test(m.textContent) && /@/.test(m.textContent); }, { timeout: 10000 }).catch(() => {});
    const manageText = await page.evaluate(() => document.querySelector('.de-overlay .rm-manage')?.textContent || '');
    const manageOk = /@/.test(manageText) && manageText.length > 5 && !/loading|no info/i.test(manageText);

    // (4) add-local: enter a .git path → Validate & Add → registers (intercepted) + SELECTS the new repo.
    // The dialog AUTO-CLOSES 700ms after success → read .rm-status via a fast poll INSIDE that window.
    await page.fill('.de-overlay .rm-path', '/home/shared/EAMD.ucp/Components/com/ceruleanCircle/EAM/1_infrastructure/Once.sh/prod').catch(() => {});
    await page.fill('.de-overlay .rm-label', 'UI Test Mock').catch(() => {});
    await page.click('.de-overlay .rm-add').catch(() => {});
    await page.waitForFunction(() => /✓ added|✗/.test(document.querySelector('.de-overlay .rm-status')?.textContent || ''), { timeout: 3000 }).catch(() => {});
    const addStatus = await page.evaluate(() => document.querySelector('.de-overlay .rm-status')?.textContent || '');
    const registeredOk = sawPost && /✓ added:\s*rb-uitest-mock/i.test(addStatus);
    if (i === 1) await page.screenshot({ path: `${OUT}/after-add-iter1.png`, clip: { x: 0, y: 0, width: 1300, height: 620 } }).catch(() => {});
    // after the dialog auto-closes, the new repo is the selected repo on the left side (st.repo set + select value)
    await sleep(1000);
    const selectedOk = await page.evaluate((k) => { const e = document.querySelector('rb-diff-editor'); const sel = document.querySelector('.de-repo[data-side="left"]'); return e?.left?.repo === k || sel?.value === k; }, MOCK_KEY);

    const pass = sentinelFirst && structureOk && registeredOk && selectedOk && manageOk;
    rows.push({ pass, sentinelFirst, structureOk, registeredOk, selectedOk, manageOk, cloneHidden: dlg.cloneHidden, manageText: manageText.split('\n')[0] });
    console.log(`iter ${i}: sentinel-first=${sentinelFirst} | structure=${structureOk}(clone-hidden=${dlg.cloneHidden}) | registers=${registeredOk}("${addStatus}") | selects=${selectedOk} | manage=${manageOk}("${manageText.split('\n')[0]}") => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }

  // ── POLLUTION PROOF: fresh un-routed context → LIVE /api/git/repos must be builtins-only (I never sent a real POST) ──
  const vctx = await browser.newContext({ ignoreHTTPSErrors: true });
  const vpage = await vctx.newPage();
  await vpage.goto(`${BASE}/app`, { waitUntil: 'domcontentloaded' });
  const live = await vpage.evaluate(async () => { const j = await (await fetch('/api/git/repos')).json(); const a = Array.isArray(j) ? j : (j.repos || []); return a.map(r => r.key); });
  await vctx.close();
  const builtinsOnly = live.length === 2 && live.includes('rawbin') && live.includes('oosh') && !live.includes(MOCK_KEY);
  console.log(`\nPOLLUTION PROOF: live /api/git/repos = [${live.join(', ')}] → builtins-only=${builtinsOnly}`);
  rows.push({ pass: builtinsOnly, builtinsOnly });
} finally { await browser.close(); }

console.log('\n===== R30.42 add-via-dialog UI flow (DET-3x, v0.7.71, pollution-safe) =====');
const suite = rows.slice(0, 3);
const green = suite.length === 3 && suite.every(r => r.pass) && rows[3]?.builtinsOnly;
console.log(`  flow DET-3x: ${suite.map((r, i) => `${i + 1}:${r.pass ? 'G' : 'R'}`).join(' ')} | pollution-proof builtins-only=${rows[3]?.builtinsOnly}`);
console.log(`  screenshots: ${OUT}/dialog-opened-iter1.png + after-add-iter1.png`);
console.log('OVERALL:', green ? 'GREEN DET-3x (sentinel→chooser→add-local→registers+selects→Manage→Clone-hidden, pollution-safe)' : 'RED');
process.exitCode = green ? 0 : 1;
