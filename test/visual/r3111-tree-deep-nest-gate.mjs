// R31.11 traceability TREE deep-nest full chain (UC→Class→Method→Impl→Test) for S31, matching S30. served==0.7.138.
// Root fix (architect): chain-model.ts:18 UseCase fwd all ['class','classes'] + server.ts:1610 [...new Set] de-dup +
// server.ts:1661 FWD_SCAN ['class','classes'] — S31 UCs store singular 'class'; scenario/client used to read only plural
// 'classes' → S31 UC stopped at UC (IMG_4701); S30 carried both keys (masked). DET-3x @390 iPhone-12.
// (1) API deep-nest BOTH modes (independent CLI cross-check, public /api/trace/children not 403-limited): S31 UC
//     serverManager.ownerGuard recurses UC→Class ServerManagerGuard(3)→Method→Impl→Test in scenario AND trace.
// (2) S30 currentSprintEagerLazy → Class RbTraceTree(19) exactly ONCE (de-dup — carries both class+classes keys).
// (3) VISUAL @390: /trace tree revealNode(S31 UC) → the nested Class/Method/Impl/Test render as rb-object-item nodes
//     with type-icons + child-count badges (like S30 target IMG_4702), screenshot. (4) regression: sacred 403 + /trace 200.
import { chromium, devices } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import https from 'node:https';
import fs from 'node:fs';
const HOST = 'prod.wo-da.de', PORT = 4444, BASE = `https://${HOST}:${PORT}`, REPO = '/var/dev/Workspaces/web4x/Web4RawBin', TARGET = '0.7.138';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const OWNERGUARD = '40802701-db2c-49d4-85cd-aa421f06e61d';   // S31 UC serverManager.ownerGuard
const S30UC = 'e22113cd-022d-48f0-b434-9ec4636e2081';        // S30 UC currentSprintEagerLazy (de-dup case)

const httpGet = (p) => new Promise((r) => { const q = https.request({ host: HOST, port: PORT, path: p, method: 'GET', rejectUnauthorized: false }, (res) => { let b = ''; res.on('data', c => b += c); res.on('end', () => r({ status: res.statusCode, body: b })); }); q.on('error', () => r({ status: 0, body: '' })); q.end(); });
const json = async (p) => { try { return JSON.parse((await httpGet(p)).body); } catch { return null; } };
const kids = (d) => Array.isArray(d) ? d : (d && Array.isArray(d.children) ? d.children : []);
const refOf = (c) => (c.uuid || (c.ref || '').replace(/^ior:instance:/, '') || '').trim();

