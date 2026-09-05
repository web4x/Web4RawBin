// R40.92 — a folder added to a MODEL COLLECTION (diagrams) SUCCEEDS but never appeared. Architect fix 18e3f4e2f (shipped
// 48de1dcb3 = v0.8.182): ONE DRY helper folderChildrenUnder() resolves direct-child-ness by EITHER parent-link (collection
// children — no location) OR location (physical dir), and the EXISTING dir:/userDirs derivation was CONVERTED to call it.
// GATE FULL SCOPE (PO): (a) collection folder RENDERS+PERSISTS after add — offered<=>succeeds<=>VISIBLE; (b) REGRESSION on the
// converted physical dir path — 'behaviour-preserving' is a CLAIM, diff post-fix vs a PRE-CHANGE baseline (48de1dcb3^);
// (c) stub-must-fail — remove the byParent branch (serverPatch) → the collection folder VANISHES → RED; (d) served==committed==0.8.182.
// Scratch-isolated (own MODEL_STORE) — NEVER POST to prod. DET-3x on (a); (b)/(c) are one-shot structural proofs.
// [test:uuid:30797b47-b750-4c59-a7f6-59ddae28d537] R40.92 folderChildrenUnder (server.ts:1747, impl marker PENDING-req-mint) —
// a MODEL-collection folder (parent-linked, no location) is a direct child via byParent AND the converted physical dir path is
// behaviour-preserving (byLoc == old predicate). Ready for req to mint the Test→Impl chain once the impl marker lands.
import { webkit } from '@playwright/test';
import { setupFoundation } from './r4031-foundation.mjs';
import fs from 'node:fs';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const COLL = 'rawbin:diagram';          // the diagrams model collection (parent-linked children, no location)
const PHYS = 'dir:src/ts';               // a PHYSICAL dir ref — the converted userDirs path (regression subject)
const PREFIX = '48de1dcb3^';             // pre-change baseline commit (parent of the folderChildrenUnder deploy)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const R = (v) => console.log(v);
const results = {};
const AONLY = process.env.AONLY === '1'; // iterate the (a) render fix on ARM-1 only (skip the b/c scratch arms)

const jf = async (base, H, url, opts = {}) => { const r = await fetch(base + url, { ...opts, headers: { ...H, ...(opts.headers || {}) } }); const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch {} return { status: r.status, json: j, text: t }; };
const childNames = (base, H, ref) => jf(base, H, `/api/trace/children/${encodeURIComponent(ref)}`).then((r) => (r.json?.children || []).map((c) => ({ name: c.name, uuid: c.uuid, type: c.type })));
const norm = (a) => JSON.stringify(a.map((c) => ({ name: c.name, uuid: c.uuid, type: c.type })).sort((x, y) => (x.uuid || '').localeCompare(y.uuid || '')));

