// [test:uuid:af3e515f-2d3c-473c-b33f-853ea5e03555] R32.8 action-driven re-sync (Sprint-32 finale) — verifies the re-sync/reconcile: edit source → re-invoke generate on the isolated store → tree+diagram+edges+puml ALL reflect (S4), add→appears/remove→DISAPPEARS not stale-retained (S2 reconcile bite + bidirectional), re-sync unchanged → 0 churn/0 dup same-uuid (S1 idempotent), prod scenario/index UNCHANGED (S3 isolation). Own-oracle imports the REAL generate+buildEdges+modelToPuml on an isolated scratch. → req wires this Test onto the R32.8 sync Impl ONCE the architect mints UC→Class→Method→Impl (task 270 open; #126 chain-first — do NOT wire while the chain is unminted).
// R32.8 action-driven re-sync (Sprint-32 FINALE) — INDEPENDENT own-oracle, DET-3x. Ties the WHOLE MDA stack:
// generate (R32.2) → tree (R32.3) → diagram+edges (R32.4/6) → PUML (R32.7). Edit source → re-invoke generate on an
// ISOLATED SCRATCH indexDir (NOT prod scenario/index, NOT the live MODEL_STORE — pollution-IMPOSSIBLE by construction;
// scratch is my scratchpad, so even a timeout leaks nothing Tron-visible) + an EXTERNAL post-run prod-absence assert.
// ACs: S4 all-views-consistent (tree+diagram+edges+puml ALL reflect the edit); S2 reconcile bite (add→appears / remove→
// DISAPPEARS not stale-retained; + bidirectional re-add); S1 same-uuid idempotent (re-sync unchanged → 0 churn/0 dup);
// S3 isolation (prod scenario/index UNCHANGED). Imports the REAL generate/buildEdges/modelToPuml + planted-defect bite.
// ⚠ R32.8 scenario chain UNMINTED (row: check|open architect|open×4, task 270) → this GATES BEHAVIOR + places a ready
// marker; the Test wires only after the architect mints UC→Class→Method→Impl + req IMPL-MINTs (#126 chain-first).
import { TsToModel } from '../../src/ts/scenario/TsToModel.ts';
import { buildEdges, stripRef, type ViewLink, type DiagramNode, type DiagramRelation } from '../../src/public/ts/trace/diagram-view-model.ts';
import { modelToPuml, type PumlNode, type PumlRelation } from '../../src/ts/shared/puml-serializer.ts';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin';
const PROD_INDEX = path.join(ROOT, 'scenario', 'index');
const MODEL_STORE = path.join(ROOT, 'data', 'model-store', 'index');
const SCRATCH = '/tmp/claude-0/-var-dev-Workspaces-AI-Claude/dd6c6fae-b1a2-4ce7-8a87-6a8cac45eff4/scratchpad/r328-resync';
const IDX = path.join(SCRATCH, 'index');
const SRC = path.join(SCRATCH, 'drop.ts');
const shardOf = (base, uuid) => path.join(base, ...uuid.slice(0, 5).split(''), `${uuid}.scenario.json`);
const KIND = { 'a1d2e3f4-0000-4a1b-8c2d-000000000010': 'association', 'a1d2e3f4-0000-4a1b-8c2d-000000000011': 'generalization', 'a1d2e3f4-0000-4a1b-8c2d-000000000012': 'dependency' };

const V1 = `export class Base {}\nexport interface Iface { id: string; }\nexport class Widget extends Base { face: Iface; render(): Iface { return this.face; } }\n`;
const V2 = `export interface Iface { id: string; }\nexport class Widget { face: Iface; render(): Iface { return this.face; } }\nexport class Extra { tag: string; }\n`;   // Base REMOVED, Extra ADDED, Widget no longer extends Base
const V3 = `export class Base {}\nexport interface Iface { id: string; }\nexport class Widget extends Base { face: Iface; render(): Iface { return this.face; } }\nexport class Extra { tag: string; }\n`; // re-add Base

const syncTo = (src) => { fs.writeFileSync(SRC, src); return new TsToModel(ROOT).generate([SRC], { indexDir: IDX, write: true, diagram: true }); };
const byUuid = (units) => new Map(units.map(u => [u.model.uuid, u]));

// aggregate a class's edges = its own relations (heritage) + its members' typed relations (mirrors rb-diagram-detail)
const relsOf = (units, cls) => { const m = byUuid(units); const out = []; const add = (u) => { for (const r of (u.model.relations || [])) out.push({ to: stripRef(r.to), kind: KIND[stripRef(r.type)] || 'association' }); }; add(cls); for (const ref of (cls.model.members || [])) { const mm = m.get(stripRef(ref)); if (mm) add(mm); } return out; };
const nodeOf = (units) => { const m = byUuid(units); const mem = (u, kinds) => (u.model.members || []).map(r => m.get(stripRef(r))).filter(x => x && kinds.includes(x.model.kind)).map(x => x.model.name); return (u) => { const unit = m.get(stripRef(u)); if (!unit || !['class', 'interface'].includes(unit.model.kind)) return null; return { name: unit.model.name, kind: unit.model.kind, attrs: mem(unit, ['attribute', 'property']), methods: mem(unit, ['method']), relations: relsOf(units, unit) }; }; };