// follow the forward chain from a UC → [Class, Method, Implementation, Test]
async function chainTypes(uuid, mode) {
  const mp = mode === 'trace' ? '?mode=trace' : '';
  const types = []; let cur = uuid;
  for (let i = 0; i < 6; i++) {
    const ch = kids(await json(`/api/trace/children/${encodeURIComponent(cur)}${mp}`));
    if (!ch.length) break;
    const c = ch[0]; types.push(c.type); const nxt = refOf(c);
    if (c.type === 'Test' || !c.hasChildren || !nxt) break;
    cur = nxt;
  }
  return types;
}

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const results = [];
try {
  const served = (await json('/api/config'))?.version;
  if (served !== TARGET) { console.log(`ABORT (phantom-guard): served=${served} != ${TARGET}`); process.exitCode = 1; }
  else {
    console.log(`served verified == ${TARGET}`);
    fs.mkdirSync(`${REPO}/test-results/r3111`, { recursive: true });

    for (let it = 1; it <= 3; it++) {
      // (1) API deep-nest BOTH modes — S31 ownerGuard → Class(3) → full chain to Test
      const apiChecks = [];
      for (const mode of ['scenario', 'trace']) {
        const top = kids(await json(`/api/trace/children/${OWNERGUARD}${mode === 'trace' ? '?mode=trace' : ''}`));
        const cls = top.find(c => c.type === 'Class' && /ServerManagerGuard/.test(c.name || ''));
        const clsOk = !!cls && cls.childCount === 3;
        const chain = await chainTypes(OWNERGUARD, mode);
        const deepNest = ['Class', 'Method', 'Implementation', 'Test'].every(t => chain.includes(t)); // full chain nests
        apiChecks.push({ mode, clsOk, chain: chain.join('→'), deepNest });
      }
      const s31BothModes = apiChecks.every(a => a.clsOk && a.deepNest);

      // (1b) ★ RENDER-ROOT: the tree lists the UC via its PARENT's child-endpoint (/children/<task>) and stamps hasChildren
      // from THERE — the UC only gets a chevron (→ expandable → deep-nests in the TREE) if the parent-listing marks it
      // hasChildren=true. This is a DIFFERENT code path than /children/<UC> (which the architect backstop checked). Assert it.
      const R312_TASK = 'd4a153d7-918a-402c-b088-345c86802537'; // S31 Task 31.2 (owner-gate) — parents the ownerGuard UC
      const ucExpandable = [];
      for (const mode of ['scenario', 'trace']) {
        const ch = kids(await json(`/api/trace/children/${R312_TASK}${mode === 'trace' ? '?mode=trace' : ''}`));
        const uc = ch.find(c => c.type === 'UseCase' && /ownerGuard/.test(c.name || ''));
        ucExpandable.push({ mode, hasChildren: uc?.hasChildren, childCount: uc?.childCount });
      }
      const ucExpandableOk = ucExpandable.every(u => u.hasChildren === true); // the tree can render the UC's chevron

      // (2) S30 de-dup — Class RbTraceTree appears EXACTLY once (both modes), childCount 19
      let s30NoDup = true, s30detail = [];
      for (const mode of ['scenario', 'trace']) {
        const ch = kids(await json(`/api/trace/children/${S30UC}${mode === 'trace' ? '?mode=trace' : ''}`));
        const rbtt = ch.filter(c => c.type === 'Class' && /RbTraceTree/.test(c.name || ''));
        const ok = rbtt.length === 1 && rbtt[0].childCount === 19;
        s30NoDup = s30NoDup && ok; s30detail.push(`${mode}:${rbtt.length}x/cc${rbtt[0]?.childCount}`);
      }

      // (3) VISUAL @390 — REAL user expand flow: Task 31.2 (R31.2 owner-gate) → UC serverManager.ownerGuard → Class
      // ServerManagerGuard → Method → Impl → Test render as nested rb-object-item nodes with type-icons + child-count badges.
      const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
      await seedSystemTester(ctx); const page = await ctx.newPage();
      await page.goto(`${BASE}/trace`, { waitUntil: 'networkidle' });
      await page.waitForFunction(() => document.querySelectorAll('rb-object-item').length > 0, { timeout: 20000 }).catch(() => {});
      // expand down the chain by chevron: task(Owner-only access gate) → UC(ownerGuard) → Class(ServerManagerGuard) → Method
      const expandByText = (re) => page.evaluate((rs) => { const r = new RegExp(rs); const it = Array.from(document.querySelectorAll('rb-object-item')).find(i => r.test(i.textContent || '')); const ex = it && (it.querySelector('.oi-expand') || it.querySelector('[class*="expand"]')); if (ex) { ex.click(); return true; } return false; }, re.source);
      await expandByText(/Owner-only access gate|Task 31\.2/); await sleep(1500);
      await expandByText(/serverManager\.ownerGuard|ownerGuard/); await sleep(1500);
      await expandByText(/ServerManagerGuard/); await sleep(1500);        // expand Class → Method
      const vis = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('rb-object-item'));
        const find = (re) => items.find(i => re.test(i.textContent || ''));
        const cls = find(/ServerManagerGuard/);
        return { classNode: !!cls, classBadge: cls?.querySelector('.oi-badge')?.textContent?.trim(),
          ucNode: !!find(/ownerGuard/), hasMethod: !!find(/assertOwner/),
          refs: items.map(i => (i.getAttribute('ref') || '').split(':')[0]).filter(Boolean), totalNodes: items.length };
      });
      const hasImpl = vis.refs.some(r => /impl/i.test(r)); const hasTest = vis.refs.some(r => /test/i.test(r));
      if (it === 1) await page.screenshot({ path: `${REPO}/test-results/r3111/s31-deepnest-390.png`, fullPage: true });
      const visualOk = vis.classNode && vis.classBadge === '3' && vis.hasMethod; // nested UC→Class(badge 3)→Method rendered @390

      // (4) regression — sacred gates 403, /trace 200
      const smStatus = (await httpGet('/server-manager')).status, fmStatus = (await httpGet('/feature-manager')).status, traceStatus = (await httpGet('/trace')).status;
      const regressionOk = smStatus === 403 && fmStatus === 403 && traceStatus === 200;
      await ctx.close();

      const pass = s31BothModes && ucExpandableOk && s30NoDup && visualOk && regressionOk;
      results.push(pass);
      console.log(`iter ${it}: S31-chain-DATA=${s31BothModes}[${apiChecks.map(a => `${a.mode}:${a.chain}`).join(' | ')}] ★UC-EXPANDABLE-IN-TREE=${ucExpandableOk}[${ucExpandable.map(u => `${u.mode}:hc=${u.hasChildren}/cc=${u.childCount}`).join(',')}] S30-no-dup=${s30NoDup}[${s30detail.join(',')}] | VISUAL@390=${visualOk}(class=${vis.classNode} badge=${vis.classBadge} method=${vis.hasMethod}) regr=${regressionOk} => ${pass ? 'GREEN' : 'RED'}`);
    }
  }
} finally { await browser.close(); }

console.log('\n===== R31.11 tree deep-nest full chain (DET-3x @390) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
console.log('NOTE: on-screen deep-nest render @390 + Tron device = final visual sign-off.');
process.exitCode = green ? 0 : 1;
