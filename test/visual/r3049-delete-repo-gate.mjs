// [test:uuid:e4741c65-67a9-4bb1-beb0-5f1a82c84d7a] R30.49 delete-for-removable (DELETE /api/git/repos?key= → RepoRegistry.unregister 559b508b builtin-protected) — dynamic repo register→DELETE→gone; builtin rawbin/oosh → 400 PROTECTED + still present; 🗑 Delete UI affordance (dynamic only); pollution-safe builtins-only. GREEN DET-3x v0.7.72. (req: map to the R30.49 impl — unregister 559b508b carries the builtin-protection; the DELETE endpoint handler is server.ts:1489.)
// R30.49 delete-for-removable gate — v0.7.72, Tron's real deep-link. DELETE /api/git/repos?key=<key> (server.ts:1489,
// RepoRegistry.unregister 559b508b: dynamic-only, builtin/unknown → 400) + Manage-panel 🗑 Delete affordance (dynamic only;
// builtins show 'builtin (protected)'). ASSERT: register a DYNAMIC repo → present → DELETE → gone; DELETE builtin rawbin/oosh
// → 400 PROTECTED + still present; builtins-only remain after = pollution-safe (the delete IS the cleanup). DET-3x.
// POLLUTION-SAFE: every register is deleted in the same iter; a finally sweep deletes any residue; final builtins-only assert.
import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import { execSync } from 'node:child_process';
const BASE = 'https://prod.wo-da.de:4444';
const DEEP = `${BASE}/edit/otmux?repo=oosh&left=mcdonges.latest&right=dev&3way=1`;
const OUT = 'test-results/r3049-delete';
const PROD_WT = execSync('readlink -f ~/oosh').toString().trim().replace(/mcdonges\.latest$/, 'prod'); // a real .git worktree to register
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// same-origin API helpers run inside the seeded page
const api = (page) => ({
  list: () => page.evaluate(async () => { const j = await (await fetch('/api/git/repos')).json(); return (Array.isArray(j) ? j : j.repos || []).map(r => ({ key: r.key, builtin: r.builtin, removable: r.removable })); }),
  register: (path, label) => page.evaluate(async ([p, l]) => { const r = await fetch('/api/git/repos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ method: 'local', path: p, label: l }) }); const j = await r.json(); return { status: r.status, key: j.key, error: j.error }; }, [path, label]),
  del: (key) => page.evaluate(async (k) => { const r = await fetch(`/api/git/repos?key=${encodeURIComponent(k)}`, { method: 'DELETE' }); const j = await r.json().catch(() => ({})); return { status: r.status, ok: j.ok, error: j.error }; }, key),
});

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const rows = [];
const registeredKeys = new Set();
let page;
try {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1300, height: 900 } });
  await seedSystemTester(ctx);
  page = await ctx.newPage();
  await page.goto(`${BASE}/app`, { waitUntil: 'domcontentloaded' });
  const A = api(page);

  for (let i = 1; i <= 3; i++) {
    // (1) register a DYNAMIC repo (real; delete cleans it)
    const reg = await A.register(PROD_WT, `rbdeltest${i}`);
    if (reg.key) registeredKeys.add(reg.key);
    const registered = reg.status === 200 && !!reg.key;
    const presentAfterReg = (await A.list()).some(r => r.key === reg.key);
    // (2) DELETE it → gone
    const del = await A.del(reg.key);
    const deletedOk = del.status === 200 && del.ok === true;
    const goneAfterDel = !(await A.list()).some(r => r.key === reg.key);
    if (goneAfterDel) registeredKeys.delete(reg.key);
    // (3) builtins are PROTECTED: DELETE rawbin + oosh → 400 'Not removable', still present
    const delRawbin = await A.del('rawbin'); const delOosh = await A.del('oosh');
    const listNow = await A.list();
    const builtinProtected = delRawbin.status === 400 && delOosh.status === 400 && listNow.some(r => r.key === 'rawbin') && listNow.some(r => r.key === 'oosh');

    const pass = registered && presentAfterReg && deletedOk && goneAfterDel && builtinProtected;
    rows.push(pass);
    console.log(`iter ${i}: register=${registered}(${reg.key}) present=${presentAfterReg} | DELETE→ok=${deletedOk} gone=${goneAfterDel} | builtin-protected=${builtinProtected}(rawbin=${delRawbin.status} oosh=${delOosh.status}) => ${pass ? 'GREEN' : 'RED'}`);
  }

  // (4) UI screenshot: register → open manager → 🗑 Delete affordance for a dynamic repo (+ builtin 'protected')
  const uiReg = await A.register(PROD_WT, 'rbdelui');
  if (uiReg.key) registeredKeys.add(uiReg.key);
  await page.goto(DEEP, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!customElements.get('rb-diff-editor'), { timeout: 20000 }).catch(() => {});
  await page.waitForFunction(() => { const s = document.querySelector('.de-repo[data-side="left"]'); return s && s.options.length > 1; }, { timeout: 20000 }).catch(() => {});
  // select the dynamic repo on the left, then open the manager → Manage shows 🗑 Delete
  await page.selectOption('.de-repo[data-side="left"]', uiReg.key).catch(() => {});
  await sleep(600);
  await page.selectOption('.de-repo[data-side="left"]', '__add__').catch(() => {});
  await page.waitForSelector('.de-overlay .rm-del', { timeout: 10000 }).catch(() => {});
  await sleep(400);
  const delBtnShown = await page.evaluate(() => !!document.querySelector('.de-overlay .rm-del') && /🗑/.test(document.querySelector('.de-overlay .rm-del')?.textContent || ''));
  await page.screenshot({ path: `${OUT}/manage-delete-affordance.png`, clip: { x: 0, y: 0, width: 1300, height: 620 } }).catch(() => {});
  // clean the UI repo via the real 🗑 button (proves the UI delete path too)
  await page.click('.de-overlay .rm-del').catch(() => {});
  await sleep(1200);
  const uiGone = !(await A.list()).some(r => r.key === uiReg.key);
  if (uiGone) registeredKeys.delete(uiReg.key);
  console.log(`UI: 🗑 Delete affordance shown for dynamic repo=${delBtnShown} | UI-delete removed it=${uiGone}`);

  // (5) POLLUTION-SAFE final: builtins-only
  const finalList = await A.list();
  const builtinsOnly = finalList.length === 2 && finalList.every(r => r.builtin) && finalList.some(r => r.key === 'rawbin') && finalList.some(r => r.key === 'oosh');
  console.log(`\nPOLLUTION-SAFE final: /api/git/repos = [${finalList.map(r => r.key).join(', ')}] → builtins-only=${builtinsOnly}`);
  rows.push(delBtnShown && uiGone);
  rows.push(builtinsOnly);
} finally {
  // safety sweep: delete any residue we registered
  if (page && registeredKeys.size) { for (const k of registeredKeys) { await api(page).del(k).catch(() => {}); } }
  await browser.close();
}

console.log('\n===== R30.49 delete-for-removable (DET-3x, v0.7.72, pollution-safe) =====');
const det = rows.slice(0, 3);
const green = det.length === 3 && det.every(Boolean) && rows[3] && rows[4];
console.log(`  DET-3x: ${det.map((p, i) => `${i + 1}:${p ? 'G' : 'R'}`).join(' ')} | UI-affordance+delete=${rows[3]} | builtins-only=${rows[4]}`);
console.log('OVERALL:', green ? 'GREEN DET-3x (dynamic delete→gone, builtins PROTECTED, 🗑 affordance, pollution-safe builtins-only)' : 'RED');
process.exitCode = green ? 0 : 1;
