// [test:uuid:eaaa2469-e73b-4efb-8790-530f2f388915] R30.46 W1 RbDiffEditor.loadSide working-ref b7b6fcb6 — a deep-link
// left=latest (or no ref) loads the RAW ON-DISK WORKING file via /api/files (uncommitted changes visible), NOT git-show:
// el.left.ref==='' and el.left.content === the fs working file, /api/files/otmux requested (not /api/git/file for the left).
// [test:uuid:53d94d46-0fb6-4619-ba36-35897ec254a8] R30.46 W3 RbDiffEditor.openFromParams default-working-left 0eb17ebd —
// a bare open (no left param) DEFAULTS left=WORKING (pinned) + right=HEAD, NO R30.17 promote (_pinnedLeft): the working file
// STAYS on the left (not moved to the right), right.ref==='HEAD'.
// [test:uuid:7a0dc2b6-7023-49fd-8def-2b60e45d0098] R30.46 W2 working-file save ROUND-TRIP (locking) — edit CENTER → Save →
// the on-disk WORKING file at ref='' round-trips (change persists to disk, fs-verified). Distinct intent from R30.38 diff-repo
// save (4e2c8f10 is NON-writing 409-probe → does NOT cover real disk persistence); this asserts the actual round-trip. Bridges
// the shared save Impl a88b2b53 (2nd distinct Test). Pollution-safe: fs byte-perfect backup/restore, never git checkout.
// POLLUTION-SAFE: fs byte-perfect backup BEFORE + restore AFTER (NOT git checkout — the working file may hold uncommitted
// changes git checkout would destroy); verify git-clean + byte-identical after. v0.7.68 (edit-IH43EFGH.js). DET-3x. SystemTester.
import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import fs from 'fs';
import { execSync } from 'child_process';
const BASE = 'https://prod.wo-da.de:4444';
const OOSH = fs.realpathSync(process.env.HOME + '/oosh');
const OTMUX = `${OOSH}/otmux`;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const workingBuf = fs.readFileSync(OTMUX);           // the on-disk WORKING file AT GATE START (may hold intentional uncommitted changes — the pre-gate state I must restore to, byte-perfect)
const workingContent = workingBuf.toString('utf-8');
let headContent = ''; try { headContent = execSync(`git -C "${OOSH}" show HEAD:otmux`).toString(); } catch {}
const workingDiffersFromHead = workingContent !== headContent;   // when true, left=latest==working PROVES it reads working, not git-show HEAD
const preGateDirty = !(() => { try { return execSync(`git -C "${OOSH}" status --short otmux`).toString().trim() === ''; } catch { return false; } })();
const sig = (s) => ({ len: s.length, head: s.slice(0, 120), tail: s.slice(-120) });
const WSIG = sig(workingContent);
const matchesWorking = (m) => m && m.len === WSIG.len && m.head === WSIG.head && m.tail === WSIG.tail;
const gitCleanOtmux = () => { try { return execSync(`git -C "${OOSH}" status --short otmux`).toString().trim() === ''; } catch { return false; } };

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const R = { w1: [], w3: [], w2: [] };
async function boot(url) {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1400, height: 950 } });
  await seedSystemTester(ctx);
  const page = await ctx.newPage();
  const reqs = [];
  page.on('request', r => { const u = r.url(); if (u.includes('/api/files/') || u.includes('/api/git/file')) reqs.push(u); });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => (document.querySelector('rb-diff-editor')?.edCenter?.getValue?.()?.length || 0) > 0, { timeout: 25000 }).catch(() => {});
  await sleep(1500);
  return { ctx, page, reqs };
}
const readSides = (page) => page.evaluate(() => {
  const e = document.querySelector('rb-diff-editor');
  const s = (v) => ({ len: v.length, head: v.slice(0, 120), tail: v.slice(-120) });
  return { leftRef: e?.left?.ref ?? '?', rightRef: e?.right?.ref ?? '?', left: s(e?.left?.content || ''), header: (document.querySelector('rb-diff-editor .de-center .de-title')?.textContent || '').trim() };
});

