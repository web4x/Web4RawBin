// [test:uuid:c1a2e5b7-6f30-4d18-9a7c-3e8b1f0d24a9] R30.9/R30.10 3-way merge VISUAL proof — Tron screenshot request
// CASE 1: README.md current vs FIRST version (f552593, via file-history) → 2-way no-merge-base take-over (Tron's exact shot).
// CASE 2: two DIVERGENT refs sharing a real base → true base-aware 3-way (IntelliJ parity: color-coded conflict,
//         per-conflict gutter chevrons ◄/►, ✨Apply-All-Non-Conflicting, center starts BASE-merged, accept ► pushes into center).
// SystemTester (fixed token ce981242, seeded pre-goto) — ZERO prod pollution. Screenshots → test-results/merge-visual/.
// CASE 2 refs are LOCAL git fixtures (git plumbing, no working-tree/main touch) resolved by the live server's git APIs; torn down after.

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
// Non-conflicting changes (TWO-local, FOUR-remote) are isolated from the conflict (six) by unchanged anchor lines,
// so diff3 keeps them as distinct auto-merge hunks + one true conflict (adjacent changes would merge into the conflict).
const DEMO = 'merge-demo.md';
const baseC   = `# Merge Demo\none\ntwo\nthree\nfour\nfive\nsix\nseven\n`;
const localC  = `# Merge Demo\none\nTWO-local\nthree\nfour\nfive\nSIX-LOCAL\nseven\n`;   // line3 (non-conflict) + line7 (conflict)
const remoteC = `# Merge Demo\none\ntwo\nthree\nFOUR-remote\nfive\nSIX-REMOTE\nseven\n`; // line5 (non-conflict) + line7 (conflict)
const genv = { ...process.env, GIT_AUTHOR_NAME: 'robbin-tester', GIT_AUTHOR_EMAIL: 'tester@wo-da.de', GIT_COMMITTER_NAME: 'robbin-tester', GIT_COMMITTER_EMAIL: 'tester@wo-da.de', GIT_AUTHOR_DATE: '2026-01-01T00:00:00', GIT_COMMITTER_DATE: '2026-01-01T00:00:00' };
const g = (args, input) => execSync(`git -C ${REPO} ${args}`, { encoding: 'utf8', input, env: genv }).trim();
const blob = (c) => g('hash-object -w --stdin', c);
const tree = (b) => g('mktree', `100644 blob ${b}\t${DEMO}\n`);
function setupFixture() {
  const bc = g(`commit-tree ${tree(blob(baseC))} -m base`);
  const lc = g(`commit-tree ${tree(blob(localC))} -p ${bc} -m local-edit`);
  const rc = g(`commit-tree ${tree(blob(remoteC))} -p ${bc} -m remote-edit`);
  g(`update-ref refs/heads/rb-merge-base ${bc}`);
  g(`update-ref refs/heads/rb-merge-local ${lc}`);
  g(`update-ref refs/heads/rb-merge-remote ${rc}`);
  return { bc, lc, rc };
}
function teardownFixture() { for (const r of ['rb-merge-base', 'rb-merge-local', 'rb-merge-remote']) { try { g(`update-ref -d refs/heads/${r}`); } catch {} } }

