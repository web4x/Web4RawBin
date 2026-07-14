// [test:uuid:c1a2e5b7-6f30-4d18-9a7c-3e8b1f0d24a9] R30.9/R30.10/R30.12 3-way merge VISUAL proof — Tron screenshot request
// CASE 1 (R30.12): README.md current vs FIRST version (f552593, via file-history) → 2-way TAKE-OVER now WIRED
//   (computeTwoWayHunks def2c0f2, v0.7.20). ◄/► arrows render; ► pulls the first-version line into CENTER. DET-3x.
//   (Was the RED baseline in case1-02: the click did nothing. Now flips GREEN.)
// CASE 2 (R30.9/R30.10): two DIVERGENT refs sharing a real base → true base-aware 3-way (IntelliJ parity: color-coded
//   conflict, per-conflict gutter chevrons ◄/►, ✨Apply-All-Non-Conflicting, base-merged center, accept ► into center).
// SystemTester (fixed token ce981242, seeded pre-goto) — ZERO prod pollution. Screenshots → test-results/merge-visual/.
// CASE 2 refs are LOCAL git fixtures (plumbing, no working-tree/main touch) resolved by the live server's git APIs; torn down after.

import { execSync } from 'child_process';
import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import fs from 'fs';
import path from 'path';

const REPO = '/var/dev/Workspaces/web4x/Web4RawBin';
const BASE = 'https://prod.wo-da.de:4444';
const OUT = path.join(REPO, 'test-results/merge-visual');
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const shot = async (page, name) => { const p = path.join(OUT, name); await page.locator('rb-diff-editor').screenshot({ path: p }).catch(async () => { await page.screenshot({ path: p }); }); return p; };

// ---- CASE 2 fixture: BASE + two divergent branches editing merge-demo.md (real merge-base) ----
// Non-conflicting changes (TWO-local, FOUR-remote) are isolated from the conflict (six) by unchanged anchor lines.
const DEMO = 'merge-demo.md';
const baseC   = `# Merge Demo\none\ntwo\nthree\nfour\nfive\nsix\nseven\n`;
const localC  = `# Merge Demo\none\nTWO-local\nthree\nfour\nfive\nSIX-LOCAL\nseven\n`;
const remoteC = `# Merge Demo\none\ntwo\nthree\nFOUR-remote\nfive\nSIX-REMOTE\nseven\n`;
const genv = { ...process.env, GIT_AUTHOR_NAME: 'robbin-tester', GIT_AUTHOR_EMAIL: 'tester@wo-da.de', GIT_COMMITTER_NAME: 'robbin-tester', GIT_COMMITTER_EMAIL: 'tester@wo-da.de', GIT_AUTHOR_DATE: '2026-01-01T00:00:00', GIT_COMMITTER_DATE: '2026-01-01T00:00:00' };
const g = (args, input) => execSync(`git -C ${REPO} ${args}`, { encoding: 'utf8', input, env: genv }).trim();
const blob = (c) => g('hash-object -w --stdin', c);
const tree = (b) => g('mktree', `100644 blob ${b}\t${DEMO}\n`);
function setupFixture() {
  const bc = g(`commit-tree ${tree(blob(baseC))} -m base`);
  const lc = g(`commit-tree ${tree(blob(localC))} -p ${bc} -m local-edit`);
  const rc = g(`commit-tree ${tree(blob(remoteC))} -p ${bc} -m remote-edit`);
  g(`update-ref refs/heads/rb-merge-base ${bc}`); g(`update-ref refs/heads/rb-merge-local ${lc}`); g(`update-ref refs/heads/rb-merge-remote ${rc}`);
  return { bc, lc, rc };
}
function teardownFixture() { for (const r of ['rb-merge-base', 'rb-merge-local', 'rb-merge-remote']) { try { g(`update-ref -d refs/heads/${r}`); } catch {} } }

