// R32.11 DnD onto diagram — the DROP effect (drag class → box ADDED), DET-3x. Gates POST /api/model/diagram/add-view
// (what onDropAddView→addView calls): INV-R1 append view (box), INV-R2 dedup (re-drop same → NO dup = the BITE), INV-R3
// isolation (MODEL_STORE only, prod scenario/index untouched), INV-R4 persist (survives = re-open), + edges when a related
// 2nd class is present + the select-class auto-grid complement (no coords). Own-oracle: real endpoint + real faa4acad on
// disk + imported buildEdges for the edge axis. POLLUTION-SAFE: byte-snapshot faa4acad, restore in finally (store-resettable).
// GATES THE DROP (drag→drop→box), not the label/generate. @390-relevant (client onDropAddView calls this same endpoint).
import { buildEdges, stripRef } from '../../src/public/ts/trace/diagram-view-model.ts';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin';
const PROD_INDEX = path.join(ROOT, 'scenario', 'index');
const MODEL_STORE = path.join(ROOT, 'data', 'model-store', 'index');
const FAA = 'faa4acad-41a6-48fc-ad0d-dd0044c123f7';
const CIRCLE = '54ea2a17-7b18-4d0f-ab41-feb6efe9ae64';       // a class in faa4acad (with relations)
const shardOf = (base, u) => path.join(base, ...u.slice(0, 5).split(''), `${u}.scenario.json`);
const FAA_FILE = shardOf(MODEL_STORE, FAA);
const KIND = { 'a1d2e3f4-0000-4a1b-8c2d-000000000010': 'association', 'a1d2e3f4-0000-4a1b-8c2d-000000000011': 'generalization', 'a1d2e3f4-0000-4a1b-8c2d-000000000012': 'dependency' };

const req = (method, pth, body) => new Promise((res) => { const data = body ? JSON.stringify(body) : null; const r = https.request({ host: 'prod.wo-da.de', port: 4444, path: pth, method, rejectUnauthorized: false, headers: body ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {} }, x => { let b = ''; x.on('data', c => b += c); x.on('end', () => { let j = null; try { j = JSON.parse(b); } catch { /* */ } res({ status: x.statusCode, json: j }); }); }); r.on('error', () => res({ status: 0 })); if (data) r.write(data); r.end(); });
const iorModel = (uuid) => req('GET', `/api/ior/ior:instance:${uuid}`).then(r => r.json?.unit?.model || null);
const version = () => req('GET', '/api/config').then(r => r.json?.version);
const readFaa = () => JSON.parse(fs.readFileSync(FAA_FILE, 'utf8'));
const writeFaa = (u) => fs.writeFileSync(FAA_FILE, JSON.stringify(u, null, 2) + '\n');

// buildEdges on a diagram's views: nodeOf resolves each view element (+ its members' relations) via /api/ior
async function edgeCount(views) {
  const byUuid = new Map();
  for (const v of views) { const u = stripRef(v.unit); byUuid.set(u, await iorModel(u)); const m = byUuid.get(u); if (m?.members) for (const mr of m.members) byUuid.set(stripRef(mr), await iorModel(stripRef(mr))); }
  const relsOf = (u) => { const out = []; const add = (mm) => { for (const r of (mm?.relations || [])) out.push({ to: stripRef(r.to), kind: KIND[stripRef(r.type)] || 'association' }); }; const m = byUuid.get(u); add(m); for (const mr of (m?.members || [])) add(byUuid.get(stripRef(mr))); return out; };
  const nodeOf = (uu) => { const u = stripRef(uu); const m = byUuid.get(u); if (!m || !['class', 'interface'].includes(m.kind)) return null; return { name: m.name, kind: m.kind, attrs: [], methods: [], relations: relsOf(u) }; };
  return buildEdges(views, nodeOf).count;
}

