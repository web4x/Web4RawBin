// [test:uuid:553f77d2-8fa4-4e6f-b69a-cbcee31d3b6f] R30.15 RbDiffEditor.populateRightHistory NEW behavior (Impl 58c11039, distinct from R30.10's test):
//   (a) MEANINGFUL-DEFAULT — a CLEAN file (working==HEAD) Open-Diff defaults RIGHT to the newest version that DIFFERS
//       (HEAD~1, defaultIdx=1) → NON-ZERO diff (was Tron's '0 changes / no diff' cause when it defaulted to HEAD==working).
//   (b) PICK-WINS — an explicit RIGHT ref-pick during the async auto-default sets _rightUserPicked → survives, not clobbered.
// v0.7.24. DET-3x. SystemTester, read-only (GET only, no writes/pollution). Uses README.md (clean, top-level history).

import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
const BASE = 'https://prod.wo-da.de:4444';
const FILE = 'README.md';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function openDiff(page) {
  await page.goto(`${BASE}/edit/${FILE}`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#tb-diff', { timeout: 20000 });
  await page.evaluate(() => document.querySelector('#tb-diff')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await page.waitForFunction(() => !!document.querySelector('rb-diff-editor .de-history'), { timeout: 20000 }).catch(() => {});
}

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const A = [], B = [];
try {
  for (let i = 1; i <= 3; i++) {
    // ---- Part A: meaningful-default (clean file → non-zero diff, RIGHT = HEAD~1 not HEAD) ----
    {
      const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1500, height: 950 } });
      await seedSystemTester(ctx); const page = await ctx.newPage();
      await openDiff(page);
      await sleep(4000); // loadSide(left) → populateRightHistory (fetch newest, compare, auto-load default) settles
      const m = await page.evaluate(() => {
        const el = document.querySelector('rb-diff-editor');
        const opts = [...document.querySelectorAll('rb-diff-editor .de-history option')].map(o => o.value);
        const leftEq = el.left.content === el.right.content;
        return { rightRef: el.right?.ref || '', histNewest: opts[0] || '', histSecond: opts[1] || '', optCount: opts.length,
          leftIsWorking: !el.left.ref, twoWay: el.twoWay, hunks: (el.conflicts || []).length, leftEqRight: leftEq, userPicked: el._rightUserPicked };
      });
      // clean file: RIGHT auto-default should NOT be the newest (==working) → it's HEAD~1 (histSecond) → non-zero diff
      const nonZeroDiff = m.hunks > 0 && !m.leftEqRight;
      const defaultIsHeadMinus1 = m.optCount > 1 && m.rightRef === m.histSecond && m.rightRef !== m.histNewest;
      const pass = m.leftIsWorking && nonZeroDiff && defaultIsHeadMinus1 && !m.userPicked;
      A.push({ pass, m });
      console.log(`A iter ${i} (meaningful-default): rightRef=${m.rightRef.slice(0, 8)} newest=${m.histNewest.slice(0, 8)} 2nd=${m.histSecond.slice(0, 8)} hunks=${m.hunks} leftEqRight=${m.leftEqRight} default=HEAD~1:${defaultIsHeadMinus1} nonZero:${nonZeroDiff} => ${pass ? 'GREEN' : 'RED'}`);
      await ctx.close();
    }
    // ---- Part B: pick-wins (pick OLDER ref mid-load → survives) ----
    {
      const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1500, height: 950 } });
      await seedSystemTester(ctx); const page = await ctx.newPage();
      await openDiff(page);
      await sleep(600); // pick DURING the async auto-default window (race the populateRightHistory fetch)
      const picked = await page.evaluate(() => {
        const s = document.querySelector('rb-diff-editor .de-history');
        const opts = [...s.querySelectorAll('option')];
        const oldest = opts[opts.length - 1];             // explicit OLDER pick
        s.value = oldest.value; s.dispatchEvent(new Event('change', { bubbles: true }));
        return oldest.value;
      });
      await sleep(4000); // let any pending auto-default resolve — pick must WIN (not be clobbered)
      const m = await page.evaluate(() => { const el = document.querySelector('rb-diff-editor'); return { rightRef: el.right?.ref || '', userPicked: el._rightUserPicked }; });
      const pass = m.rightRef === picked && m.userPicked === true;
      B.push({ pass, m, picked });
      console.log(`B iter ${i} (pick-wins): picked=${picked.slice(0, 8)} rightRef=${m.rightRef.slice(0, 8)} userPicked=${m.userPicked} survived=${m.rightRef === picked} => ${pass ? 'GREEN' : 'RED'}`);
      await ctx.close();
    }
  }
} finally { await browser.close(); }

const aGreen = A.length === 3 && A.every(r => r.pass), bGreen = B.length === 3 && B.every(r => r.pass);
console.log('\n===== R30.15 populateRightHistory new behavior (DET-3x) =====');
console.log(`  (a) meaningful-default (clean→non-zero diff, RIGHT=HEAD~1): ${aGreen ? 'GREEN' : 'RED'}`);
console.log(`  (b) pick-wins (explicit older pick survives auto-default): ${bGreen ? 'GREEN' : 'RED'}`);
const green = aGreen && bGreen;
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