function views(r) {
  const units = r.units;
  const top = units.filter(u => !u.model.memberOf && ['class', 'interface', 'function', 'type'].includes(u.model.kind));
  const tree = top.map(u => u.model.name).sort();
  const dUnit = JSON.parse(fs.readFileSync(shardOf(IDX, r.diagramUuid), 'utf8'));
  const dViews = dUnit.model.views;
  const edges = buildEdges(dViews, nodeOf(units));
  const cls = units.filter(u => ['class', 'interface'].includes(u.model.kind));
  const pumlNodes = cls.map(u => ({ uuid: u.model.uuid, name: u.model.name, kind: u.model.kind, attrs: nodeOf(units)('modelelement:' + u.model.uuid).attrs, methods: nodeOf(units)('modelelement:' + u.model.uuid).methods }));
  const pumlRels = cls.flatMap(u => relsOf(units, u).map(rr => ({ from: u.model.uuid, to: rr.to, kind: rr.kind })));
  const puml = modelToPuml(pumlNodes, pumlRels);
  return { tree, diagramNames: dViews.map(v => byUuid(units).get(stripRef(v.unit))?.model.name).sort(), edgeSvg: edges.svg, edgeCount: edges.count, puml };
}
const has = (v, name) => v.tree.includes(name) && v.diagramNames.includes(name) && v.puml.includes(name);
const absent = (v, name) => !v.tree.includes(name) && !v.diagramNames.includes(name) && !v.puml.includes(`class ${name}`) && !v.puml.includes(`${name} <|--`);

const results = [];
try {
  const prodBefore = fs.existsSync(PROD_INDEX) ? [...fs.readdirSync(PROD_INDEX)].length : 0;
  for (let i = 1; i <= 3; i++) {
    fs.rmSync(SCRATCH, { recursive: true, force: true }); fs.mkdirSync(IDX, { recursive: true });
    const r1 = syncTo(V1); const v1 = views(r1);
    const r2 = syncTo(V2); const v2 = views(r2);       // EDIT + re-sync
    const uuids = [...r1.units, ...r2.units].map(u => u.model.uuid).concat([r1.diagramUuid, r2.diagramUuid]);

    // S4 all-views-consistent + S2 reconcile: Extra APPEARS in all views; Base DISAPPEARS from all views (not stale)
    const s4Added = has(v2, 'Extra') && has(v2, 'Widget') && has(v2, 'Iface');
    const s2Removed = absent(v2, 'Base') && r2.removed > 0 && !fs.existsSync(shardOf(IDX, r1.units.find(u => u.model.name === 'Base').model.uuid));
    const edgesReflect = v2.edgeCount === 2 && /dm-arrow-association/.test(v2.edgeSvg) && /dm-arrow-dependency/.test(v2.edgeSvg) && !/dm-edge-generalization/.test(v2.edgeSvg); // Widget→Iface assoc+dep; gen to Base GONE
    const pumlReflect = v2.puml.includes('class Extra') && !v2.puml.includes('class Base') && !v2.puml.includes('<|--');

    // S1 idempotent: re-sync V2 unchanged → 0 churn / 0 dup, uuids stable
    const r2b = syncTo(V2);
    const idempotent = r2b.wrote === 0 && r2b.removed === 0 && r2b.units.length === r2.units.length;

    // S2 bite bidirectional: re-add Base → REAPPEARS in all views + gen edge back
    const r3 = syncTo(V3); const v3 = views(r3);
    const biteBidirectional = has(v3, 'Base') && /dm-edge-generalization/.test(v3.edgeSvg) && v3.puml.includes('Base <|-- Widget');

    // S3 isolation: none of the scratch uuids leaked to prod scenario/index or the live MODEL_STORE
    const isolation = uuids.every(u => !fs.existsSync(shardOf(PROD_INDEX, u)) && !fs.existsSync(shardOf(MODEL_STORE, u)));

    const pass = s4Added && s2Removed && edgesReflect && pumlReflect && idempotent && biteBidirectional && isolation;
    results.push(pass);
    console.log(`iter ${i}: S4-added=${s4Added} S2-removed=${s2Removed}(removed=${r2.removed}) edgesReflect=${edgesReflect}(${v2.edgeCount}) pumlReflect=${pumlReflect} S1-idempotent=${idempotent}(wrote=${r2b.wrote}) bite-bidir=${biteBidirectional} S3-isolation=${isolation} => ${pass ? 'GREEN' : 'RED'}`);
  }
  const prodAfter = fs.existsSync(PROD_INDEX) ? [...fs.readdirSync(PROD_INDEX)].length : 0;
  const prodUnchanged = prodBefore === prodAfter;
  console.log(`S3 external: prod scenario/index top-level count ${prodBefore}→${prodAfter} unchanged=${prodUnchanged}`);
  results.push(prodUnchanged);
} finally {
  fs.rmSync(SCRATCH, { recursive: true, force: true });   // external cleanup — survives regardless (scratchpad, never the live store)
  console.log('CLEANUP: scratch removed (pollution-impossible by construction — never wrote prod or MODEL_STORE)');
}

console.log('\n===== R32.8 re-sync finale own-oracle (all-views-consistent + reconcile + idempotent + isolation, DET-3x) =====');
const green = results.length >= 4 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
