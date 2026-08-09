// [test:uuid:644bb935-ebea-4759-b0fc-813fd70e35ff] R32.7 PUML export/import round-trip — verifies modelToPuml (Impl 8462f889) + pumlToModel (import): export each element ONCE + arrows by M2 kind (<|-- gen / --> assoc / ..> dep) + byte-identical deterministic re-export + round-trip parse→serialize→parse STABLE same-uuid (embedded [model:uuid:X] re-binds, no re-mint) + INV-P4 pure/no-fs. Own-oracle imports the REAL modelToPuml/pumlToModel + planted-defect bites (dup-must-collapse, strip-embed→re-mint-fallback proves re-bind real). → req wires this Test onto Impl 8462f889 (modelToPuml, distinct serializer logic — NOT R32.2/4-6).
// R32.7 PUML export/import — INDEPENDENT own-oracle, CODE axis (client-only isomorphic), DET-3x. Imports the REAL
// modelToPuml + pumlToModel (src/ts/shared/puml-serializer.ts) and drives a synthetic model (reuses the r325 shape:
// Widget extends Base = gen, face:Iface = assoc, render():Iface = dep — all 3 kinds). Measured DIFFERENTLY than the
// expert tsx: own model + planted-defect bites (dup-must-collapse, re-import-must-re-bind-not-re-mint) + source-audit
// isolation. ACs: (1) export each element ONCE + arrows by kind (<|-- gen / --> assoc / ..> dep); (2) re-export
// BYTE-IDENTICAL (deterministic order — shuffled input → same output); (3) round-trip parse→serialize→parse STABLE
// same-uuid (embedded [model:uuid:X] re-binds, no re-mint); (4) INV-P4 isolation (pure module, no fs write).
// → req IMPL-MINTs the R32.7 chain onto modelToPuml/pumlToModel (NOT re-crediting R32.2/4-6) + wires this Test.
import { modelToPuml, pumlToModel, type PumlNode, type PumlRelation } from '../../src/ts/shared/puml-serializer.ts';
import { readFileSync } from 'node:fs';

const BASE: PumlNode = { uuid: 'aaaa1111-1111-4111-8111-111111111111', name: 'Base', kind: 'class', attrs: [], methods: [] };
const IFACE: PumlNode = { uuid: 'bbbb2222-2222-4222-8222-222222222222', name: 'Iface', kind: 'interface', attrs: ['id: string'], methods: [] };
const WIDGET: PumlNode = { uuid: 'cccc3333-3333-4333-8333-333333333333', name: 'Widget', kind: 'class', attrs: ['face: Iface', 'size: number'], methods: ['render'] };
const NODES: PumlNode[] = [WIDGET, BASE, IFACE];                       // unsorted → exercises deterministic sort
const RELS: PumlRelation[] = [
  { from: WIDGET.uuid, to: BASE.uuid, kind: 'generalization' },
  { from: WIDGET.uuid, to: IFACE.uuid, kind: 'association' },
  { from: WIDGET.uuid, to: IFACE.uuid, kind: 'dependency' },
];
const cnt = (s: string, sub: string) => s.split(sub).length - 1;
const uuidByName = (els: PumlNode[], n: string) => els.find(e => e.name === n)?.uuid;

