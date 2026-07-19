// [test:uuid:d3d9f8f5-c85b-487a-baa7-c276ec0ee4ee] R30.39 RbDiffEditor.populateRepos 2b7edf20 — a ?repo=oosh deep-link seeds BOTH the left AND right .de-repo selectors to 'oosh' on load, no manual set (AC-seed-both / AC-no-manual).
// [test:uuid:48cf6080-491c-4b5c-ab6c-ed4e0d5dde17] R30.39 RbDiffEditor.populateHistory 0360d7e2 — on the ?repo deep-link the LEFT .de-history fills identically to a manual switch (git log --follow entries present), and the deep-link refs stay INTACT (no promote/auto-load clobber).
// [test:uuid:9a59921f-36b6-4ee1-8b20-588a7311594f] R30.40 RepoRegistry.ROOTS.oosh 9b95b458 — the CENTER header reads otmux@<current branch of whatever ~/oosh resolves to>, verified DYNAMICALLY == `git -C $(readlink -f ~/oosh) branch --show-current` (tracks oo-mode; NOT hardcoded, NOT the wrong dev-teampush-astray).
// Tron's 2 bugs (A repo-seed-both, B header-branch) + refs-intact + history-fill, on the REAL deep-link
// /edit/otmux?repo=oosh&left=516ebb3&right=dev&3way=1 (v0.7.63, edit-SHUJANVB.js). DET-3x, screenshots. SystemTester, read-only.
import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
const BASE = 'https://prod.wo-da.de:4444';
const DEEP = `${BASE}/edit/otmux?repo=oosh&left=516ebb3&right=dev&3way=1`;
const OUT = 'test-results/r3041-repo-branch';
const EXPECT_BRANCH = (process.env.OOSH_BRANCH || '').trim();   // dynamic: git -C $(readlink -f ~/oosh) branch --show-current
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
if (!EXPECT_BRANCH) { console.log('FATAL: OOSH_BRANCH env not set'); process.exit(2); }

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const rows = [];
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1300, height: 900 } });
    await seedSystemTester(ctx);
    const page = await ctx.newPage();
    await page.goto(DEEP, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => !!customElements.get('rb-diff-editor'), { timeout: 25000 }).catch(() => {});
    await page.waitForFunction(() => (document.querySelector('rb-diff-editor')?.edCenter?.getValue?.()?.length || 0) > 0, { timeout: 25000 }).catch(() => {});
    await sleep(1800); // allow the history-fill to complete on load

    const st = await page.evaluate(() => {
      const e = document.querySelector('rb-diff-editor');
      const repos = [...document.querySelectorAll('rb-diff-editor .de-repo')].map(s => ({ side: s.dataset.side || '?', value: (s.value || '').trim() }));
      const hist = document.querySelector('rb-diff-editor .de-history');
      const opts = hist ? [...hist.options].map(o => (o.textContent || '').trim()) : [];
      return {
        repos,
        header: (document.querySelector('rb-diff-editor .de-center .de-title')?.textContent || '').trim(),
        historyCount: opts.length, historyFirst: opts[0] || '', historyNoHist: opts.some(o => /no history/i.test(o)),
        leftRef: e?.left?.ref || '', rightRef: e?.right?.ref || '',
        leftTitle: (document.querySelector('rb-diff-editor .de-local .de-title')?.textContent || '').trim(),
        rightTitle: (document.querySelector('rb-diff-editor .de-remote .de-title')?.textContent || '').trim(),
      };
    });
    if (i === 1) await page.screenshot({ path: `${OUT}/repo-branch-iter1.png`, clip: { x: 0, y: 0, width: 1300, height: 150 } }).catch(() => {});

    const left = st.repos.find(r => r.side === 'left'), right = st.repos.find(r => r.side === 'right');
    const bothSeeded = (left?.value || '').toLowerCase() === 'oosh' && (right?.value || '').toLowerCase() === 'oosh';   // (1) 2b7edf20
    const historyPopulated = st.historyCount > 5 && !st.historyNoHist;                                                 // (2) 0360d7e2 (expert saw 80)
    const refsIntact = st.leftRef === '516ebb3' && st.rightRef === 'dev';                                              // (4) 0360d7e2 — not clobbered
    const headerCorrect = st.header === `otmux@${EXPECT_BRANCH}`;                                                      // (3) 9b95b458 dynamic

    const pass = bothSeeded && historyPopulated && refsIntact && headerCorrect;
    rows.push(pass);
    console.log(`iter ${i}: (1)both-oosh=${bothSeeded}(L=${left?.value} R=${right?.value}) | (2)history=${historyPopulated}(${st.historyCount} opts, first="${st.historyFirst.slice(0, 40)}") | (4)refs-intact=${refsIntact}(L=${st.leftRef} R=${st.rightRef}) | (3)header=${headerCorrect}("${st.header}" vs "otmux@${EXPECT_BRANCH}") => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }
} finally { await browser.close(); }

console.log('\n===== Tron bugs A/B + history + refs (DET-3x, v0.7.63) =====');
console.log(`  dynamic expected branch: ${EXPECT_BRANCH}`);
rows.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = rows.length === 3 && rows.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x (both=oosh + history-filled + refs-intact + header=otmux@<real branch>)' : 'RED');
process.exitCode = green ? 0 : 1;
