// R30.38 follow-up — Tron's 2 bugs on the REAL deep-link /edit/otmux?repo=oosh&left=516ebb3&right=dev&3way=1 (v0.7.61+):
// (A) ?repo=oosh must seed BOTH the LEFT and RIGHT repo selectors (.de-repo) to OOSH on load — Tron had to set both
//     manually; currently the RIGHT selector stays 'RawBin'.
// (B) the CENTER header must read otmux@<current branch of the oosh repo>, verified DYNAMICALLY against the real
//     `git branch --show-current` (passed in via OOSH_BRANCH, NOT hardcoded); currently it wrongly shows an arbitrary branch.
// DET-3x, screenshots. SystemTester, read-only (no writes).
import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
const BASE = 'https://prod.wo-da.de:4444';
const DEEP = `${BASE}/edit/otmux?repo=oosh&left=516ebb3&right=dev&3way=1`;
const OUT = 'test-results/r3041-repo-branch';
const EXPECT_BRANCH = (process.env.OOSH_BRANCH || '').trim();   // dynamic ground truth: git -C <oosh> branch --show-current
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
if (!EXPECT_BRANCH) { console.log('FATAL: OOSH_BRANCH env not set (pass the real git branch)'); process.exit(2); }

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
    await sleep(1500);

    const state = await page.evaluate(() => {
      const repos = [...document.querySelectorAll('rb-diff-editor .de-repo')].map(s => ({ side: s.dataset.side || '?', value: (s.value || '').trim() }));
      return { repos, header: (document.querySelector('rb-diff-editor .de-center .de-title')?.textContent || '').trim() };
    });
    if (i === 1) await page.screenshot({ path: `${OUT}/repo-branch-iter1.png`, clip: { x: 0, y: 0, width: 1300, height: 130 } }).catch(() => {});

    const left = state.repos.find(r => r.side === 'left');
    const right = state.repos.find(r => r.side === 'right');
    // (A) BOTH selectors seeded to oosh
    const leftSeeded = (left?.value || '').toLowerCase() === 'oosh';
    const rightSeeded = (right?.value || '').toLowerCase() === 'oosh';
    const bothSeeded = leftSeeded && rightSeeded;
    // (B) header == otmux@<real current branch> (dynamic)
    const headerCorrect = state.header === `otmux@${EXPECT_BRANCH}`;

    const pass = bothSeeded && headerCorrect;
    rows.push(pass);
    console.log(`iter ${i}: (A) repo-seed L=${left?.value}(${leftSeeded}) R=${right?.value}(${rightSeeded}) bothOOSH=${bothSeeded} | (B) header="${state.header}" expect="otmux@${EXPECT_BRANCH}" correct=${headerCorrect} => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }
} finally { await browser.close(); }

console.log('\n===== Tron bugs (A) repo-seed-both + (B) header-branch (DET-3x) =====');
console.log(`  expected branch (dynamic git): ${EXPECT_BRANCH}`);
rows.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = rows.length === 3 && rows.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x (both selectors=oosh + header=otmux@<real branch>)' : 'RED (bug(s) reproduce)');
process.exitCode = green ? 0 : 1;