const R = { case1: {}, case2: {}, shots: [] };
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
try {
  const fx = setupFixture();
  console.log(`fixture refs: base=${fx.bc.slice(0,8)} local=${fx.lc.slice(0,8)} remote=${fx.rc.slice(0,8)}`);

  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1600, height: 1000 } });
  await seedSystemTester(ctx);
  const page = await ctx.newPage();

  // ============ CASE 1 — README current vs first-version (2-way take-over) ============
  await page.goto(`${BASE}/edit/README.md`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#tb-diff', { timeout: 20000 });
  await page.evaluate(() => document.querySelector('#tb-diff')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await page.waitForFunction(() => !!document.querySelector('rb-diff-editor .de-history'), { timeout: 20000 }).catch(() => {});
  await sleep(2500); // showDiff + loadSide(local README) + populateRightHistory

  const pick = await page.evaluate(() => {
    const s = document.querySelector('rb-diff-editor .de-history');
    if (!s) return { ok: false };
    const opts = [...s.querySelectorAll('option')];
    const last = opts[opts.length - 1];               // OLDEST = first/initial version
    s.value = last.value; s.dispatchEvent(new Event('change', { bubbles: true }));
    return { ok: true, n: opts.length, oldest: (last.value || '').slice(0, 8), oldestLabel: (last.textContent || '').slice(0, 50) };
  });
  await sleep(3000); // loadSide(right @oldest) + computeMergedCenter
  R.case1.pick = pick;

  const c1 = await page.evaluate(() => {
    const el = document.querySelector('rb-diff-editor');
    const q = (s) => (document.querySelector(s)?.textContent || '').trim();
    return {
      panes: document.querySelectorAll('.de-mount .monaco-editor').length,
      twoWay: el?.twoWay, conflicts: (el?.conflicts || []).length,
      acceptBtns: document.querySelectorAll('rb-diff-editor .de-accept').length,
      status: q('rb-diff-editor .de-status'),
      localTitle: q('rb-diff-editor .de-local .de-title'),
      centerTitle: q('rb-diff-editor .de-center .de-title'),
      remoteTitle: q('rb-diff-editor .de-remote .de-title'),
      localText: (el?.edLocal?.getValue?.() || '').slice(0, 30),
      remoteText: (el?.edRemote?.getValue?.() || '').slice(0, 30),
    };
  });
  R.case1.state = c1;
  R.shots.push(await shot(page, 'case1-01-2way-3pane.png'));

  // Attempt the ◄/► take-over Tron asked for; MEASURE whether 2-way renders a control (source says conflicts=[] → none).
  const c1take = await page.evaluate(async () => {
    const el = document.querySelector('rb-diff-editor');
    const before = (el?.edCenter?.getValue?.() || '');
    const btn = document.querySelector('rb-diff-editor .de-accept[data-side="right"]');
    let clicked = false;
    if (btn) { btn.dispatchEvent(new MouseEvent('click', { bubbles: true })); clicked = true; await new Promise(r => setTimeout(r, 400)); }
    const after = (el?.edCenter?.getValue?.() || '');
    return { hadControl: !!btn, clicked, changed: before !== after };
  });
  R.case1.takeover = c1take;
  R.shots.push(await shot(page, 'case1-02-2way-takeover-attempt.png'));

  // ============ CASE 2 — true 3-way divergent (IntelliJ parity) ============
  await page.evaluate(async (demo) => {
    const el = document.querySelector('rb-diff-editor');
    await el.loadSide('left',  { path: demo, ref: 'rb-merge-local' });
    await el.loadSide('right', { path: demo, ref: 'rb-merge-remote' });
    await el.computeMergedCenter();  // authoritative recompute with both refs set → real merge-base → diff3
  }, DEMO);
  // poll until the base-aware 3-way state settles (base resolved + conflict flagged)
  for (let k = 0; k < 20; k++) {
    const ok = await page.evaluate(() => { const el = document.querySelector('rb-diff-editor'); return el && el.right?.ref === 'rb-merge-remote' && el.base !== '' && (el.conflicts || []).length >= 1; });
    if (ok) break; await sleep(300);
  }
  const c2 = await page.evaluate(() => {
    const el = document.querySelector('rb-diff-editor');
    const center = el?.edCenter?.getValue?.() || '';
    return {
      twoWay: el?.twoWay, baseResolved: (el?.base || '') !== '', conflicts: (el?.conflicts || []).length,
      chevrons: document.querySelectorAll('rb-diff-editor .de-accept').length,
      conflictLineDecos: document.querySelectorAll('rb-diff-editor .de-conflict-line, rb-diff-editor .de-conflict-glyph, rb-diff-editor .de-conflict-gutter').length,
      autoAppliedLocal: center.includes('TWO-local'),     // non-conflicting change from LOCAL auto-merged in
      autoAppliedRemote: center.includes('FOUR-remote'),  // non-conflicting change from REMOTE auto-merged in
      status: (document.querySelector('rb-diff-editor .de-status')?.textContent || '').trim(),
      center: center.slice(0, 120),
    };
  });
  R.case2.merged = c2;
  R.shots.push(await shot(page, 'case2-01-3way-base-merged-conflict.png'));

  // ✨ Apply-All-Non-Conflicting (magic-wand)
  await page.evaluate(() => document.querySelector('rb-diff-editor .de-apply-all')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await sleep(1200);
  R.case2.applyAllStatus = await page.evaluate(() => (document.querySelector('rb-diff-editor .de-status')?.textContent || '').trim());
  R.shots.push(await shot(page, 'case2-02-apply-all-nonconflicting.png'));

  // accept ► (Repository) on conflict #0 → pushes DELTA-REMOTE into CENTER
  const c2acc = await page.evaluate(async () => {
    const el = document.querySelector('rb-diff-editor');
    const before = el?.edCenter?.getValue?.() || '';
    document.querySelector('rb-diff-editor .de-accept[data-cid="0"][data-side="right"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await new Promise(r => setTimeout(r, 500));
    const after = el?.edCenter?.getValue?.() || '';
    return { before: before.includes('SIX-LOCAL'), after: after.includes('SIX-REMOTE') && !after.includes('SIX-LOCAL'), changed: before !== after };
  });
  R.case2.accept = c2acc;
  R.shots.push(await shot(page, 'case2-03-accept-right-into-center.png'));

  await ctx.close();
} finally {
  teardownFixture();
  await browser.close();
}

// ---- verdicts ----
const c1 = R.case1, c2 = R.case2;
const case1Pass = c1.pick?.ok && c1.state?.panes >= 3 && c1.state?.twoWay === true && /2-way/i.test(c1.state?.status || '') && /README/.test(c1.state?.remoteTitle || '');
const case2Pass = c2.merged?.baseResolved && c2.merged?.twoWay === false && c2.merged?.conflicts >= 1 && c2.merged?.chevrons >= 2 && c2.merged?.autoAppliedLocal && c2.merged?.autoAppliedRemote && c2.accept?.after;

console.log('\n===== CASE 1 — README current vs first-version (2-way take-over) =====');
console.log(`  history opts=${c1.pick?.n} oldest=${c1.pick?.oldest} (${c1.pick?.oldestLabel})`);
console.log(`  panes=${c1.state?.panes} twoWay=${c1.state?.twoWay} conflicts=${c1.state?.conflicts} status="${c1.state?.status}"`);
console.log(`  remoteTitle="${c1.state?.remoteTitle}" localTitle="${c1.state?.localTitle}"`);
console.log(`  TAKE-OVER: control-rendered=${c1.takeover?.hadControl} clicked=${c1.takeover?.clicked} center-changed=${c1.takeover?.changed}`);
console.log(`  => CASE1 3-pane/2-way ${case1Pass ? 'GREEN' : 'RED'}${!c1.takeover?.hadControl ? '  ⚠ FINDING: no ◄/► take-over control rendered in 2-way (conflicts=[]) — status promises it but renderMergeGutter draws none' : ''}`);

console.log('\n===== CASE 2 — true 3-way divergent (IntelliJ parity) =====');
console.log(`  baseResolved=${c2.merged?.baseResolved} twoWay=${c2.merged?.twoWay} conflicts=${c2.merged?.conflicts} chevrons(◄/►)=${c2.merged?.chevrons} conflictDecos=${c2.merged?.conflictLineDecos}`);
console.log(`  auto-merged: LOCAL(ALPHA-local)=${c2.merged?.autoAppliedLocal} REMOTE(GAMMA-remote)=${c2.merged?.autoAppliedRemote}`);
console.log(`  status="${c2.merged?.status}" | applyAll="${c2.applyAllStatus}"`);
console.log(`  accept ►: before-had-LOCAL=${c2.accept?.before} after-has-REMOTE=${c2.accept?.after} changed=${c2.accept?.changed}`);
console.log(`  => CASE2 base-aware 3-way ${case2Pass ? 'GREEN' : 'RED'}`);

console.log('\n===== SCREENSHOTS =====');
R.shots.forEach(s => console.log('  ' + s));
console.log(`\nOVERALL: CASE1=${case1Pass ? 'GREEN' : 'RED'} CASE2=${case2Pass ? 'GREEN' : 'RED'}`);
process.exitCode = (case1Pass && case2Pass) ? 0 : 1;
