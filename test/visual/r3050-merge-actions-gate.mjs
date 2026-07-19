// [test:uuid:9e1bfc3d-4a8a-45d5-8d7c-ffa19217ca7a] R30.50 B RbDiffEditor.openApplyAllMenu (Impl 288f469c) — 3-mode Apply-All popup opens with Non-conflicting / Local wins / Repo wins.
// [test:uuid:4d2260ea-5164-4171-a235-a37b6069263a] R30.50 B RbDiffEditor.applyAllFromSide (Impl 6f5bd6a1) — Local wins → CENTER==Local, Repo wins → CENTER==Repo, openChangeCount→0.
// [test:uuid:690f963c-f274-4ccd-8a68-781497a802c1] R30.50 C1 RbDiffEditor.saveOrJumpToConflict (Impl b741580e) — open>0 → jump next UNRESOLVED + 'resolve before saving' status, NO write.
// [test:uuid:5296e852-8b5e-4d7a-88e4-015e6f772e3a] R30.50 C2 RbDiffEditor.updateSaveButtonState (Impl 78f75ba0) — '✓ Saved' green when clean-after-save, resets to '💾 Save' on any edit.
// [test:uuid:0866205d-5bb6-4dcb-8273-67b0b8843f9a] R30.50 A de-count COMPOSE (impl-edit on renderMergeGutter e24dc98a) — the count composes '(N selected · )?X/Y open conflicts' (N=_jumpIdx+1 on nav, omitted when none). Gate asserts the exact compose text pristine ('X/Y open conflicts') AND after nav ('N selected · X/Y open conflicts'). Distinct R30.50-A-intention Test on e24dc98a alongside the structural 8fa42d89.
// (applyAllNonConflicting 91c452ae also exercised — rides its existing Test 79139c01.)
// R30.50 merge-actions gate — v0.7.73 (edit-UQJUZB6W.js), Tron's real 3-way deep-link. DET-3x, screenshot.
// (A) de-count composes '(N selected · )?X/Y open conflicts' (real openChangeCount/conflicts.length; N=_jumpIdx+1 on nav).
// (B) '✨ Apply All' 3-mode popup — assert EACH drives the correct CENTER mutation (not just popup-opens):
//     Non-conflicting only (91c452ae → recompute auto-merge) / Local wins (applyAllFromSide left → CENTER==Local) /
//     Repo wins (applyAllFromSide right → CENTER==Repo).
// (C1) guarded save (b741580e saveOrJumpToConflict): open>0 → jump to next UNRESOLVED + 'resolve before saving' status, NO write.
// (C2) save-button green (78f75ba0): '.de-saved' green '✓ Saved' when clean-after-save; resets to '💾 Save' on any edit.
// ★ POLLUTION-SAFE: the C2 real save PUT /api/files is ROUTE-INTERCEPTED (fulfilled 200, NO real prod otmux write —
//   the r3042 non-writing pattern). The intercept also lets C1 assert NO write fired (putCount stays 0 on a guarded save).
import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
const BASE = 'https://prod.wo-da.de:4444';
const DEEP = `${BASE}/edit/otmux?repo=oosh&left=mcdonges.latest&right=dev&3way=1`;
const OUT = 'test-results/r3050-merge-actions';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const clickApplyMode = async (page, rx) => {
  await page.click('.de-apply-all').catch(() => {});
  await page.waitForSelector('.de-overlay', { timeout: 8000 }).catch(() => {});
  await page.evaluate((r) => { const b = [...document.querySelectorAll('.de-overlay button')].find(x => new RegExp(r, 'i').test(x.textContent || '')); b?.click(); }, rx);
  await sleep(900);
};
const read = (page) => page.evaluate(() => { const e = document.querySelector('rb-diff-editor'); return { count: e?.querySelector('.de-count')?.textContent || '', center: e?.edCenter?.getValue?.() ?? '', local: e?.edLocal?.getValue?.() ?? '', remote: e?.edRemote?.getValue?.() ?? '', open: e?.openChangeCount?.() ?? -1, jumpIdx: e?._jumpIdx, saveTxt: e?.querySelector('.de-save')?.textContent || '', saveGreen: e?.querySelector('.de-save')?.classList.contains('de-saved'), status: e?.querySelector('.de-status')?.textContent || '' }; });

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const rows = [];
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1300, height: 900 } });
    await seedSystemTester(ctx);
    const page = await ctx.newPage();
    let putCount = 0;
    await page.route('**/api/files/**', async route => { if (route.request().method() === 'PUT') { putCount++; return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, mtime: 'intercepted' }) }); } return route.continue(); });

    await page.goto(DEEP, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => !!customElements.get('rb-diff-editor'), { timeout: 20000 }).catch(() => {});
    await page.waitForFunction(() => { const e = document.querySelector('rb-diff-editor'); return e?.edCenter?.getValue && (e?.conflicts?.length > 0); }, { timeout: 20000 }).catch(() => {});
    await sleep(600);

    // ── (A) de-count composes '(N selected · )?X/Y open conflicts' ──
    const a0 = await read(page);
    const mNoSel = a0.count.match(/^(\d+)\/(\d+) open conflicts?$/);
    const aBase = !!mNoSel && Number(mNoSel[1]) === a0.open && Number(mNoSel[2]) > 0;      // pristine: X/Y, real values
    await page.evaluate(() => document.querySelector('rb-diff-editor')?.jumpToChange?.(1));  // nav → N selected
    await sleep(500);
    const a1 = await read(page);
    const aNav = /^\d+ selected · \d+\/\d+ open conflicts?$/.test(a1.count) && a1.count.startsWith(`${a1.jumpIdx + 1} selected · `);
    const A = aBase && aNav;

    // ── (C1) guarded save: open>0 → jump + status, NO write ──
    const putBefore = putCount; const jBefore = a1.jumpIdx;
    await page.click('.de-save').catch(() => {});
    await sleep(700);
    const c1 = await read(page);
    const C1 = c1.open > 0 && /resolve before saving/i.test(c1.status) && putCount === putBefore && c1.jumpIdx !== jBefore; // jumped, no PUT

    // ── (B) Apply All 3 modes → correct CENTER mutation ──
    await clickApplyMode(page, 'Local wins');
    const bLocal = await read(page);
    const bModeLocal = bLocal.center === bLocal.local && bLocal.open === 0;
    await clickApplyMode(page, 'Repository wins');
    const bRepo = await read(page);
    const bModeRepo = bRepo.center === bRepo.remote && bRepo.open === 0;
    await clickApplyMode(page, 'Non-conflicting');
    const bNC = await read(page);
    const bModeNC = bNC.center === a0.center; // recompute → back to the base-aware auto-merge (== pristine CENTER)
    const B = bModeLocal && bModeRepo && bModeNC;

    // ── (C2) save-button green after a successful (guard-passing) save, resets on edit ── POLLUTION-SAFE (PUT intercepted)
    await clickApplyMode(page, 'Local wins');            // open→0 so the guarded save actually saves
    const preSave = await read(page);
    const c2Before = !preSave.saveGreen && /💾/.test(preSave.saveTxt);   // not-green while just-mutated (unsaved)
    await page.click('.de-save').catch(() => {});         // open===0 → save() → PUT (intercepted 200) → _saved=true → green
    await sleep(900);
    const c2 = await read(page);
    const c2Green = c2.saveGreen && /✓ Saved/.test(c2.saveTxt) && putCount === putBefore + 1; // green + exactly one (intercepted) PUT
    if (i === 1) await page.screenshot({ path: `${OUT}/saved-green-iter1.png`, clip: { x: 0, y: 0, width: 1300, height: 110 } }).catch(() => {});
    await page.evaluate(() => { const e = document.querySelector('rb-diff-editor'); e?.edCenter?.setValue?.((e.edCenter.getValue() || '') + '\n# r3050 edit'); }); // any edit
    await sleep(500);
    const c2e = await read(page);
    const c2Reset = !c2e.saveGreen && /💾/.test(c2e.saveTxt);   // edit resets to unsaved
    const C2 = c2Before && c2Green && c2Reset;

    const pass = A && B && C1 && C2;
    rows.push(pass);
    console.log(`iter ${i}: A-count=${A}("${a0.count}"→"${a1.count}") | B-modes=${B}(L=${bModeLocal} R=${bModeRepo} NC=${bModeNC}) | C1-guarded=${C1}(open=${c1.open} jumped status="${c1.status.slice(0, 40)}") | C2-green=${C2}(green=${c2Green} reset=${c2Reset} puts=${putCount}) => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }
} finally { await browser.close(); }

console.log('\n===== R30.50 merge-actions (DET-3x, v0.7.73, pollution-safe) =====');
console.log(`  DET-3x: ${rows.map((p, i) => `${i + 1}:${p ? 'G' : 'R'}`).join(' ')}`);
const green = rows.length === 3 && rows.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x (A compose-count / B 3-mode CENTER mutation / C1 guarded-save-no-write / C2 saved-green, pollution-safe)' : 'RED');
process.exitCode = green ? 0 : 1;
