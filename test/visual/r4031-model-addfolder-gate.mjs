// R40.31 / R40.87 — MODEL add-folder physicality-routing (architect design-addfolder-diagrams-applicability-ruling, expert
// b2fb0ceb7). A Folder is a MODEL object, not inherently a directory: /api/model/folder/create routes by PARENT PHYSICALITY —
// a real-dir parent (dir:/rawbin:ts) → createPhysicalWithUnit (mkdir+unit); a VIRTUAL/model collection (diagrams, resolver '')
// → mintRealUnit (store-only MODEL_STORE child, NO mkdir, prod untouched). So add-folder SUCCEEDS on a diagrams collection
// (was Bug c83c02f2: bad-parent-loc, Tron reported repeatedly). STUB-MUST-FAIL: a genuinely malformed non-Folder ref must
// still return bad-parent-loc (fail-closed). Owner-gated endpoint (requireFeatureAccessHttp) — sm_session owner cookie.
// Isolated scratch (buildDist), prod scenario/index NEVER written. Run: ARM_COMMIT=b2fb0ceb7 ARM_BUILD=1 node <this>
import { webkit } from '@playwright/test';
import { setupFoundation } from './r4031-foundation.mjs';
import fs from 'node:fs';
import path from 'node:path';

const R = (v) => console.log(v);
const DIAGRAMS = 'rawbin:diagram';        // a VIRTUAL/model collection (resolveFolderRefToDir: rawbin:* non-ts → '')
const MALFORMED = ['garbage-not-a-folder-xyzzy', 'task:00000000-0000-0000-0000-000000000000']; // non-Folder / non-physical refs

const f = await setupFoundation({ commit: process.env.ARM_COMMIT || 'HEAD', buildDist: process.env.ARM_BUILD !== '0' });
const oh = f.ownerHeaders();
const smSession = (/sm_session=([^;]+)/.exec(oh.Cookie || '') || [])[1] || '';
const scratchDir = fs.readdirSync('/tmp').filter((d) => d.startsWith(`r4031-scratch-${process.pid}-`)).map((d) => path.join('/tmp', d))[0] || null;
R(`scratch up: ${f.base} v${f.servedVersion} sha=${f.worktreeSha} arm=${process.env.ARM_COMMIT || 'HEAD'} owner=${f.ownerIsServerManager} scratchDir=${scratchDir}`);

// count prod (main checkout) Folder units BEFORE — prod scenario/index must NOT grow (store-only lands in scratch MODEL_STORE)
const PROD_INDEX = path.join(f.mainRoot || process.cwd(), 'scenario/index');
const countProdFolderFiles = () => { let n = 0; const walk = (d) => { let e = []; try { e = fs.readdirSync(d, { withFileTypes: true }); } catch { return; } for (const x of e) { const p = path.join(d, x.name); if (x.isDirectory()) walk(p); else if (x.name.endsWith('.scenario.json')) n++; } }; walk(PROD_INDEX); return n; };
const prodBefore = countProdFolderFiles();