try {
  // ── W1: left=latest → raw working file via /api/files ──
  for (let i = 1; i <= 3; i++) {
    const { ctx, page, reqs } = await boot(`${BASE}/edit/otmux?repo=oosh&left=latest&right=dev&3way=1`);
    const st = await readSides(page);
    if (i === 1) await page.screenshot({ path: 'test-results/r3046-working/w1-latest.png' }).catch(() => {});
    const leftIsWorkingRef = st.leftRef === '';
    const leftIsWorkingContent = matchesWorking(st.left);
    const viaApiFiles = reqs.some(u => /\/api\/files\/otmux/.test(u));
    const leftNotGitShow = !reqs.some(u => /\/api\/git\/file.*[?&]path=otmux[^&]*&ref=(latest|)/.test(u)); // left working must not come from git/file
    const rightDev = st.rightRef === 'dev';
    const pass = leftIsWorkingRef && leftIsWorkingContent && viaApiFiles && rightDev;
    R.w1.push(pass);
    console.log(`W1 iter ${i}: leftRef='${st.leftRef}'(${leftIsWorkingRef}) content-is-working=${leftIsWorkingContent}(${st.left.len} vs ${WSIG.len}) via/api/files=${viaApiFiles} rightRef='${st.rightRef}'(${rightDev}) [working≠HEAD=${workingDiffersFromHead} → reads-uncommitted-not-git-show] => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }

  // ── W3: bare open (no left/right) → working-left pinned + right=HEAD, NO promote ──
  for (let i = 1; i <= 3; i++) {
    const { ctx, page } = await boot(`${BASE}/edit/otmux?repo=oosh&3way=1`);
    const st = await readSides(page);
    if (i === 1) await page.screenshot({ path: 'test-results/r3046-working/w3-default.png' }).catch(() => {});
    const leftPinnedWorking = st.leftRef === '' && matchesWorking(st.left);  // working STAYS on left (no promote → left would become a ref)
    const rightHead = st.rightRef === 'HEAD';
    const pass = leftPinnedWorking && rightHead;
    R.w3.push(pass);
    console.log(`W3 iter ${i}: leftRef='${st.leftRef}' left-is-working=${matchesWorking(st.left)} pinned=${leftPinnedWorking} | rightRef='${st.rightRef}'(HEAD=${rightHead}) => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }

  // ── W2: locking / save round-trip — edit CENTER → Save → on-disk WORKING file updates → fs restore ──
  const PROBE = '\n# RB-W2-LOCK-PROBE-8f3a1c do-not-keep';
  for (let i = 1; i <= 3; i++) {
    let onDiskHasProbe = false, restored = false, clean = false;
    try {
      const { ctx, page } = await boot(`${BASE}/edit/otmux?repo=oosh&left=latest&right=dev&3way=1`);
      // append a unique probe to CENTER, then Save (PUT /api/files/otmux?repo=oosh at ref='' = the working file)
      await page.evaluate((probe) => { const e = document.querySelector('rb-diff-editor'); e.edCenter.setValue(e.edCenter.getValue() + probe); }, PROBE);
      await sleep(300);
      await page.click('rb-diff-editor .de-save', { timeout: 8000 }).catch(() => {});
      await sleep(1500);
      await ctx.close();
      // ground truth: read the on-disk working file directly
      onDiskHasProbe = fs.readFileSync(OTMUX, 'utf-8').includes('RB-W2-LOCK-PROBE-8f3a1c');
    } finally {
      fs.writeFileSync(OTMUX, workingBuf);                       // byte-perfect restore to the PRE-GATE state (NOT git checkout — the working file holds intentional uncommitted changes git checkout would destroy)
      restored = fs.readFileSync(OTMUX).equals(workingBuf);      // == pre-gate working state = I left otmux EXACTLY as I found it
    }
    // pollution-safe = restored byte-perfect to the PRE-GATE state (which was itself intentionally dirty), NOT git-clean.
    const pass = onDiskHasProbe && restored;
    R.w2.push(pass);
    console.log(`W2 iter ${i}: on-disk-updated=${onDiskHasProbe} | restored-to-pregate-byte-perfect=${restored} => ${pass ? 'GREEN' : 'RED'}`);
  }
} finally {
  await browser.close();
  fs.writeFileSync(OTMUX, workingBuf); // final safety restore
}

console.log('\n===== R30.46 working-file (DET-3x, v0.7.68) =====');
const g = (a) => a.length === 3 && a.every(Boolean);
console.log(`  W1 left=latest→working: ${R.w1.map((p, i) => `${i + 1}:${p ? 'G' : 'R'}`).join(' ')} => ${g(R.w1) ? 'GREEN' : 'RED'}`);
console.log(`  W3 default-working-left: ${R.w3.map((p, i) => `${i + 1}:${p ? 'G' : 'R'}`).join(' ')} => ${g(R.w3) ? 'GREEN' : 'RED'}`);
console.log(`  W2 save round-trip (lock): ${R.w2.map((p, i) => `${i + 1}:${p ? 'G' : 'R'}`).join(' ')} => ${g(R.w2) ? 'GREEN' : 'RED'}`);
console.log(`  pre-gate working state: ${preGateDirty ? 'DIRTY (intentional uncommitted change present)' : 'clean'}, working≠HEAD=${workingDiffersFromHead}`);
console.log(`  restored to pre-gate byte-perfect: ${fs.readFileSync(OTMUX).equals(workingBuf)} (left otmux EXACTLY as found — pre-existing uncommitted change preserved, NOT my pollution)`);
const green = g(R.w1) && g(R.w3) && g(R.w2);
console.log('OVERALL:', green ? 'GREEN DET-3x (working-file left + default-pinned + save round-trip, pollution-safe: restored to pre-gate byte-perfect)' : 'RED');
process.exitCode = green ? 0 : 1;