// open README.md in the diff editor + default RIGHT to its oldest (first) version
async function openReadmeVsFirstVersion(page) {
  await page.goto(`${BASE}/edit/README.md`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#tb-diff', { timeout: 20000 });
  await page.evaluate(() => document.querySelector('#tb-diff')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await page.waitForFunction(() => !!document.querySelector('rb-diff-editor .de-history'), { timeout: 20000 }).catch(() => {});
  await sleep(2500);
  const pick = await page.evaluate(() => {
    const s = document.querySelector('rb-diff-editor .de-history');
    if (!s) return { ok: false };
    const opts = [...s.querySelectorAll('option')];
    const last = opts[opts.length - 1]; // OLDEST = first/initial version
    s.value = last.value; s.dispatchEvent(new Event('change', { bubbles: true }));
    return { ok: true, n: opts.length, oldest: (last.value || '').slice(0, 8) };
  });
  await sleep(3000); // loadSide(right@oldest) + computeMergedCenter → computeTwoWayHunks
  return pick;
}

const R = { case1: [], case2: {}, shots: [] };
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
try {
  const fx = setupFixture();
  console.log(`fixture refs: base=${fx.bc.slice(0,8)} local=${fx.lc.slice(0,8)} remote=${fx.rc.slice(0,8)}`);

  // ============ CASE 1 — 2-way TAKE-OVER now WIRED (R30.12) — DET-3x RED→GREEN flip ============
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1600, height: 1000 } });
    await seedSystemTester(ctx);
    const page = await ctx.newPage();
    const pick = await openReadmeVsFirstVersion(page);

    // (1) take-over controls RENDER now (computeTwoWayHunks populates conflicts[]) + capture hunk#0 first-version lines
    const render = await page.evaluate(() => {
      const el = document.querySelector('rb-diff-editor');
      const h0 = (el?.conflicts || [])[0] || null;
      const before = el?.edCenter?.getValue?.() || '';
      return {
        twoWay: el?.twoWay, nhunks: (el?.conflicts || []).length,
        arrows: document.querySelectorAll('rb-diff-editor .de-accept').length,
        takeoverLabel: /take-?over/i.test(document.querySelector('rb-diff-editor .de-accept-bar')?.textContent || ''),
        status: (document.querySelector('rb-diff-editor .de-status')?.textContent || '').trim(),
        remoteTitle: (document.querySelector('rb-diff-editor .de-remote .de-title')?.textContent || '').trim(),
        versionLines: h0 ? h0.b : [], localLines: h0 ? h0.a : [],
        beforeHasVersion: h0 && (h0.b || []).length ? (h0.b).every(l => before.includes(l)) : false,
      };
    });
    if (i === 1) R.shots.push(await shot(page, 'case1-03-takeover-before.png'));

    // (2)+(3) click ► (Repository/first-version) on hunk#0 → pull the first-version line INTO CENTER (the click that did nothing before)
    const take = await page.evaluate(async () => {
      const el = document.querySelector('rb-diff-editor');
      const h0 = (el?.conflicts || [])[0] || null;
      const versionLines = h0 ? h0.b : [];
      const before = el?.edCenter?.getValue?.() || '';
      const btn = document.querySelector('rb-diff-editor .de-accept[data-cid="0"][data-side="right"]');
      let clicked = false;
      if (btn) { btn.dispatchEvent(new MouseEvent('click', { bubbles: true })); clicked = true; await new Promise(r => setTimeout(r, 500)); }
      const after = el?.edCenter?.getValue?.() || '';
      return { hadControl: !!btn, clicked, changed: before !== after,
        pulledIn: versionLines.length > 0 && versionLines.every(l => after.includes(l)),
        versionSample: (versionLines[0] || '').slice(0, 40), localSample: ((h0 ? h0.a : [])[0] || '').slice(0, 40) };
    });
    if (i === 1) R.shots.push(await shot(page, 'case1-04-takeover-after.png'));

    const pass = pick.ok && render.twoWay === true && render.nhunks >= 1 && render.arrows >= 2
      && !render.beforeHasVersion && take.hadControl && take.clicked && take.changed && take.pulledIn;
    R.case1.push({ pass, pick, render, take });
    console.log(`CASE1 iter ${i}: 2way=${render.twoWay} hunks=${render.nhunks} arrows=${render.arrows} takeoverLabel=${render.takeoverLabel} | ►clicked=${take.clicked} centerChanged=${take.changed} pulledInFirstVersion=${take.pulledIn} ("${take.localSample}"→"${take.versionSample}") => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }

  // ============ CASE 2 — true 3-way divergent (IntelliJ parity) — single proof ============
  const ctx2 = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1600, height: 1000 } });
  await seedSystemTester(ctx2);
  const page2 = await ctx2.newPage();
  await page2.goto(`${BASE}/edit/README.md`, { waitUntil: 'networkidle' });
  await page2.waitForSelector('#tb-diff', { timeout: 20000 });
  await page2.evaluate(() => document.querySelector('#tb-diff')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await page2.waitForFunction(() => !!document.querySelector('rb-diff-editor'), { timeout: 20000 }).catch(() => {});
  await sleep(2000);
  await page2.evaluate(async (demo) => {
    const el = document.querySelector('rb-diff-editor');
    await el.loadSide('left', { path: demo, ref: 'rb-merge-local' });
    await el.loadSide('right', { path: demo, ref: 'rb-merge-remote' });
    await el.computeMergedCenter();
  }, DEMO);
  for (let k = 0; k < 20; k++) { const ok = await page2.evaluate(() => { const el = document.querySelector('rb-diff-editor'); return el && el.right?.ref === 'rb-merge-remote' && el.base !== '' && (el.conflicts || []).length >= 1; }); if (ok) break; await sleep(300); }
  const c2 = await page2.evaluate(() => {
    const el = document.querySelector('rb-diff-editor'); const center = el?.edCenter?.getValue?.() || '';
    return { twoWay: el?.twoWay, baseResolved: (el?.base || '') !== '', conflicts: (el?.conflicts || []).length,
      chevrons: document.querySelectorAll('rb-diff-editor .de-accept').length,
      conflictDecos: document.querySelectorAll('rb-diff-editor .de-conflict-line, rb-diff-editor .de-conflict-glyph, rb-diff-editor .de-conflict-gutter').length,
      autoAppliedLocal: center.includes('TWO-local'), autoAppliedRemote: center.includes('FOUR-remote'),
      status: (document.querySelector('rb-diff-editor .de-status')?.textContent || '').trim() };
  });
  R.case2.merged = c2;
  R.shots.push(await shot(page2, 'case2-01-3way-base-merged-conflict.png'));
  await page2.evaluate(() => document.querySelector('rb-diff-editor .de-apply-all')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await sleep(1200);
  R.shots.push(await shot(page2, 'case2-02-apply-all-nonconflicting.png'));
  const c2acc = await page2.evaluate(async () => {
    const el = document.querySelector('rb-diff-editor'); const before = el?.edCenter?.getValue?.() || '';
    document.querySelector('rb-diff-editor .de-accept[data-cid="0"][data-side="right"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await new Promise(r => setTimeout(r, 500)); const after = el?.edCenter?.getValue?.() || '';
    return { after: after.includes('SIX-REMOTE') && !after.includes('SIX-LOCAL'), changed: before !== after };
  });
  R.case2.accept = c2acc;
  R.shots.push(await shot(page2, 'case2-03-accept-right-into-center.png'));
  await ctx2.close();
} finally {
  teardownFixture();
  await browser.close();
}

// ---- verdicts ----
const c1green = R.case1.length === 3 && R.case1.every(r => r.pass);
const c2 = R.case2;
const case2Pass = c2.merged?.baseResolved && c2.merged?.twoWay === false && c2.merged?.conflicts >= 1 && c2.merged?.chevrons >= 2 && c2.merged?.autoAppliedLocal && c2.merged?.autoAppliedRemote && c2.accept?.after;

console.log('\n===== CASE 1 — 2-way TAKE-OVER wired (R30.12) DET-3x =====');
R.case1.forEach((r, i) => console.log(`  iter ${i + 1}: ${r.pass ? 'GREEN' : 'RED'} (arrows=${r.render.arrows} pulledInFirstVersion=${r.take.pulledIn})`));
console.log(`  remoteTitle="${R.case1[0]?.render.remoteTitle}" status="${R.case1[0]?.render.status}"`);
console.log(`  => CASE1 ${c1green ? 'GREEN DET-3x (RED→GREEN flip confirmed — ► now pulls first-version into center)' : 'RED'}`);

console.log('\n===== CASE 2 — true 3-way divergent (IntelliJ parity) =====');
console.log(`  baseResolved=${c2.merged?.baseResolved} twoWay=${c2.merged?.twoWay} conflicts=${c2.merged?.conflicts} chevrons=${c2.merged?.chevrons} | auto: LOCAL=${c2.merged?.autoAppliedLocal} REMOTE=${c2.merged?.autoAppliedRemote} | accept►=${c2.accept?.after}`);
console.log(`  => CASE2 ${case2Pass ? 'GREEN' : 'RED'}`);

console.log('\n===== SCREENSHOTS =====');
R.shots.forEach(s => console.log('  ' + s));
console.log(`\nOVERALL: CASE1=${c1green ? 'GREEN DET-3x' : 'RED'} CASE2=${case2Pass ? 'GREEN' : 'RED'}`);
process.exitCode = (c1green && case2Pass) ? 0 : 1;
