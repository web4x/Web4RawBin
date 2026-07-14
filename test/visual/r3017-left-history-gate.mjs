// [test:uuid:4dca421e-1702-4ecd-bb5a-3e2dc3ebd7a9] R30.17 RbDiffEditor.populateLeftHistory (Impl 751934c1, supersedes populateRightHistory 58c11039) — file-history selector on the LOCAL pane; Open-Diff promotes working→RIGHT, LEFT auto-defaults to older-that-DIFFERS (HEAD~1 when clean) → non-zero diff older-on-LEFT; explicit LEFT pick wins (_leftUserPicked)
// [test:uuid:9f755c32-12da-4d24-bc39-8e0c0a775120] R30.17 RbDiffEditor.renderInterPaneGutters one-sided origin-gating (Impl fd99c520, R30.17 TRON2/3) — ≫ (Take Local) shows ONLY where the hunk has local lines (a>0), ≪ (Take Repository) ONLY where it has repo lines (b>0) → a one-sided change shows an arrow on ONE side only
// R30.17 (v0.7.27, hash edit-53EHOESP.js). Behavior-first, DET-3x, SystemTester. Fixture refs = local git plumbing, torn down.

import { execSync } from 'child_process';
import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
const REPO = '/var/dev/Workspaces/web4x/Web4RawBin', BASE = 'https://prod.wo-da.de:4444';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const genv = { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@x', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@x', GIT_AUTHOR_DATE: '2026-01-01T00:00:00', GIT_COMMITTER_DATE: '2026-01-01T00:00:00' };
const g = (a, i) => execSync(`git -C ${REPO} ${a}`, { encoding: 'utf8', input: i, env: genv }).trim();
const blob = (c) => g('hash-object -w --stdin', c);
const treeFor = (path, b) => g('mktree', `100644 blob ${b}\t${path}\n`);
// one-sided fixture: two UNRELATED commits (no common base → 2-way computeTwoWayHunks) with a del-only + add-only hunk
const ONE = 'oneside.md';
const localC = `line1\nDEL-ONLY-LOCAL\nline2\nline3\nline4\n`, verC = `line1\nline2\nline3\nADD-ONLY-VERSION\nline4\n`;
function setup() { const lc = g(`commit-tree ${treeFor(ONE, blob(localC))} -m l`); const rc = g(`commit-tree ${treeFor(ONE, blob(verC))} -m r`); g(`update-ref refs/heads/rb-oneside-local ${lc}`); g(`update-ref refs/heads/rb-oneside-version ${rc}`); }
function teardown() { for (const b of ['rb-oneside-local', 'rb-oneside-version']) { try { g(`update-ref -d refs/heads/${b}`); } catch {} } }

