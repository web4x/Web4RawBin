// [test:uuid:79bb0097-6735-4dab-acd0-c61583266395] R30.13 RbDiffEditor.renderInterPaneGutters (fd99c520) — inter-pane strips ≫ take Local / ≪ take Repo / ✕ ignore / 🪄 at conflicts, aligned to Result row (NOT bottom bar)
// [test:uuid:f3300b75-8776-46c3-907f-83acef59eea1] R30.13 RbDiffEditor.renderConnectorRibbons (5051b2a4) — colored SVG diagonal bands source→Result (blue change / green one-sided / red-brown conflict)
// [test:uuid:72808ca7-5eaf-4b40-a0e5-7907b5e4585e] R30.13 RbDiffEditor.jumpToChange (65c465fa) — toolbar 'N changes, M conflicts' counter + ▲/▼ change navigation
// R30.13 IntelliJ inter-pane gutters + connector ribbons (v0.7.21). Visual gate vs the Rider ref. SystemTester, zero pollution.
// Geometry settles after content loads → we nudge one scroll (scroll-redraw wired) before asserting/screenshotting. DET-3x on the 3-way case.
// CASE 2 refs are LOCAL git fixtures (plumbing, no working-tree/main touch), torn down after.

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

// ---- fixture: BASE + two divergent branches (real 3-way: 2 non-conflicting changes + 1 conflict) ----
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
}
function teardownFixture() { for (const r of ['rb-merge-base', 'rb-merge-local', 'rb-merge-remote']) { try { g(`update-ref -d refs/heads/${r}`); } catch {} } }

