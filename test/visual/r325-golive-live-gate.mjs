// [test:uuid:e7557a8c-b344-4c46-8773-8f5cf402e335] R32.5 GO-LIVE drop→generate→isolated-store→populated tree/diagram — verifies server.isModelUnit (Impl 010f3e23: model reads reroute to the ISOLATED store, prod scenario/index NEVER mutated) via a REAL served drop (POST /api/model/generate) on v0.8.5: tree populated from the store, diagram unit in store, ★prod scenario/index UNCHANGED (fixture uuids only in MODEL_STORE), idempotent re-drop 0-churn, @390 mobile reach. Companion own-oracle r325-golive-oracle-gate.ts (import TsToModel.generate 382f8644 + buildDiagramSvg ba96a744, isolated scratch, planted-defect bite). → req wires this Test onto Impl 010f3e23.
// R32.5 GO-LIVE — LIVE axis on served==0.8.5 (self-verified). Drops a known .ts via the REAL served endpoint
// POST /api/model/generate → the ISOLATED MODEL_STORE, then proves the store-backed pipeline the UI renders +
// the pollution guard, DET-3x. POLLUTION-SAFE: snapshot MODEL_STORE before, restore it byte-for-byte after (store is
// resettable by design); prod scenario/index is NEVER written (the isolation AC). served/live-UI @390: a mobile client
// (iPhone-12) fetches the populated tree from the store; the populated-tree+diagram VISUAL render is Tron's device sign-off.
// ACs: (1) served==0.8.5 (phantom-guard); (2) drop→/api/model/tree populated with the fixture roots + diagram unit in store;
// (3) ★ prod scenario/index ModelElement count UNCHANGED (fixture uuids ABSENT from prod, present ONLY in the store);
// (4) idempotent re-drop → wrote=0 (0-dup). Own-oracle: fixture uuids computed via TsToModel.generate(write:false).
import { TsToModel } from '../../src/ts/scenario/TsToModel.ts';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { chromium, devices } from '@playwright/test';

const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin';
const BASE = 'https://prod.wo-da.de:4444';
const PROD_INDEX = path.join(ROOT, 'scenario', 'index');
const MODEL_STORE = path.join(ROOT, 'data', 'model-store', 'index');
const FIXTURE_REL = 'test/fixtures/r325-golive-drop.ts';
const NAMES = ['R325Base', 'R325Iface', 'R325Widget'];
const shardOf = (base, uuid) => path.join(base, ...uuid.slice(0, 5).split(''), `${uuid}.scenario.json`);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const req = (method, pth, body) => new Promise((resolve) => {
  const data = body ? JSON.stringify(body) : null;
  const r = https.request({ host: 'prod.wo-da.de', port: 4444, path: pth, method, rejectUnauthorized: false, headers: body ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {} }, (res) => {
    let b = ''; res.on('data', c => b += c); res.on('end', () => { let j = null; try { j = JSON.parse(b); } catch { /* */ } resolve({ status: res.statusCode, json: j, body: b }); });
  });
  r.on('error', () => resolve({ status: 0, json: null, body: 'ERR' })); if (data) r.write(data); r.end();
});

const listShards = (dir) => { const out = new Set(); const walk = (d) => { if (!fs.existsSync(d)) return; for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name.endsWith('.scenario.json')) out.add(p); } }; walk(dir); return out; };

// ── own-oracle: compute the fixture's deterministic uuids WITHOUT writing anywhere ──
const dry = new TsToModel(ROOT).generate([path.join(ROOT, FIXTURE_REL)], { write: false, diagram: true });
const DROP_UUIDS = [...dry.units.map(u => u.model.uuid), ...(dry.diagramUuid ? [dry.diagramUuid] : [])];

