// R32.7 PUML export/import — ONE shared PURE module (client + server; NO I/O — persistence is the caller's,
// into the R32.5 ISOLATED store, INV-P4). Design b9895358d / req b1fef048. PARALLEL to buildDiagramSvg (same
// model, PUML sink instead of SVG). Reuses the EdgeKind vocabulary (type-only import → erased, no runtime cross-dep).
// INV-P1 same-uuid-across-M (identity embedded in the .puml), P2 reuse-not-remint (import binds the embedded uuid),
// P3 round-trip byte-identical (deterministic order + no timestamps), P4 isolation (caller persists to isolated store).
import type { EdgeKind } from '../../public/ts/trace/diagram-view-model.js';
import type { M1Unit } from '../scenario/TsToModel.js'; // type-only (erased) — the derived M2 ModelElement unit shape

export interface PumlNode { uuid: string; name: string; kind: string; attrs: string[]; methods: string[]; }
export interface PumlRelation { from: string; to: string; kind: EdgeKind } // from/to = element UUIDs

// PUML relation syntax per kind — MIRRORS EDGE_DEFS arrowheads: generalization=hollow-triangle `<|--`,
// association=open `-->`, dependency=open+dashed `..>`. (generalization is written parent<|--child.)
const REL_OUT: Record<EdgeKind, (fromName: string, toName: string) => string> = {
  generalization: (f, t) => `${t} <|-- ${f}`,
  association: (f, t) => `${f} --> ${t}`,
  dependency: (f, t) => `${f} ..> ${t}`,
};

// Deterministic v4-shaped id for a FRESH puml class lacking an embedded uuid (client-safe: pure JS, NO node:crypto).
// Distinct identity-space from R32.2 TS-derived uuids by design (puml-scoped key); only the fallback — an exported
// .puml carries its uuid, so the round-trip re-binds by the embedded id (INV-P1), never hitting this.
function pumlUuid(name: string): string {
  const key = `puml::${name}`;
  const seg = (salt: number): string => { let h = (0x811c9dc5 ^ salt) >>> 0; for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return (h >>> 0).toString(16).padStart(8, '0'); };
  const hx = seg(1) + seg(2) + seg(3) + seg(4);
  return `${hx.slice(0, 8)}-${hx.slice(8, 12)}-4${hx.slice(13, 16)}-a${hx.slice(17, 20)}-${hx.slice(20, 32)}`;
}

// [impl:uuid:8462f889-1d56-4a59-adad-f88287b9f9ce] PumlSerializer.modelToPuml (Method f13a6144, Class 59bdb00e, off UC e3c310e2 puml.export)
// EXPORT — model → @startuml. Each element ONCE (seenClasses); relations de-dup by from->to:kind. DETERMINISTIC
// ORDER (classes by name,uuid; members declared-order; relations by from,to,kind) → byte-identical re-export (INV-P3).
// The [model:uuid:X] comment carries identity so import re-binds to the same unit (INV-P1/P2).
export function modelToPuml(nodes: PumlNode[], relations: PumlRelation[]): string {
  const byUuid = new Map(nodes.map((n) => [n.uuid, n]));
  const seenClasses = new Set<string>();
  const classes = [...nodes].sort((a, b) => a.name.localeCompare(b.name) || a.uuid.localeCompare(b.uuid));
  const lines: string[] = ['@startuml'];
  for (const n of classes) {
    if (seenClasses.has(n.uuid)) continue; seenClasses.add(n.uuid);
    lines.push(`' [model:uuid:${n.uuid}] ${n.name}`);
    const kw = n.kind === 'interface' ? 'interface' : 'class';
    lines.push(`${kw} ${n.name} {`);
    for (const a of n.attrs) lines.push(`  ${a}`);
    for (const m of n.methods) lines.push(`  ${m}()`);
    lines.push('}');
  }
  const seenRel = new Set<string>();
  const rels = [...relations].sort((a, b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to) || a.kind.localeCompare(b.kind));
  for (const r of rels) {
    const from = byUuid.get(r.from), to = byUuid.get(r.to);
    if (!from || !to) continue; // both endpoints must be emitted classes (mirror buildEdges both-on-diagram)
    const key = `${r.from}->${r.to}:${r.kind}`;
    if (seenRel.has(key)) continue; seenRel.add(key);
    lines.push(REL_OUT[r.kind](from.name, to.name));
  }
  lines.push('@enduml');
  return lines.join('\n') + '\n';
}