async function mountEditor(page) {
  await page.goto(`${BASE}/edit/README.md`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#tb-diff', { timeout: 20000 });
  await page.evaluate(() => document.querySelector('#tb-diff')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await page.waitForFunction(() => !!document.querySelector('rb-diff-editor .de-count'), { timeout: 20000 }).catch(() => {});
  await sleep(2000);
}
async function loadThreeWay(page) {
  await page.evaluate(async (demo) => {
    const el = document.querySelector('rb-diff-editor');
    await el.loadSide('left', { path: demo, ref: 'rb-merge-local' });
    await el.loadSide('right', { path: demo, ref: 'rb-merge-remote' });
    await el.computeMergedCenter();
  }, DEMO);
  for (let k = 0; k < 20; k++) { const ok = await page.evaluate(() => { const el = document.querySelector('rb-diff-editor'); return el && el.right?.ref === 'rb-merge-remote' && el.base !== '' && (el.conflicts || []).length >= 1; }); if (ok) break; await sleep(300); }
}
// geometry settles after content loads → one scroll nudge triggers the wired scroll-redraw of gutters + ribbons
async function settleGeometry(page) {
  await page.evaluate(async () => { const el = document.querySelector('rb-diff-editor'); if (el?.edCenter) { el.edCenter.setScrollTop(24); await new Promise(r => setTimeout(r, 200)); el.edCenter.setScrollTop(0); } });
  await sleep(600);
}
const measure = (page) => page.evaluate(() => {
  const el = document.querySelector('rb-diff-editor');
  const q = (s) => document.querySelectorAll(s).length;
  const stripsPresent = !!document.querySelector('rb-diff-editor .de-gutter-left') && !!document.querySelector('rb-diff-editor .de-gutter-right');
  const takeLocal = q('rb-diff-editor .de-gutter-left [data-act="left"]');
  const takeRepo = q('rb-diff-editor .de-gutter-right [data-act="right"]');
  const ignore = q('rb-diff-editor [data-act="ignore"]');
  const wand = ((document.querySelector('rb-diff-editor .de-gutter-left')?.textContent || '') + (document.querySelector('rb-diff-editor .de-gutter-right')?.textContent || '')).split('🪄').length - 1;
  const ribbonPaths = q('rb-diff-editor .de-ribbons path');
  const ribbonColors = [...document.querySelectorAll('rb-diff-editor .de-ribbons path')].map(p => p.getAttribute('fill'));
  const count = (document.querySelector('rb-diff-editor .de-count')?.textContent || '').trim();
  const jumpBtns = !!document.querySelector('rb-diff-editor .de-jump-prev') && !!document.querySelector('rb-diff-editor .de-jump-next');
  return { stripsPresent, takeLocal, takeRepo, ignore, wand, ribbonPaths, ribbonColors, count, jumpBtns, twoWay: el?.twoWay, nconf: (el?.conflicts || []).length };
});

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const R = { three: [], two: null, shots: [], jump: null, actions: null, scroll: null };
try {
  setupFixture();

  // ===== 3-way (changes + a real conflict) — DET-3x core assertions =====
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1600, height: 1000 } });
    await seedSystemTester(ctx);
    const page = await ctx.newPage();
    await mountEditor(page);
    await loadThreeWay(page);
    await settleGeometry(page);
    const m = await measure(page);

    const pass = m.stripsPresent && m.takeLocal >= 1 && m.takeRepo >= 1 && m.ignore >= 1 && m.wand >= 1
      && m.ribbonPaths >= 1 && /\d+ changes?, \d+ (conflict|take-over)/.test(m.count) && m.jumpBtns && m.twoWay === false;
    R.three.push({ pass, m });
    console.log(`3-WAY iter ${i}: strips=${m.stripsPresent} ≫=${m.takeLocal} ≪=${m.takeRepo} ✕=${m.ignore} 🪄=${m.wand} ribbons=${m.ribbonPaths}(${[...new Set(m.ribbonColors)].join(',')}) count="${m.count}" jump=${m.jumpBtns} => ${pass ? 'GREEN' : 'RED'}`);

    if (i === 1) {
      R.shots.push(await shot(page, 'case-r3013-gutters-ribbons.png')); // the IntelliJ side-by-side money shot

      // jumpToChange: ▼ moves the Result cursor
      R.jump = await page.evaluate(async () => {
        const el = document.querySelector('rb-diff-editor');
        const before = el?.edCenter?.getPosition?.()?.lineNumber ?? 0;
        document.querySelector('rb-diff-editor .de-jump-next')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        await new Promise(r => setTimeout(r, 300));
        const after = el?.edCenter?.getPosition?.()?.lineNumber ?? 0;
        return { before, after, moved: before !== after };
      });
      // actions: ≫ (take Local) then ≪ (take Repository) on the conflict → CENTER changes accordingly
      R.actions = await page.evaluate(async () => {
        const el = document.querySelector('rb-diff-editor');
        const cid = (el?.conflicts || [])[0]?.id ?? 0;
        const clickAct = (strip, act) => document.querySelector(`rb-diff-editor .${strip} [data-cid="${cid}"][data-act="${act}"]`)?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        clickAct('de-gutter-left', 'left'); await new Promise(r => setTimeout(r, 300));
        const afterLocal = el?.edCenter?.getValue?.() || '';
        clickAct('de-gutter-right', 'right'); await new Promise(r => setTimeout(r, 300));
        const afterRepo = el?.edCenter?.getValue?.() || '';
        return { tookLocal: afterLocal.includes('SIX-LOCAL'), tookRepo: afterRepo.includes('SIX-REMOTE') && !afterRepo.includes('SIX-LOCAL') };
      });
      // scroll keeps ribbons + gutters wired (scroll-redraw)
      R.scroll = await page.evaluate(async () => {
        const el = document.querySelector('rb-diff-editor');
        el?.edLocal?.setValue?.(Array.from({ length: 120 }, (_, k) => 'l' + k).join('\n'));
        el?.edCenter?.setScrollTop?.(300); await new Promise(r => setTimeout(r, 400));
        return { ribbonsAfter: document.querySelectorAll('rb-diff-editor .de-ribbons path').length, stripsAfter: !!document.querySelector('rb-diff-editor .de-gutter-left') };
      });
    }
    await ctx.close();
  }

  // ===== 2-way (README vs first-version) — dense gutter strip proof =====
  {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1600, height: 1000 } });
    await seedSystemTester(ctx);
    const page = await ctx.newPage();
    await mountEditor(page);
    await page.evaluate(() => { const s = document.querySelector('rb-diff-editor .de-history'); if (s) { const o = [...s.querySelectorAll('option')]; s.value = o[o.length - 1].value; s.dispatchEvent(new Event('change', { bubbles: true })); } });
    await sleep(3000);
    await settleGeometry(page);
    const m = await measure(page);
    R.two = { pass: m.stripsPresent && m.takeLocal >= 1 && m.ignore >= 1 && m.ribbonPaths >= 1 && m.twoWay === true, m };
    console.log(`2-WAY: strips=${m.stripsPresent} ≫=${m.takeLocal} ✕=${m.ignore} ribbons=${m.ribbonPaths} count="${m.count}" twoWay=${m.twoWay} => ${R.two.pass ? 'GREEN' : 'RED'}`);
    R.shots.push(await shot(page, 'case-r3013-2way-gutters.png'));
    await ctx.close();
  }

  // ===== mobile viewport (the bug was desktop; capture mobile for completeness) =====
  {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 390, height: 844 }, isMobile: true });
    await seedSystemTester(ctx);
    const page = await ctx.newPage();
    await mountEditor(page);
    await loadThreeWay(page);
    await settleGeometry(page);
    const m = await measure(page).catch(() => null);
    R.mobile = m ? { strips: m.stripsPresent, ribbons: m.ribbonPaths, count: m.count } : null;
    console.log(`MOBILE(390): strips=${m?.stripsPresent} ribbons=${m?.ribbonPaths} count="${m?.count}"`);
    R.shots.push(await shot(page, 'case-r3013-mobile.png'));
    await ctx.close();
  }
} finally {
  teardownFixture();
  await browser.close();
}

// ---- verdict ----
const threeGreen = R.three.length === 3 && R.three.every(r => r.pass);
const jumpOk = R.jump?.moved, actOk = R.actions?.tookLocal && R.actions?.tookRepo, scrollOk = R.scroll?.ribbonsAfter >= 1 && R.scroll?.stripsAfter;
console.log('\n===== R30.13 IntelliJ gutters + ribbons =====');
R.three.forEach((r, i) => console.log(`  3-way iter ${i + 1}: ${r.pass ? 'GREEN' : 'RED'}`));
console.log(`  jumpToChange ▼ moved cursor: ${R.jump?.before}→${R.jump?.after} = ${jumpOk}`);
console.log(`  actions: ≫ took Local=${R.actions?.tookLocal} · ≪ took Repository=${R.actions?.tookRepo}`);
console.log(`  scroll-redraw: ribbons=${R.scroll?.ribbonsAfter} strips=${R.scroll?.stripsAfter} = ${scrollOk}`);
console.log(`  2-way dense gutter: ${R.two?.pass ? 'GREEN' : 'RED'} | mobile strips=${R.mobile?.strips}`);
console.log('\n===== SCREENSHOTS ====='); R.shots.forEach(s => console.log('  ' + s));
const green = threeGreen && jumpOk && actOk && scrollOk && R.two?.pass;
console.log(`\nOVERALL: ${green ? 'GREEN DET-3x' : 'RED'}`);
process.exitCode = green ? 0 : 1;