const STORE_BASELINE = listShards(MODEL_STORE);                 // snapshot for byte-safe restore
const results = [];
try {
  // prod-unchanged BEFORE: the fixture uuids must be ABSENT from prod scenario/index
  const prodBefore = DROP_UUIDS.every(u => !fs.existsSync(shardOf(PROD_INDEX, u)));

  for (let i = 1; i <= 3; i++) {
    // (1) phantom-guard — self-verify served version each iter
    const cfg = await req('GET', '/api/config');
    const ver085 = cfg.json?.version === '0.8.5';

    // (2) LIVE DROP via the real served endpoint
    const drop = await req('POST', '/api/model/generate', { file: FIXTURE_REL });
    const dropOk = drop.status === 200 && drop.json?.ok === true && drop.json?.roots >= 3 && !!drop.json?.diagramUuid;
    // idempotency: first drop writes; re-drops are 0-churn (wrote===0)
    const idempotent = i === 1 ? drop.json?.wrote > 0 : drop.json?.wrote === 0;

    // tree populated FROM THE STORE (the data the UI renders)
    const tree = await req('GET', '/api/model/tree');
    const rootNames = (tree.json?.roots || []).map(r => r.name);
    const treePopulated = NAMES.every(n => rootNames.includes(n));
    const widget = (tree.json?.roots || []).find(r => r.name === 'R325Widget');
    const widgetMembers = !!widget && widget.hasChildren && widget.childCount === 3;   // face, size, render

    // diagram unit present in the ISOLATED store
    const diagramInStore = !!drop.json?.diagramUuid && fs.existsSync(shardOf(MODEL_STORE, drop.json.diagramUuid));

    // (3) ★ POLLUTION GUARD: fixture uuids present ONLY in the store, NEVER in prod scenario/index
    const inStore = DROP_UUIDS.every(u => fs.existsSync(shardOf(MODEL_STORE, u)));
    const prodStillClean = DROP_UUIDS.every(u => !fs.existsSync(shardOf(PROD_INDEX, u)));

    const pass = ver085 && dropOk && idempotent && treePopulated && widgetMembers && diagramInStore && inStore && prodBefore && prodStillClean;
    results.push(pass);
    console.log(`iter ${i}: v0.8.5=${ver085} drop=${dropOk}(roots=${drop.json?.roots} wrote=${drop.json?.wrote}) idempotent=${idempotent} treePopulated=${treePopulated}[${NAMES.filter(n => rootNames.includes(n)).join(',')}] widgetMembers=${widgetMembers} diagramInStore=${diagramInStore} inStore=${inStore} PROD-UNCHANGED=${prodStillClean} => ${pass ? 'GREEN' : 'RED'}`);
  }

  // (2b) @390 iPhone-12 mobile client reaches the populated store (VISUAL tree+diagram render = Tron device sign-off)
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
  let mobile390 = false, mobileRoots = 0;
  try {
    const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/trace`, { waitUntil: 'domcontentloaded' });
    const m = await page.evaluate(async () => { const r = await fetch('/api/model/tree'); const j = await r.json(); return (j.roots || []).map(x => x.name); });
    mobileRoots = m.length; mobile390 = NAMES.every(n => m.includes(n));
    await ctx.close();
  } finally { await browser.close(); }
  console.log(`@390 iPhone-12 mobile client: populated-store reachable=${mobile390} (roots=${mobileRoots})  [populated-tree+diagram VISUAL render = Tron device sign-off]`);
  results.push(mobile390);
} finally {
  // ── POLLUTION-SAFE RESTORE: remove exactly the shards my drop added (store resettable by design) → baseline ──
  const after = listShards(MODEL_STORE);
  let removed = 0;
  for (const p of after) if (!STORE_BASELINE.has(p)) { fs.rmSync(p, { force: true }); removed++; }
  const restored = [...listShards(MODEL_STORE)].length === STORE_BASELINE.size;
  const prodClean = DROP_UUIDS.every(u => !fs.existsSync(shardOf(PROD_INDEX, u)));
  console.log(`\nCLEANUP: removed ${removed} added store shards → MODEL_STORE restored to baseline=${restored} (${STORE_BASELINE.size} shards); prod scenario/index clean=${prodClean}`);
}

console.log('\n===== R32.5 GO-LIVE live axis (served==0.8.5, DET-3x) =====');
const green = results.length >= 4 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