async function openDiff(page, file) {
  await page.goto(`${BASE}/edit/${file}`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#tb-diff', { timeout: 20000 });
  await page.evaluate(() => document.querySelector('#tb-diff')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await page.waitForFunction(() => !!document.querySelector('rb-diff-editor .de-count'), { timeout: 20000 }).catch(() => {});
}

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const A = [], B = [];
try {
  setup();
  for (let i = 1; i <= 3; i++) {
    // ---- PART A: populateLeftHistory — clean file Open-Diff → LEFT older-default HEAD~1, history on LOCAL, pick-wins ----
    {
      const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1500, height: 950 } });
      await seedSystemTester(ctx); const page = await ctx.newPage();
      await openDiff(page, 'README.md');
      await sleep(4000); // loadSide(left working) → populateLeftHistory (promote right, fill left history, load older default)
      const m = await page.evaluate(() => {
        const el = document.querySelector('rb-diff-editor');
        const localSel = document.querySelector('rb-diff-editor .de-local .de-history');
        const opts = localSel ? [...localSel.querySelectorAll('option')].map(o => o.value) : [];
        return { historyOnLocal: !!localSel, optCount: opts.length, histNewest: opts[0] || '', histSecond: opts[1] || '',
          leftRef: el.left?.ref || '', rightIsWorking: !el.right?.ref, leftEqRight: el.left.content === el.right.content,
          hunks: (el.conflicts || []).length, leftUserPicked: el._leftUserPicked };
      });
      // clean README: newest(HEAD)==working → LEFT auto-defaults to HEAD~1 (histSecond) → older-on-left + non-zero diff
      const meaningfulDefault = m.optCount > 1 && m.leftRef === m.histSecond && m.leftRef !== m.histNewest;
      const nonZero = m.hunks > 0 && !m.leftEqRight;
      // pick an OLDER left ref → survives (_leftUserPicked)
      const picked = await page.evaluate(() => { const s = document.querySelector('rb-diff-editor .de-local .de-history'); const o = [...s.querySelectorAll('option')]; const oldest = o[o.length - 1]; s.value = oldest.value; s.dispatchEvent(new Event('change', { bubbles: true })); return oldest.value; });
      await sleep(3500);
      const pk = await page.evaluate(() => { const el = document.querySelector('rb-diff-editor'); return { leftRef: el.left?.ref || '', leftUserPicked: el._leftUserPicked }; });
      const pickWins = pk.leftRef === picked && pk.leftUserPicked === true;
      const pass = m.historyOnLocal && meaningfulDefault && m.rightIsWorking && nonZero && !m.leftUserPicked && pickWins;
      A.push({ pass, m, pickWins });
      console.log(`A iter ${i} (left-history): histOnLocal=${m.historyOnLocal} leftRef=${m.leftRef.slice(0, 8)}(newest=${m.histNewest.slice(0, 8)} 2nd=${m.histSecond.slice(0, 8)}) meaningfulDefault=HEAD~1:${meaningfulDefault} rightIsWorking=${m.rightIsWorking} nonZeroDiff=${nonZero} pickWins=${pickWins} => ${pass ? 'GREEN' : 'RED'}`);
      await ctx.close();
    }
    // ---- PART B: one-sided arrows — del-only → ≫ only (no ≪); add-only → ≪ only (no ≫) ----
    {
      const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1500, height: 950 } });
      await seedSystemTester(ctx); const page = await ctx.newPage();
      await openDiff(page, 'README.md');
      await sleep(1200);
      await page.evaluate(async (o) => { const el = document.querySelector('rb-diff-editor'); await el.loadSide('left', { path: o, ref: 'rb-oneside-local' }); await el.loadSide('right', { path: o, ref: 'rb-oneside-version' }); await el.computeMergedCenter(); }, ONE);
      for (let k = 0; k < 20; k++) { const ok = await page.evaluate(() => (document.querySelector('rb-diff-editor').conflicts || []).length >= 2); if (ok) break; await sleep(300); }
      await page.evaluate(async () => { const el = document.querySelector('rb-diff-editor'); if (el?.edCenter) { el.edCenter.setScrollTop(20); await new Promise(r => setTimeout(r, 200)); el.edCenter.setScrollTop(0); } });
      await sleep(600);
      const m = await page.evaluate(() => {
        const el = document.querySelector('rb-diff-editor'); const cs = el.conflicts || [];
        const del = cs.find(c => c.a.length > 0 && c.b.length === 0);  // one-sided delete
        const add = cs.find(c => c.a.length === 0 && c.b.length > 0);  // one-sided add
        const arrow = (cid, act) => cid == null ? null : !!document.querySelector(`rb-diff-editor [data-cid="${cid}"][data-act="${act}"]`);
        return { twoWay: el.twoWay, hunks: cs.length,
          delId: del?.id, del_hasTakeLocal: arrow(del?.id, 'left'), del_hasTakeRepo: arrow(del?.id, 'right'),
          addId: add?.id, add_hasTakeLocal: arrow(add?.id, 'left'), add_hasTakeRepo: arrow(add?.id, 'right') };
      });
      // del-only (a>0,b=0): ≫(left) present, ≪(right) ABSENT | add-only (a=0,b>0): ≫ ABSENT, ≪ present
      const delOneSided = m.delId != null && m.del_hasTakeLocal === true && m.del_hasTakeRepo === false;
      const addOneSided = m.addId != null && m.add_hasTakeLocal === false && m.add_hasTakeRepo === true;
      const pass = delOneSided && addOneSided;
      B.push({ pass, m });
      console.log(`B iter ${i} (one-sided arrows): del(a>0,b=0) ≫=${m.del_hasTakeLocal}/≪=${m.del_hasTakeRepo}=>oneSided:${delOneSided} | add(a=0,b>0) ≫=${m.add_hasTakeLocal}/≪=${m.add_hasTakeRepo}=>oneSided:${addOneSided} => ${pass ? 'GREEN' : 'RED'}`);
      await ctx.close();
    }
  }
} finally { teardown(); await browser.close(); }

const aG = A.length === 3 && A.every(r => r.pass), bG = B.length === 3 && B.every(r => r.pass);
console.log('\n===== R30.17 left-history + one-sided arrows (DET-3x) =====');
console.log(`  (A) populateLeftHistory — older-left + meaningful-default HEAD~1 + pick-wins: ${aG ? 'GREEN' : 'RED'}`);
console.log(`  (B) one-sided origin-gated arrows — one change → one arrow: ${bG ? 'GREEN' : 'RED'}`);
const green = aG && bG;
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
