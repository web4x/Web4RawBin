// [test:uuid:ab33b3e8-f3ce-4140-a212-79f66cd2ae43] R30.23 diff-completeness — computeOneSidedHunks on computeMergedCenter (Impl a0b30550): a 3-way merge now SURFACES one-sided auto-applied changes (local-only + repo-only, no true conflict) as kind:'change' Conflicts, ORIGIN-EXACT (local-only→a>0,b=0 Local block+ribbon; repo-only→a=0,b>0 Repository block+ribbon), NO double-count (false conflict = both-same → ok, not surfaced). jumpToChange COUNTS them (N changes ⊇ M conflicts, not '0 changes clean auto-merge'). A true conflict still kind:'conflict'. Merge RESULT byte-identical (visibility-only). Reproduces IMG_4522 (one-sided line now highlighted).
// R30.23 (v0.7.33, edit-BMERY5NZ.js). Behavior-first, DET-3x, SystemTester. Fixture refs = local git plumbing, torn down.
import { execSync } from 'child_process';
import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
const REPO = '/var/dev/Workspaces/web4x/Web4RawBin', BASE = 'https://prod.wo-da.de:4444';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const genv = { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@x', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@x', GIT_AUTHOR_DATE: '2026-01-01T00:00:00', GIT_COMMITTER_DATE: '2026-01-01T00:00:00' };
const g = (a, i) => execSync(`git -C ${REPO} ${a}`, { encoding: 'utf8', input: i, env: genv }).trim();
const blob = (c) => g('hash-object -w --stdin', c);
const F = 'diffc.md';
const tree = (b) => g('mktree', `100644 blob ${b}\t${F}\n`);
const commit3 = (baseC, localC, remoteC, name) => { const bc = g(`commit-tree ${tree(blob(baseC))} -m b`); const lc = g(`commit-tree ${tree(blob(localC))} -p ${bc} -m l`); const rc = g(`commit-tree ${tree(blob(remoteC))} -p ${bc} -m r`); g(`update-ref refs/heads/${name}-local ${lc}`); g(`update-ref refs/heads/${name}-remote ${rc}`); };
// A: one-sided only (local line2 + repo line6, non-overlapping → NO conflict, 2 changes)
// B: true conflict (both change line2 differently → kind conflict)
// C: false conflict (both change line2 to SAME → agreed, NOT surfaced, no double-count)
function setup() {
  commit3(`a\nb\nc\nd\ne\nf\ng\n`, `a\nLOCAL-ONLY\nc\nd\ne\nf\ng\n`, `a\nb\nc\nd\ne\nREPO-ONLY\ng\n`, 'rb-os');
  commit3(`a\nb\nc\n`, `a\nLOCAL-X\nc\n`, `a\nREPO-Y\nc\n`, 'rb-cf');
  commit3(`a\nb\nc\n`, `a\nSAME\nc\n`, `a\nSAME\nc\n`, 'rb-fc');
}
function teardown() { for (const n of ['rb-os', 'rb-cf', 'rb-fc']) for (const s of ['local', 'remote']) { try { g(`update-ref -d refs/heads/${n}-${s}`); } catch {} } }

async function load(browser, name) {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1600, height: 1000 } });
  await seedSystemTester(ctx); const page = await ctx.newPage();
  await page.goto(`${BASE}/edit/README.md`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#tb-diff', { timeout: 20000 });
  await page.evaluate(() => document.querySelector('#tb-diff')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await page.waitForFunction(() => !!document.querySelector('rb-diff-editor .de-count'), { timeout: 20000 }).catch(() => {});
  await sleep(1500);
  await page.evaluate(async ({ f, n }) => { const el = document.querySelector('rb-diff-editor'); await el.loadSide('left', { path: f, ref: `${n}-local` }); await el.loadSide('right', { path: f, ref: `${n}-remote` }); await el.computeMergedCenter(); }, { f: F, n: name });
  for (let k = 0; k < 20; k++) { const ok = await page.evaluate(() => { const el = document.querySelector('rb-diff-editor'); return el && el.base !== ''; }); if (ok) break; await sleep(300); }
  await page.evaluate(async () => { const el = document.querySelector('rb-diff-editor'); if (el?.edCenter) { el.edCenter.setScrollTop(20); await new Promise(r => setTimeout(r, 200)); el.edCenter.setScrollTop(0); } });
  await sleep(600);
  return { ctx, page };
}

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const results = [];
try {
  setup();
  for (let i = 1; i <= 3; i++) {
    // A: one-sided only
    const A = await load(browser, 'rb-os');
    const a = await A.page.evaluate(() => {
      const el = document.querySelector('rb-diff-editor'); const cs = el.conflicts || [];
      const localOnly = cs.find(c => c.kind === 'change' && c.a.length > 0 && c.b.length === 0);
      const repoOnly = cs.find(c => c.kind === 'change' && c.a.length === 0 && c.b.length > 0);
      const center = el.edCenter.getValue();
      return { n: cs.length, kinds: cs.map(c => c.kind), localOnly: !!localOnly, repoOnly: !!repoOnly,
        localBlock: document.querySelectorAll('rb-diff-editor .de-local .de-block-change').length,
        repoBlock: document.querySelectorAll('rb-diff-editor .de-remote .de-block-change').length,
        count: (document.querySelector('rb-diff-editor .de-count')?.textContent || '').trim(),
        mergeCorrect: center.includes('LOCAL-ONLY') && center.includes('REPO-ONLY') }; // both auto-applied (byte-identical merge)
    });
    await A.ctx.close();
    // count "N changes" ⊇ conflicts; NOT '0 changes'
    const countN = parseInt((a.count.match(/(\d+) change/) || [])[1] || '0', 10);
    const caseA = a.n === 2 && a.localOnly && a.repoOnly && a.localBlock >= 1 && a.repoBlock >= 1 && countN >= 2 && a.mergeCorrect;

    // B: true conflict still kind:conflict
    const B = await load(browser, 'rb-cf');
    const b = await B.page.evaluate(() => { const cs = document.querySelector('rb-diff-editor').conflicts || []; return { n: cs.length, hasConflict: cs.some(c => c.kind === 'conflict') }; });
    await B.ctx.close();
    const caseB = b.hasConflict === true;

    // C: false conflict (both-same) → NOT surfaced (no double-count)
    const C = await load(browser, 'rb-fc');
    const c = await C.page.evaluate(() => { const el = document.querySelector('rb-diff-editor'); const cs = el.conflicts || []; return { n: cs.length, center: el.edCenter.getValue().includes('SAME') }; });
    await C.ctx.close();
    const caseC = c.n === 0 && c.center; // both-same agreed → 0 surfaced, SAME kept in center

    const pass = caseA && caseB && caseC;
    results.push(pass);
    console.log(`iter ${i}: A one-sided[n=${a.n} kinds=${a.kinds} local=${a.localOnly}/repo=${a.repoOnly} blocks L${a.localBlock}/R${a.repoBlock} count="${a.count}" merge=${a.mergeCorrect}]=${caseA} | B conflict[n=${b.n} kind:conflict=${b.hasConflict}]=${caseB} | C false-conflict[n=${c.n} no-double-count]=${caseC} => ${pass ? 'GREEN' : 'RED'}`);
  }
} finally { teardown(); await browser.close(); }

console.log('\n===== R30.23 diff-completeness (one-sided surfaced) DET-3x =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