// ─────────── ARM 1 (HEAD = v0.8.182): (a) symptom DET-3x + (d) served + capture physical baseline ───────────
const f = await setupFoundation({ commit: 'HEAD', buildDist: process.env.ARM_BUILD !== '0' });
const H = f.ownerHeaders();
R(`ARM-1 HEAD: ${f.base} v${f.servedVersion} sha=${f.worktreeSha}`);
results.d_served = f.servedVersion === '0.8.182';
R(`  (d) served==committed==0.8.182: ${results.d_served} (served ${f.servedVersion})`);
const browser = await webkit.launch();
const aRuns = [];
try {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const sm = (H.Cookie || '').replace(/^.*sm_session=/, '').split(';')[0];
  if (sm) await ctx.addCookies([{ name: 'sm_session', value: sm, domain: 'localhost', path: '/' }]);
  const page = await ctx.newPage();
  await page.goto(f.base + '/model', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => { const t = document.getElementById('model-tree'); return t && t.querySelectorAll('rb-object-item,[ref],[data-ref]').length > 0; }, { timeout: 20000 }).catch(() => {});

  for (let i = 1; i <= 3; i++) {
    const name = `R4092Coll_${f.worktreeSha}_${i}`;
    const post = await jf(f.base, H, '/api/model/folder/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, parent: COLL }) });
    const succeeds = post.status === 200 && (post.json?.ok !== false) && !!(post.json?.uuid);
    const uuid = post.json?.uuid;
    await sleep(400);
    const kids1 = await childNames(f.base, H, COLL);
    const inData = kids1.some((c) => c.name === name || c.uuid === uuid);
    // VISIBLE (render): seed a FRESH rb-trace-tree at the diagrams collection → renderSeed fetches its children → the new
    // folder renders as a child node (the tree renders exactly what folderChildrenUnder returns). Robust to mof-tree nav/timing.
    const pid = `r4092probe_${i}`;
    await page.evaluate((a) => { const t = document.createElement('rb-trace-tree'); t.id = a.pid; t.setAttribute('data-seed-ior', a.coll); document.body.appendChild(t); }, { pid, coll: COLL });
    await sleep(1200);
    await page.evaluate((a) => { const t = document.getElementById(a.pid); return t?.expandPath ? t.expandPath([a.coll]).catch(() => {}) : null; }, { pid, coll: COLL }); // reveal the collection's children (lazy-built on open)
    await sleep(1500);
    const rendered = await page.evaluate((a) => (document.getElementById(a.pid)?.textContent || '').includes(a.nm), { pid, nm: name });
    await sleep(600);
    const kids2 = await childNames(f.base, H, COLL);
    const persists = kids2.some((c) => c.name === name || c.uuid === uuid);
    const pass = succeeds && inData && rendered && persists;
    aRuns.push(pass);
    R(`  (a) iter ${i} '${name}': offered/succeeds=${succeeds}(${post.status},uuid=${uuid ? uuid.slice(0, 8) : 'none'}) VISIBLE-data=${inData} VISIBLE-render=${rendered} persists=${persists} => ${pass ? 'GREEN' : 'RED'}`);
  }
  await ctx.close();
} finally { await browser.close().catch(() => {}); }
results.a_symptom = aRuns.length === 3 && aRuns.every(Boolean);

const headPhys = AONLY ? [] : await childNames(f.base, H, PHYS); // (b) HEAD physical-dir children (converted path)
await f.teardown();

if (!AONLY) {
// ─────────── ARM 2 (PRE-FIX 48de1dcb3^): capture SAME physical-dir children → diff = regression proof ───────────
const f2 = await setupFoundation({ commit: PREFIX, buildDist: true });
R(`ARM-2 PRE-FIX(${PREFIX}): v${f2.servedVersion} sha=${f2.worktreeSha}`);
const prePhys = await childNames(f2.base, f2.ownerHeaders(), PHYS);
await f2.teardown();
results.b_regression = prePhys.length > 0 && norm(headPhys) === norm(prePhys);
R(`  (b) regression physical '${PHYS}' children: pre-fix=${prePhys.length} post-fix=${headPhys.length} identical=${results.b_regression}`);
if (!results.b_regression) R(`      PRE : ${norm(prePhys).slice(0, 300)}\n      POST: ${norm(headPhys).slice(0, 300)}`);

// ─────────── ARM 3 (HEAD + serverPatch removes byParent): stub-must-fail — the collection folder VANISHES ───────────
const stubPatch = (root) => {
  const p = root + '/src/ts/server/server.ts';
  const s = fs.readFileSync(p, 'utf8');
  const patched = s.replace("const byParent = String(x.m.parent || '') === nodeRef;", "const byParent = false; // R40.92 STUB-MUST-FAIL: byParent removed → a no-location collection folder must VANISH");
  if (patched === s) throw new Error('stub-patch: byParent line not found (guard against silent no-op)');
  fs.writeFileSync(p, patched);
};
const f3 = await setupFoundation({ commit: 'HEAD', buildDist: true, serverPatch: stubPatch });
const H3 = f3.ownerHeaders();
R(`ARM-3 STUB(byParent removed): v${f3.servedVersion} sha=${f3.worktreeSha}`);
const sName = `R4092Stub_${f3.worktreeSha}`;
const sPost = await jf(f3.base, H3, '/api/model/folder/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: sName, parent: COLL }) });
await sleep(400);
const sKids = await childNames(f3.base, H3, COLL);
const stubHidesIt = sPost.status === 200 && !sKids.some((c) => c.name === sName); // succeeds server-side but VANISHES = byParent was what made it visible
results.c_stubMustFail = stubHidesIt;
R(`  (c) stub-must-fail: create succeeds(${sPost.status}) but folder ABSENT from collection children (byParent removed) = ${stubHidesIt}`);
await f3.teardown();
} // end if(!AONLY)

R(`\n═══ R40.92 model-collection add-folder — ${AONLY ? 'ARM-1 ONLY (a+d)' : 'FULL SCOPE'} ═══`);
R(`  (a) symptom RENDERS+PERSISTS (DET-3x)  : ${results.a_symptom ? 'GREEN' : 'RED'}`);
if (!AONLY) R(`  (b) regression physical path preserved : ${results.b_regression ? 'GREEN' : 'RED'}`);
if (!AONLY) R(`  (c) stub-must-fail (byParent removed)  : ${results.c_stubMustFail ? 'GREEN' : 'RED'}`);
R(`  (d) served==committed==0.8.182         : ${results.d_served ? 'GREEN' : 'RED'}`);
const allGreen = AONLY ? (results.a_symptom && results.d_served) : (results.a_symptom && results.b_regression && results.c_stubMustFail && results.d_served);
R(`OVERALL: ${allGreen ? 'ALL GREEN' : 'RED'}`);
process.exit(allGreen ? 0 : 1);
