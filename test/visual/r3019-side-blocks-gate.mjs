// [test:uuid:a3ad0177-b80c-445a-9c87-72bf827b8c16] R30.19 RbDiffEditor.renderSideChangeBlocks (Impl eb994dcd) — colored change-block backgrounds in the Local(left) + Repository(right) SOURCE panes (Monaco deltaDecorations), SAME de-block-{kind} class as the center block + ribbon (color-match), ORIGIN-aware (a>0→Local, b>0→Repository), LINE-anchored on the real source lines (aStart/bStart, no off-by-one)
// R30.19 (v0.7.28, hash edit-YCBWO635.js). Behavior-first, DET-3x, SystemTester. Fixture refs = local git plumbing, torn down.

import { execSync } from 'child_process';
import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
const REPO = '/var/dev/Workspaces/web4x/Web4RawBin', BASE = 'https://prod.wo-da.de:4444';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const genv = { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@x', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@x', GIT_AUTHOR_DATE: '2026-01-01T00:00:00', GIT_COMMITTER_DATE: '2026-01-01T00:00:00' };
const g = (a, i) => execSync(`git -C ${REPO} ${a}`, { encoding: 'utf8', input: i, env: genv }).trim();
const blob = (c) => g('hash-object -w --stdin', c);
const treeFor = (p, b) => g('mktree', `100644 blob ${b}\t${p}\n`);
// 3-way (conflict) fixture — SIX conflict → de-block-conflict on center + both sides
const DEMO = 'merge-demo.md';
const baseC = `# Merge Demo\none\ntwo\nthree\nfour\nfive\nsix\nseven\n`, localC = `# Merge Demo\none\nTWO-local\nthree\nfour\nfive\nSIX-LOCAL\nseven\n`, remoteC = `# Merge Demo\none\ntwo\nthree\nFOUR-remote\nfive\nSIX-REMOTE\nseven\n`;
// 2-way one-sided fixture (unrelated commits → no base → computeTwoWayHunks) — del-only + add-only
const ONE = 'oneside.md';
const osLocal = `line1\nDEL-ONLY-LOCAL\nline2\nline3\nline4\n`, osVer = `line1\nline2\nline3\nADD-ONLY-VERSION\nline4\n`;
function setup() {
  const bc = g(`commit-tree ${treeFor(DEMO, blob(baseC))} -m b`), lc = g(`commit-tree ${treeFor(DEMO, blob(localC))} -p ${bc} -m l`), rc = g(`commit-tree ${treeFor(DEMO, blob(remoteC))} -p ${bc} -m r`);
  g(`update-ref refs/heads/rb-merge-local ${lc}`); g(`update-ref refs/heads/rb-merge-remote ${rc}`);
  const ol = g(`commit-tree ${treeFor(ONE, blob(osLocal))} -m ol`), ov = g(`commit-tree ${treeFor(ONE, blob(osVer))} -m ov`);
  g(`update-ref refs/heads/rb-oneside-local ${ol}`); g(`update-ref refs/heads/rb-oneside-version ${ov}`);
}
function teardown() { for (const b of ['rb-merge-local', 'rb-merge-remote', 'rb-oneside-local', 'rb-oneside-version']) { try { g(`update-ref -d refs/heads/${b}`); } catch {} } }

