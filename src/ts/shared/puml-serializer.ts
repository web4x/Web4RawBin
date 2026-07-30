// R32.7 PUML export/import — ONE shared PURE module (client + server; NO I/O — persistence is the caller's,
// into the R32.5 ISOLATED store, INV-P4). Design b9895358d / req b1fef048. PARALLEL to buildDiagramSvg (same
// model, PUML sink instead of SVG). Reuses the EdgeKind vocabulary (type-only import → erased, no runtime cross-dep).
// INV-P1 same-uuid-across-M (identity embedded in the .puml), P2 reuse-not-remint (import binds the embedded uuid),
// P3 round-trip byte-identical (deterministic order + no timestamps), P4 isolation (caller persists to isolated store).
import type { EdgeKind } from '../../public/ts/trace/diagram-view-model.js';

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

const REL_IN: { re: RegExp; kind: EdgeKind; swap: boolean }[] = [
  { re: /^(\w[\w.]*)\s*<\|--\s*(\w[\w.]*)$/, kind: 'generalization', swap: true }, // Parent <|-- Child ⇒ from=Child,to=Parent
  { re: /^(\w[\w.]*)\s*-->\s*(\w[\w.]*)$/, kind: 'association', swap: false },
  { re: /^(\w[\w.]*)\s*\.\.>\s*(\w[\w.]*)$/, kind: 'dependency', swap: false },
];

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
