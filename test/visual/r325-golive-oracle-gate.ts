// R32.5 GO-LIVE own-oracle (SAFE: no prod, no served dependency). Imports the REAL TsToModel.generate
// (Impl 382f8644) + REAL buildDiagramSvg (Impl ba96a744) and proves the drop→M1→tree/diagram pipeline against an
// ISOLATED scratchpad indexDir — never prod scenario/index, never the live MODEL_STORE. Measured DIFFERENTLY than the
// expert's build-check: import the exported pure code + own synthetic source + planted-defect bite (anti-green-wash) +
// uuid-level isolation proof. The served/live-UI axis (@390 populated tree+diagram) is HELD for served==0.8.5 (phantom-guard).
// ACs covered here: drop→M1 (classes/iface/members/relations), M1→tree roots+nesting, M1→diagram (Diagram unit views →
// buildDiagramSvg), ISOLATION (generated uuids exist ONLY in scratch — not prod index, not MODEL_STORE), determinism/idempotency.
import { TsToModel } from '../../src/ts/scenario/TsToModel.ts';
import { buildDiagramSvg, type ViewLink, type DiagramNode } from '../../src/public/ts/trace/diagram-view-model.ts';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin';
const PROD_INDEX = path.join(ROOT, 'scenario', 'index');
const MODEL_STORE = path.join(ROOT, 'data', 'model-store', 'index');   // the live isolated store real drops write to — MUST stay untouched
const SCRATCH = '/tmp/claude-0/-var-dev-Workspaces-AI-Claude/dd6c6fae-b1a2-4ce7-8a87-6a8cac45eff4/scratchpad/r325-oracle';
const shardOf = (base: string, uuid: string) => path.join(base, ...uuid.slice(0, 5).split(''), `${uuid}.scenario.json`);

// synthetic source → deterministic model: 2 classes + 1 interface, members, heritage + typed-member relationships
const SYNTH = `export class Base {}
export interface Baz { id: string; }
export class Foo extends Base {
  bar: Baz;
  count: number;
  qux(): Baz { return this.bar; }
}
`;
const SYNTH_DEFECT = `export class Empty {}\n`; // planted-defect bite: no members, one root, no relations

const uuidsOf = (r: { units: any[]; diagramUuid?: string }) => [...r.units.map(u => u.model.uuid), ...(r.diagramUuid ? [r.diagramUuid] : [])];

function generate(src: string, indexDir: string) {
  fs.rmSync(SCRATCH, { recursive: true, force: true });
  fs.mkdirSync(SCRATCH, { recursive: true });
  const srcFile = path.join(SCRATCH, 'drop.ts');
  fs.writeFileSync(srcFile, src);
  // write:true → sharded to the ISOLATED scratch indexDir; diagram:true → also a demo Diagram unit
  return new TsToModel(ROOT).generate([srcFile], { indexDir, write: true, diagram: true });
}

// nodeOf for buildDiagramSvg: resolve a view.unit ('modelelement:<uuid>') to its UML compartments from the generated units
function nodeOfFrom(units: any[]): (u: string) => DiagramNode | null {
  const byUuid = new Map(units.map(u => [u.model.uuid, u]));
  const members = (parent: any, kinds: string[]) => (parent.model.members || [])
    .map((ref: string) => byUuid.get(String(ref).replace(/^.*[:/]/, '')))
    .filter((m: any) => m && kinds.includes(m.model.kind))
    .map((m: any) => m.model.name);
  return (u: string) => {
    const uuid = String(u).replace(/^modelelement:/, '');
    const unit = byUuid.get(uuid);
    if (!unit || (unit.model.kind !== 'class' && unit.model.kind !== 'interface')) return null;
    return { name: unit.model.name, kind: unit.model.kind, attrs: members(unit, ['attribute', 'property']), methods: members(unit, ['method']) };
  };
}