const BASELINE = fs.readFileSync(FAA_FILE, 'utf8');            // byte-snapshot for pollution-safe restore
const results = [];
try {
  const ver = (await version()) === '0.8.11';
  const prodClean0 = !fs.existsSync(shardOf(PROD_INDEX, FAA)) && !fs.existsSync(shardOf(PROD_INDEX, CIRCLE)); // INV-R3: model units live ONLY in the store
  for (let i = 1; i <= 3; i++) {
    fs.writeFileSync(FAA_FILE, BASELINE);                      // reset to baseline each iter
    // simulate "Circle not yet in the diagram": remove its view on disk (2 views left)
    const pre = readFaa(); const kept = pre.model.views.filter(v => stripRef(v.unit) !== CIRCLE); pre.model.views = kept; writeFaa(pre);
    const edgesWithout = await edgeCount(kept);

    // INV-R1 ADD (drop a class → box added at drop coords)
    const add = await req('POST', '/api/model/diagram/add-view', { diagramUuid: FAA, elementUuid: CIRCLE, x: 100, y: 130 });
    const afterAdd = readFaa().model.views;
    const added = add.json?.added === true && add.json?.views === kept.length + 1 && afterAdd.some(v => stripRef(v.unit) === CIRCLE && v.x === 100 && v.y === 130);

    // INV-R2 DEDUP (the BITE): re-drop the SAME class → NO dup
    const dup = await req('POST', '/api/model/diagram/add-view', { diagramUuid: FAA, elementUuid: CIRCLE, x: 5, y: 5 });
    const afterDup = readFaa().model.views;
    const dedup = dup.json?.added === false && dup.json?.views === kept.length + 1 && afterDup.filter(v => stripRef(v.unit) === CIRCLE).length === 1;

    // 2nd class → edges: re-adding the related Circle raises the diagram's edge count
    const edgesWith = await edgeCount(afterDup);
    const edgesGrew = edgesWith > edgesWithout;

    // INV-R4 persist: the view is on disk (survives a re-read = re-open)
    const persisted = readFaa().model.views.some(v => stripRef(v.unit) === CIRCLE);
    // INV-R3 isolation: prod scenario/index still has neither the diagram nor the element
    const prodClean = !fs.existsSync(shardOf(PROD_INDEX, FAA)) && !fs.existsSync(shardOf(PROD_INDEX, CIRCLE));

    // select-class AUTO-GRID complement: add-view a NOT-yet-present element with NO coords → auto-grid ((n%3)*220+20, floor(n/3)*200+20)
    const ID = 'f51234b0-0233-4fd6-a802-5467f64accc2'; // 'Id' store element, NOT in faa4acad
    const n = afterDup.length; const auto = await req('POST', '/api/model/diagram/add-view', { diagramUuid: FAA, elementUuid: ID });
    const autoView = readFaa().model.views.find(v => stripRef(v.unit) === ID);
    const autoGrid = auto.json?.added === true && autoView && autoView.x === (n % 3) * 220 + 20 && autoView.y === Math.floor(n / 3) * 200 + 20;

    const pass = ver && prodClean0 && added && dedup && edgesGrew && persisted && prodClean && autoGrid;
    results.push(pass);
    console.log(`iter ${i}: v0.8.11=${ver} ADD(INV-R1)=${added} DEDUP-bite(INV-R2)=${dedup} edges(2nd-class)=${edgesGrew}(${edgesWithout}→${edgesWith}) persist(INV-R4)=${persisted} isolation(INV-R3)=${prodClean} auto-grid-complement=${autoGrid} => ${pass ? 'GREEN' : 'RED'}`);
  }
} finally {
  fs.writeFileSync(FAA_FILE, BASELINE);                        // RESTORE faa4acad byte-perfect (pollution-safe)
  const restored = fs.readFileSync(FAA_FILE, 'utf8') === BASELINE;
  console.log(`\nCLEANUP: faa4acad restored to baseline byte-perfect=${restored} (${JSON.parse(BASELINE).model.views.length} views)`);
}

console.log('\n===== R32.11 DnD-onto-diagram DROP (INV-R1/R2/R3/R4 + edges + auto-grid, DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
console.log('Client @390 drag→drop→box visual = the R32.4/6 diagram render (Tron device); this gates the DROP EFFECT the client onDropAddView invokes. Pollution-safe (faa4acad restored).');
process.exitCode = green ? 0 : 1;
