// [test:uuid:771e2e83-9109-4dc4-8d1f-70c2b4016d29] R30.45/UC7 RbDiffEditor.switchWorktree (Impl 1a86a852) — D3 no-checkout: a worktree 'use' ref-pick switches the active side's READ ref + header tracks otmux@<branch>, server does NO checkout / NO HEAD mutation (oosh `git worktree list` byte-identical before/after). GREEN DET-3x v0.7.72.
// [test:uuid:73886c4b-c95f-4c06-849a-dd3f1052fbf7] R30.45/UC6 GitApi.worktrees (Impl dceff494) — the Manage panel renders the repo's worktree list (path+branch) from GET /api/git/repo-info worktrees[]; this gate reads + drives those .rm-wt 'use' buttons (5 oosh worktrees: dev/macos/macos.latest/mcdonges.latest/prod). READY for req mint (UC6 manageInfo worktrees).
// R30.45/UC7 worktree-switch gate (D3) — v0.7.72, Tron's real deep-link. Impl RbDiffEditor.switchWorktree (1a86a852).
// FLOW: open Repo Manager → Manage panel lists the repo's worktrees with a 'use' (.rm-wt) button → click switches the
// active side's READ ref to that worktree's branch → diff loads THAT worktree's content + header tracks (otmux@<branch>).
// ★ D3 INVARIANT (the whole point): the server performs NO checkout and mutates NO working tree — switchWorktree is a pure
//   client read-ref repoint (loadSide → /api/git/file?ref=<branch> reads shared git objects). PROOF: snapshot the oosh
//   `git worktree list` (every worktree's HEAD) BEFORE and AFTER each switch → assert BYTE-IDENTICAL (a checkout would move a HEAD).
// Pollution-safe: read-only (no register/write); the D3 git snapshot is read-only. DET-3x.
import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import { execSync } from 'node:child_process';
const BASE = 'https://prod.wo-da.de:4444';
const DEEP = `${BASE}/edit/otmux?repo=oosh&left=mcdonges.latest&right=dev&3way=1`;
const OUT = 'test-results/r3045-uc7';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const OOSH = execSync('readlink -f ~/oosh').toString().trim();
const wtSnapshot = () => execSync(`git -C ${OOSH} worktree list`).toString().trim(); // every worktree path + HEAD + branch

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const rows = [];
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1300, height: 900 } });
    await seedSystemTester(ctx);
    const page = await ctx.newPage();
    await page.goto(DEEP, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => !!customElements.get('rb-diff-editor'), { timeout: 20000 }).catch(() => {});
    await page.waitForFunction(() => { const s = document.querySelector('.de-repo[data-side="left"]'); return s && s.options.length > 1; }, { timeout: 20000 }).catch(() => {});
    await page.waitForFunction(() => document.querySelector('rb-diff-editor')?.left?.content?.length > 0, { timeout: 20000 }).catch(() => {});

    const beforeRef = await page.evaluate(() => document.querySelector('rb-diff-editor')?.left?.ref);
    const beforeWt = wtSnapshot();                                   // D3 baseline (all worktree HEADs)

    // open Repo Manager (via the ➕ sentinel) → wait for the worktree 'use' buttons
    await page.selectOption('.de-repo[data-side="left"]', '__add__').catch(() => {});
    await page.waitForSelector('.de-overlay .rm-wt', { timeout: 12000 }).catch(() => {});
    await sleep(500);
    if (i === 1) await page.screenshot({ path: `${OUT}/manager-worktrees-iter1.png`, clip: { x: 0, y: 0, width: 1300, height: 660 } }).catch(() => {});

    // pick the FIRST worktree branch different from the current left ref
    const target = await page.evaluate((cur) => {
      const btns = [...document.querySelectorAll('.de-overlay .rm-wt')];
      const b = btns.find(x => (x.dataset.ref || '') && x.dataset.ref !== cur) || btns[0];
      return b ? b.dataset.ref : null;
    }, beforeRef);

    // click its 'use' button → switchWorktree(left, ref)
    await page.evaluate((ref) => { const b = [...document.querySelectorAll('.de-overlay .rm-wt')].find(x => x.dataset.ref === ref); b?.click(); }, target);
    await page.waitForFunction((ref) => { const e = document.querySelector('rb-diff-editor'); return e?.left?.ref === ref && e?.left?.content?.length > 0; }, target, { timeout: 20000 }).catch(() => {});
    await sleep(800);

    const after = await page.evaluate(() => { const e = document.querySelector('rb-diff-editor'); const t = document.querySelector('.de-local .de-title')?.textContent || ''; return { ref: e?.left?.ref, len: e?.left?.content?.length || 0, title: t }; });
    const afterWt = wtSnapshot();                                    // D3 re-check

    if (i === 1) await page.screenshot({ path: `${OUT}/after-switch-iter1.png`, clip: { x: 0, y: 0, width: 1300, height: 660 } }).catch(() => {});

    const refSwitched = after.ref === target && target !== beforeRef;             // client ref repointed to the worktree branch
    const contentLoaded = after.len > 0;                                          // that worktree's content loaded
    const headerTracks = after.title.includes('@' + target) || after.title.includes(target); // header reads otmux@<branch>
    const noCheckout = afterWt === beforeWt;                                      // ★ D3: NO server checkout / NO HEAD mutation
    const pass = refSwitched && contentLoaded && headerTracks && noCheckout;
    rows.push(pass);
    console.log(`iter ${i}: switch ${beforeRef}→${target} | ref-switched=${refSwitched} | content=${contentLoaded}(${after.len}b) | header-tracks=${headerTracks}("${after.title}") | D3-no-checkout=${noCheckout} => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }
} finally { await browser.close(); }

console.log('\n===== R30.45/UC7 worktree switch — D3 no-checkout (DET-3x, v0.7.72) =====');
console.log(`  DET-3x: ${rows.map((p, i) => `${i + 1}:${p ? 'G' : 'R'}`).join(' ')}`);
console.log(`  oosh worktree HEADs stable across all switches (D3): ${rows.every(Boolean)}`);
const green = rows.length === 3 && rows.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x (client ref-pick switches repo/ref + header tracks; server NO checkout / NO HEAD mutation)' : 'RED');
process.exitCode = green ? 0 : 1;