// Sprint 41 T41.6 inc-2 — the derived M2 UmlClass (deriveClassM2's ModelElement units) → PUML. Maps the M1 ModelElement
// graph onto PumlNode/PumlRelation and REUSES modelToPuml (no fork, no second serializer). A classifier unit (kind
// class/interface) becomes a node; its members[] resolve to attrs (attribute/property) + methods (method/function) BY
// THE DERIVATION'S OWN STRUCTURE (attrs land wherever TS put them — e.g. on the FileModel interface — never hardcoded);
// relations[] map the M2 edge-type uuid → EdgeKind. PURE (no I/O; the caller writes file.puml into the isolated store).
const M2_EDGE_TO_KIND: Record<string, EdgeKind> = {
  'a1d2e3f4-0000-4a1b-8c2d-000000000010': 'association',
  'a1d2e3f4-0000-4a1b-8c2d-000000000011': 'generalization',
  'a1d2e3f4-0000-4a1b-8c2d-000000000012': 'dependency',
};
// [impl:uuid:PENDING-req-mint] PumlSerializer.classM2Puml — derived M2 UmlClass units → @startuml (reuses modelToPuml)
export function classM2Puml(units: M1Unit[]): string {
  const byUuid = new Map(units.map((u) => [u.model.uuid, u.model]));
  const nodes: PumlNode[] = [];
  const relations: PumlRelation[] = [];
  for (const u of units) {
    const m = u.model;
    if (m.kind !== 'class' && m.kind !== 'interface') continue; // only classifiers become PUML nodes; members ride their owner
    const attrs: string[] = []; const methods: string[] = [];
    for (const memRef of m.members || []) {
      const mem = byUuid.get(String(memRef).replace(/^ior:instance:/, '')); // members are ior:instance:<uuid> refs; byUuid is keyed by bare uuid (T41.6 inc-3: real deriveClassM2 emits prefixed refs — a bare-only lookup silently dropped every member = empty boxes)
      if (!mem) continue;
      if (mem.kind === 'method' || mem.kind === 'function') methods.push(mem.name);
      else if (mem.kind === 'attribute' || mem.kind === 'property') attrs.push(mem.name);
    }
    nodes.push({ uuid: m.uuid, name: m.name, kind: m.kind, attrs, methods });
    // Class-diagram edges are between CLASSES: emit the box's own relations AND HOIST its members' relations (a method's
    // return-type dependency renderSelf→FileViewModel becomes the owning class's dependency File→FileViewModel) — so the
    // diagram shows EVERY derived edge (T41.6 inc-3 consistency: a member-level edge dropped = a silent omission).
    const edgeSrc = [m, ...(m.members || []).map((mr) => byUuid.get(String(mr).replace(/^ior:instance:/, ''))).filter(Boolean) as typeof m[]];
    const seenEdge = new Set<string>();
    for (const src of edgeSrc) for (const r of src.relations || []) {
      const kind = M2_EDGE_TO_KIND[String(r.type).replace(/^ior:instance:/, '')]; // r.type is an ior:instance:<M2-uuid> ref; the table is keyed by BARE uuid (prefix mismatch = every edge silently dropped)
      const toBare = String(r.to).replace(/^ior:instance:/, '');
      if (!kind || toBare === m.uuid) continue; // skip self-edges (a class depending on itself = noise)
      const key = `${toBare}:${kind}`;
      if (seenEdge.has(key)) continue; seenEdge.add(key);
      relations.push({ from: m.uuid, to: toBare, kind }); // to = BARE uuid (PumlRelation.to is a bare element uuid; modelToPuml resolves by bare — a prefixed ref would drop the edge)
    }
  }
  return modelToPuml(nodes, relations);
}

const REL_IN: { re: RegExp; kind: EdgeKind; swap: boolean }[] = [
  { re: /^(\w[\w.]*)\s*<\|--\s*(\w[\w.]*)$/, kind: 'generalization', swap: true }, // Parent <|-- Child ⇒ from=Child,to=Parent
  { re: /^(\w[\w.]*)\s*-->\s*(\w[\w.]*)$/, kind: 'association', swap: false },
  { re: /^(\w[\w.]*)\s*\.\.>\s*(\w[\w.]*)$/, kind: 'dependency', swap: false },
];

// [impl:uuid:e85bc60a-5c2b-4180-9d10-fb09bf195fba] PumlSerializer.pumlToModel (Method 31cd0acb, Class 59bdb00e, off UC 16523537 puml.import)
// IMPORT — parse @startuml..@enduml → {elements, relations}. PURE (no persistence; caller writes the isolated store).
// uuid = the embedded [model:uuid:X] if present (round-trip re-bind, INV-P1/P2) else a deterministic puml-scoped id.
export function pumlToModel(text: string): { elements: PumlNode[]; relations: PumlRelation[] } {
  const elements: PumlNode[] = []; const relations: PumlRelation[] = [];
  const nameToUuid = new Map<string, string>(); const embedded = new Map<string, string>();
  const lines = String(text).split('\n').map((l) => l.trim());
  let cur: PumlNode | null = null;
  for (const line of lines) {
    if (!line || line === '@startuml' || line === '@enduml') continue;
    const em = line.match(/^' \[model:uuid:([0-9a-f-]+)\] (\w+)$/);
    if (em) { embedded.set(em[2], em[1]); continue; }
    if (line.startsWith("'")) continue; // other comments
    const open = line.match(/^(class|interface)\s+(\w+)\s*\{$/);
    if (open) {
      const name = open[2]; const uuid = embedded.get(name) || pumlUuid(name);
      cur = { uuid, name, kind: open[1] === 'interface' ? 'interface' : 'class', attrs: [], methods: [] };
      elements.push(cur); nameToUuid.set(name, uuid); continue;
    }
    if (line === '}') { cur = null; continue; }
    if (cur) { // member line
      if (/\(\s*\)$/.test(line)) cur.methods.push(line.replace(/\(\s*\)$/, '')); else cur.attrs.push(line);
      continue;
    }
    for (const { re, kind, swap } of REL_IN) { // relationship line
      const m = line.match(re);
      if (!m) continue;
      const [a, b] = swap ? [m[2], m[1]] : [m[1], m[2]];
      const fromU = nameToUuid.get(a) || pumlUuid(a), toU = nameToUuid.get(b) || pumlUuid(b);
      relations.push({ from: fromU, to: toU, kind });
      break;
    }
  }
  return { elements, relations };
}