function runOnce() {
  const puml = modelToPuml(NODES, RELS);

  // (1) export each element ONCE + arrows by kind
  const exportOnce = cnt(puml, 'class Base {') === 1 && cnt(puml, 'interface Iface {') === 1 && cnt(puml, 'class Widget {') === 1
    && (puml.match(/^(class|interface) /gm) || []).length === 3;
  const arrowsByKind = puml.includes('Base <|-- Widget') && puml.includes('Widget --> Iface') && puml.includes('Widget ..> Iface');
  const embedsUuid = puml.includes(`[model:uuid:${WIDGET.uuid}]`) && puml.includes(`[model:uuid:${IFACE.uuid}]`);

  // (2) re-export byte-identical + deterministic (shuffled input → same output)
  const puml2 = modelToPuml([...NODES].reverse(), [...RELS].reverse());
  const deterministic = puml === puml2 && puml === modelToPuml(NODES, RELS);

  // (3) round-trip parse→serialize→parse STABLE same-uuid (embedded re-bind, no re-mint)
  const parsed = pumlToModel(puml);
  const reExport = modelToPuml(parsed.elements, parsed.relations);
  const byteIdenticalRT = reExport === puml;
  const sameUuid = uuidByName(parsed.elements, 'Widget') === WIDGET.uuid && uuidByName(parsed.elements, 'Base') === BASE.uuid && uuidByName(parsed.elements, 'Iface') === IFACE.uuid;
  const p2 = pumlToModel(puml);                                        // import TWICE → same uuids, no dup (re-bind, no re-mint)
  const stableReimport = p2.elements.length === 3 && uuidByName(p2.elements, 'Widget') === WIDGET.uuid && p2.elements.length === parsed.elements.length;
  const relsRoundTrip = parsed.relations.some(r => r.from === WIDGET.uuid && r.to === BASE.uuid && r.kind === 'generalization') // gen swap round-trips (Base <|-- Widget → from=Widget,to=Base)
    && parsed.relations.some(r => r.from === WIDGET.uuid && r.to === IFACE.uuid && r.kind === 'association')
    && parsed.relations.some(r => r.from === WIDGET.uuid && r.to === IFACE.uuid && r.kind === 'dependency')
    && parsed.relations.length === 3;

  // (4) INV-P4 isolation — pure module, NO fs/I-O (source-audit: the shared serializer imports/writes nothing)
  const src = readFileSync(`${'/var/dev/Workspaces/web4x/Web4RawBin'}/src/ts/shared/puml-serializer.ts`, 'utf8');
  const pureNoIo = !/from ['"]node:fs['"]|require\(['"]fs['"]\)|writeFileSync|writeFile\(|fs\./.test(src);

  // ── PLANTED-DEFECT BITES ──
  // dedup: duplicate node (same uuid) + duplicate relation → collapse to the unique set (not doubled)
  const dupPuml = modelToPuml([...NODES, WIDGET, BASE], [...RELS, RELS[0]]);
  const biteDedup = (dupPuml.match(/^(class|interface) /gm) || []).length === 3 && cnt(dupPuml, 'Base <|-- Widget') === 1;
  // re-bind: STRIP the [model:uuid:X] comments → pumlToModel MUST fall back to a DIFFERENT (pumlUuid) id ≠ the original
  const stripped = puml.replace(/^' \[model:uuid:[0-9a-f-]+\] \w+$/gm, '');
  const fb = uuidByName(pumlToModel(stripped).elements, 'Widget');
  const biteRebind = sameUuid && fb !== WIDGET.uuid && !!fb;           // with-embed = original; without-embed = fallback (≠) → re-bind is REAL

  return { exportOnce, arrowsByKind, embedsUuid, deterministic, byteIdenticalRT, sameUuid, stableReimport, relsRoundTrip, pureNoIo, biteDedup, biteRebind };
}

const results: boolean[] = [];
for (let i = 1; i <= 3; i++) {
  const o = runOnce();
  const pass = Object.values(o).every(Boolean);
  results.push(pass);
  console.log(`iter ${i}: exportOnce=${o.exportOnce} arrowsByKind=${o.arrowsByKind} embedsUuid=${o.embedsUuid} deterministic=${o.deterministic} byteIdenticalRT=${o.byteIdenticalRT} sameUuid=${o.sameUuid} stableReimport=${o.stableReimport} relsRoundTrip=${o.relsRoundTrip} pureNoIo=${o.pureNoIo} | BITES dedup=${o.biteDedup} rebind=${o.biteRebind} => ${pass ? 'GREEN' : 'RED'}`);
}

console.log('\n===== R32.7 PUML round-trip own-oracle (CODE axis, DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