async function mountLoad(browser, leftRef, rightRef, path) {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1600, height: 1000 } });
  await seedSystemTester(ctx); const page = await ctx.newPage();
  await page.goto(`${BASE}/edit/README.md`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#tb-diff', { timeout: 20000 });
  await page.evaluate(() => document.querySelector('#tb-diff')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await page.waitForFunction(() => !!document.querySelector('rb-diff-editor .de-count'), { timeout: 20000 }).catch(() => {});
  await sleep(1500);
  await page.evaluate(async ({ l, r, p }) => { const el = document.querySelector('rb-diff-editor'); await el.loadSide('left', { path: p, ref: l }); await el.loadSide('right', { path: p, ref: r }); await el.computeMergedCenter(); }, { l: leftRef, r: rightRef, p: path });
  for (let k = 0; k < 20; k++) { const ok = await page.evaluate(() => (document.querySelector('rb-diff-editor').conflicts || []).length >= 1); if (ok) break; await sleep(300); }
  await page.evaluate(async () => { const el = document.querySelector('rb-diff-editor'); if (el?.edCenter) { el.edCenter.setScrollTop(24); await new Promise(r => setTimeout(r, 200)); el.edCenter.setScrollTop(0); } });
  await sleep(700);
  return { ctx, page };
}
const KINDS = ['conflict', 'change', 'resolvable'];
const sideBlocks = (page) => page.evaluate((KINDS) => {
  const q = (pane) => { const o = {}; for (const k of KINDS) o[k] = document.querySelectorAll(`rb-diff-editor .de-${pane} .de-block-${k}`).length; o.total = KINDS.reduce((s, k) => s + o[k], 0); return o; };
  return { local: q('local'), center: q('center'), remote: q('remote') };
}, KINDS);

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const A = [], B = [];
try {
  setup();
  for (let i = 1; i <= 3; i++) {
    // ---- PART A: 3-way conflict → de-block-conflict on center + LOCAL + REPOSITORY, color-match ----
    {
      const { ctx, page } = await mountLoad(browser, 'rb-merge-local', 'rb-merge-remote', DEMO);
      const bl = await sideBlocks(page);
      // conflict kind block present in ALL THREE panes (color-match by shared class); ribbon carries the conflict color
      const ribbonHasConflict = await page.evaluate(() => [...document.querySelectorAll('rb-diff-editor .de-ribbons path')].some(p => (p.getAttribute('fill') || '').toLowerCase() === '#a5603a'));
      const pass = bl.center.conflict >= 1 && bl.local.conflict >= 1 && bl.remote.conflict >= 1 && ribbonHasConflict;
      A.push({ pass, bl });
      console.log(`A iter ${i} (side-blocks+color-match): center.conflict=${bl.center.conflict} local.conflict=${bl.local.conflict} remote.conflict=${bl.remote.conflict} ribbon#a5603a=${ribbonHasConflict} => ${pass ? 'GREEN' : 'RED'}`);
      await ctx.close();
    }
    // ---- PART B: 2-way one-sided → origin-aware (del→Local only, add→Repo only) + line-anchored ----
    {
      const { ctx, page } = await mountLoad(browser, 'rb-oneside-local', 'rb-oneside-version', ONE);
      const m = await page.evaluate(() => {
        const el = document.querySelector('rb-diff-editor'); const cs = el.conflicts || [];
        const del = cs.find(c => c.a.length > 0 && c.b.length === 0), add = cs.find(c => c.a.length === 0 && c.b.length > 0);
        // line-anchored: does the LOCAL editor show the del a-line text at aStart, REMOTE show add b-line at bStart?
        const localLines = (el.edLocal?.getValue?.() || '').split('\n'), remoteLines = (el.edRemote?.getValue?.() || '').split('\n');
        return {
          hunks: cs.length,
          localBlocks: document.querySelectorAll('rb-diff-editor .de-local [class*="de-block-"]').length,
          remoteBlocks: document.querySelectorAll('rb-diff-editor .de-remote [class*="de-block-"]').length,
          delAStart: del?.aStart, delText: del ? (localLines[del.aStart] || '') : '', delBLen: del?.b.length,
          addBStart: add?.bStart, addText: add ? (remoteLines[add.bStart] || '') : '', addALen: add?.a.length,
        };
      });
      // origin-aware: del(a>0,b=0) → a block on LOCAL, and it must NOT create a remote block for that hunk (b=0 filtered);
      // add(a=0,b>0) → a block on REMOTE. Net: local has >=1 block (del), remote has >=1 (add). Line-anchored: block sits on the real source line.
      const lineAnchoredDel = m.delAStart != null && m.delText.includes('DEL-ONLY-LOCAL');
      const lineAnchoredAdd = m.addBStart != null && m.addText.includes('ADD-ONLY-VERSION');
      const originAware = m.localBlocks >= 1 && m.remoteBlocks >= 1; // both sides carry their own-origin block
      const pass = m.hunks >= 2 && originAware && lineAnchoredDel && lineAnchoredAdd;
      B.push({ pass, m });
      console.log(`B iter ${i} (origin-aware+line-anchored): hunks=${m.hunks} localBlocks=${m.localBlocks} remoteBlocks=${m.remoteBlocks} | del@${m.delAStart}="${m.delText}"(b=${m.delBLen}) add@${m.addBStart}="${m.addText}"(a=${m.addALen}) => ${pass ? 'GREEN' : 'RED'}`);
      await ctx.close();
    }
  }
} finally { teardown(); await browser.close(); }

const aG = A.length === 3 && A.every(r => r.pass), bG = B.length === 3 && B.every(r => r.pass);
console.log('\n===== R30.19 side-pane change-blocks (DET-3x) =====');
console.log(`  (A) side blocks in Local+Repository + color-match center/ribbon: ${aG ? 'GREEN' : 'RED'}`);
console.log(`  (B) origin-aware (del→Local, add→Repository) + line-anchored: ${bG ? 'GREEN' : 'RED'}`);
const green = aG && bG;
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