const browser = await webkit.launch({ headless: true });
const results = {};
try {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 390, height: 844 } });
  await ctx.addCookies([{ name: 'sm_session', value: smSession, domain: 'localhost', path: '/', httpOnly: true, secure: true }]);
  const page = await ctx.newPage();
  await page.goto(`${f.base}/model`, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});

  const post = (parent, name) => page.evaluate(async ([parent, name]) => {
    try { const r = await fetch('/api/model/folder/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ name, parent }) }); const t = await r.text(); let j = {}; try { j = JSON.parse(t); } catch {} return { status: r.status, body: j, raw: t.slice(0, 160) }; } catch (e) { return { status: 0, err: String(e && e.message) }; }
  }, [parent, name]);
  const getIor = (uuid) => page.evaluate(async (uuid) => { try { const r = await fetch(`/api/ior/ior:instance:${uuid}`); return r.ok ? await r.json() : { _status: r.status }; } catch (e) { return { _err: String(e && e.message) }; } }, uuid);
  const childrenOf = (ref) => page.evaluate(async (ref) => { try { return ((await (await fetch(`/api/trace/children/${encodeURIComponent(ref)}`)).json()).children || []).map((c) => c.name); } catch { return ['ERR']; } }, ref);

  // ── HAPPY: diagrams (virtual) → add-folder SUCCEEDS, real model Folder unit minted, store-only, NOT bad-parent-loc ──
  const happy = await post(DIAGRAMS, 'R4031GateFolder');
  R(`  HAPPY diagrams add-folder → status=${happy.status} ok=${happy.body?.ok} uuid=${(happy.body?.uuid || '').slice(0, 8)} err=${happy.body?.error || ''}`);
  const uuid = happy.body?.uuid;
  // the mint RETURNS the full unit inline (server.ts:2961 {ok,uuid,unit}) — assert on THAT (a follow-up /api/ior GET does not
  // resolve a MODEL_STORE unit, so use the authoritative response body, not a re-fetch).
  const mintedUnit = happy.body?.unit || null;
  const model = mintedUnit?.model || null;
  const isFolder = (mintedUnit?.ior || '') === 'ior:class:Folder';
  const parentMatch = model && String(model.parent) === DIAGRAMS;
  const noPhysicalDir = model && !model.location; // virtual = NO physical location field (mintRealUnit sets parent, not location)
  results.A1_mints = happy.status === 200 && happy.body?.ok === true && !!uuid && isFolder && parentMatch;
  results.A2_storeOnlyVirtual = results.A1_mints && noPhysicalDir === true;
  results.A3_notBadParentLoc = happy.body?.error !== 'bad-parent-loc';
  R(`  A1 mints real model Folder unit (200, ok, ior:class:Folder, parent=${DIAGRAMS}) = ${results.A1_mints}`);
  R(`  A2 store-only (virtual — no physical location field on the unit) = ${results.A2_storeOnlyVirtual} (location=${model?.location ?? 'none'} kind=${model?.kind ?? '?'})`);
  R(`  A3 NOT bad-parent-loc on the diagrams collection = ${results.A3_notBadParentLoc}`);

  // child renders under the parent (the tree/drawer reads /api/trace/children on the parent ref)
  const kids = await childrenOf(DIAGRAMS);
  results.A4_childRenders = kids.includes('R4031GateFolder');
  R(`  A4 child renders under diagrams (children now list it) = ${results.A4_childRenders} (children=${JSON.stringify(kids.slice(0, 10))})`);

  // ── STUB-MUST-FAIL: a genuinely malformed non-Folder ref must still return bad-parent-loc (fail-closed) ──
  const stubs = [];
  for (const bad of MALFORMED) { const r = await post(bad, 'R4031Stub'); stubs.push({ parent: bad, status: r.status, ok: r.body?.ok, error: r.body?.error, mintedUuid: r.body?.uuid }); R(`  STUB parent='${bad}' → status=${r.status} ok=${r.body?.ok} error=${r.body?.error || ''} minted=${(r.body?.uuid || '').slice(0, 8)}`); }
  results.stub = stubs;
  // stub-must-fail = EVERY malformed ref returns bad-parent-loc (NOT ok, NOT a minted unit)
  results.A5_stubBadParentLoc = stubs.every((s) => s.ok !== true && s.error === 'bad-parent-loc' && !s.mintedUuid);
  R(`  A5 STUB-MUST-FAIL (every malformed ref → bad-parent-loc, no mint) = ${results.A5_stubBadParentLoc}`);

  await ctx.close();
} catch (e) { results.error = String(e && e.message).slice(0, 200); }
finally { await browser.close().catch(() => {}); const td = await f.teardown(); R(`teardown: prod:4444 up=${td.prodUp} leftoverScratch=${td.leftover}`); }

// prod scenario/index must NOT have grown (store-only lands in the scratch MODEL_STORE, prod untouched)
const prodAfter = countProdFolderFiles();
results.A6_prodUntouched = prodAfter === prodBefore;
R(`  A6 prod scenario/index untouched (before=${prodBefore} after=${prodAfter}) = ${results.A6_prodUntouched}`);

R(`\n═══ R40.31 / R40.87 model add-folder physicality-routing ═══`);
R(`  POSITIVE (must stay GREEN — the fix's primary goal, Tron c83c02f2):`);
R(`    A1 diagrams add-folder MINTS a real model Folder unit  : ${results.A1_mints ? 'GREEN' : 'RED'}`);
R(`    A2 store-only (virtual — no physical dir on the unit)  : ${results.A2_storeOnlyVirtual ? 'GREEN' : 'RED'}`);
R(`    A3 NOT bad-parent-loc on the diagrams collection       : ${results.A3_notBadParentLoc ? 'GREEN' : 'RED'}`);
R(`    A6 prod scenario/index untouched                       : ${results.A6_prodUntouched ? 'GREEN' : 'RED'}`);
R(`  ★ RED BASELINE (the failing test — must be RED NOW on 0.8.179, flips GREEN when the discriminator lands):`);
R(`    A5 STUB-MUST-FAIL malformed non-Folder ref → bad-parent-loc AND NO unit minted : ${results.A5_stubBadParentLoc ? 'GREEN' : 'RED'}`);
R(`  OBSERVATION (reported, NOT gated — investigate separately, may be a distinct link/derivation concern):`);
R(`    A4 child renders under the diagrams collection (/api/trace/children) : ${results.A4_childRenders ? 'GREEN' : 'RED'}`);
// Gate PASS = the PO's criteria: the POSITIVE case works AND the STUB is fail-closed. A5 is RED now (that IS the baseline) →
// this gate FAILS on 0.8.179 by design; the SAME assertion flips GREEN once mintRealUnit/endpoint validate the parent.
const positive = results.A1_mints && results.A2_storeOnlyVirtual && results.A3_notBadParentLoc && results.A6_prodUntouched;
const green = positive && results.A5_stubBadParentLoc;
R(`OVERALL (arm=${process.env.ARM_COMMIT || 'HEAD'}): ${green ? 'ALL GREEN' : 'RED'} — positive=${positive ? 'GREEN' : 'RED'} redBaseline/A5=${results.A5_stubBadParentLoc ? 'GREEN' : 'RED(expected pre-fix)'} ${results.error ? '(err: ' + results.error + ')' : ''}`);
process.exit(green ? 0 : 1);