function runOnce() {
  const IDX = path.join(SCRATCH, 'index');
  const r = generate(SYNTH, IDX);
  const top = r.units.filter(u => !u.model.memberOf);
  const byName = (n: string) => r.units.find(u => u.model.name === n);
  const foo = byName('Foo'), baz = byName('Baz'), base = byName('Base');

  // ── drop→M1 ──
  const m1 = !!foo && !!baz && !!base
    && foo.model.kind === 'class' && baz.model.kind === 'interface' && base.model.kind === 'class'
    && (foo.model.members || []).length === 3 && (baz.model.members || []).length === 1
    && r.units.length === 7 && r.wrote > 0
    && (foo.model.relatesTo || []).length >= 1                       // Foo → Base (Generalization) + typed members
    && r.units.some(u => (u.model.relations || []).length >= 1);     // at least one typed-member relationship resolved

  // ── M1→tree (roots = top-level class/interface/function/type; members nest) ──
  const roots = top.filter(u => ['class', 'interface', 'function', 'type'].includes(u.model.kind));
  const tree = roots.length === 3
    && (foo.model.members || []).length > 0 && (baz.model.members || []).length > 0
    && (base.model.members || []).length === 0;                      // Base has no children

  // ── M1→diagram (Diagram unit views → REAL buildDiagramSvg) ──
  const dShard = shardOf(IDX, r.diagramUuid!);
  const dUnit = fs.existsSync(dShard) ? JSON.parse(fs.readFileSync(dShard, 'utf8')) : null;
  const views: ViewLink[] = (dUnit?.model?.views || []) as ViewLink[];
  const { svg, count } = buildDiagramSvg(views, nodeOfFrom(r.units));
  const diagram = !!r.diagramUuid && views.length === 3 && count === 3
    && svg.includes('Foo') && svg.includes('Base') && svg.includes('Baz')
    && /«interface»\s*Baz/.test(svg) && /^<svg/.test(svg);

  // ── ISOLATION: every generated uuid exists ONLY in scratch — never prod index, never the live MODEL_STORE ──
  const uu = uuidsOf(r);
  const inScratch = uu.every(u => fs.existsSync(shardOf(IDX, u)));
  const notInProd = uu.every(u => !fs.existsSync(shardOf(PROD_INDEX, u)));
  const notInStore = uu.every(u => !fs.existsSync(shardOf(MODEL_STORE, u)));
  const isolation = inScratch && notInProd && notInStore;

  fs.rmSync(SCRATCH, { recursive: true, force: true });
  return { m1, tree, diagram, isolation, uuids: uu.sort(), svgLen: svg.length, diagramCount: count };
}

// ── PLANTED-DEFECT BITE (anti-green-wash): the SAME oracle on a defect input must MOVE — 1 root, 0 members, diagram count 1 ──
function bite() {
  const IDX = path.join(SCRATCH, 'index-defect');
  const r = generate(SYNTH_DEFECT, IDX);
  const top = r.units.filter(u => !u.model.memberOf);
  const dShard = shardOf(IDX, r.diagramUuid!);
  const dUnit = fs.existsSync(dShard) ? JSON.parse(fs.readFileSync(dShard, 'utf8')) : null;
  const { count } = buildDiagramSvg((dUnit?.model?.views || []) as ViewLink[], nodeOfFrom(r.units));
  fs.rmSync(SCRATCH, { recursive: true, force: true });
  // discrimination: the rich-model expectations do NOT hold for the defect input → the checks are non-vacuous
  const caught = top.length === 1 && r.units.length === 1 && count === 1
    && r.units.every(u => (u.model.relations || []).length === 0);
  return caught;
}

const results: boolean[] = [];
let firstUuids = '';
for (let i = 1; i <= 3; i++) {
  const o = runOnce();
  const biteCaught = bite();
  if (i === 1) firstUuids = o.uuids.join(',');
  const deterministic = o.uuids.join(',') === firstUuids;                 // deterministic uuids across runs = idempotent re-drop
  const pass = o.m1 && o.tree && o.diagram && o.isolation && biteCaught && deterministic;
  results.push(pass);
  console.log(`iter ${i}: drop→M1=${o.m1} M1→tree=${o.tree} M1→diagram=${o.diagram}(count=${o.diagramCount},svg=${o.svgLen}b) ISOLATION=${o.isolation} biteCaught=${biteCaught} det=${deterministic} => ${pass ? 'GREEN' : 'RED'}`);
}

console.log('\n===== R32.5 GO-LIVE own-oracle (drop→M1→tree/diagram, ISOLATED, DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
console.log('HELD for served==0.8.5: live-UI @390 populated tree+diagram + BEFORE/AFTER prod ModelElement count-unchanged on the REAL drop (Tron device demo = his sign-off).');
process.exitCode = green ? 0 : 1;
