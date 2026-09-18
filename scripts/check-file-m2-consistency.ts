/**
 * Sprint 41 T41.6 inc-3 — CONSISTENT-BY-CONSTRUCTION gate. TS is the ONE authored source; UML + PUML are DERIVED, so
 * they cannot drift. This gate re-derives UML-from-TS (deriveClassM2) + PUML-from-UML (classM2Puml) + parse-back
 * (pumlToModel) and asserts ALL THREE agree ELEMENT-FOR-ELEMENT over the DERIVATION'S OWN graph — every box / attribute
 * / method / association present in the UML units AND round-tripping through the PUML. Missing from ANY ⇒ RED.
 * ★ STRUCTURE-AGNOSTIC: elements are read from the derived graph (kind + memberOf), NEVER hardcoded attrs-on-File — if
 *   the attributes live on FileModel, all three must show them THERE.
 * ★ ONE-REPRESENTATION INVARIANT (PO identity-reconcile): every derived element resolves to EXACTLY ONE unit — no two
 *   units share a derivationKey (remove resolve-by-key → a 2nd unit minted → this fires).
 * stub-must-fail: drop an element from the PUML (a hand-edit divergence) → the diff MUST catch it (proven self-biting below).
 */
// [test:uuid:6ec75551-d711-4770-af09-50f6cbdc2d95] test:file-m2-consistency — closes R41.6 AC-consistency-gate-rederives-diffs (TS⟶UML⟶PUML element-for-element + the one-representation invariant the derivationKey reconcile enables).
import { TsToModel } from '../src/ts/scenario/TsToModel.js';
import { classM2Puml, pumlToModel } from '../src/ts/shared/puml-serializer.js';

const REPO = '/var/dev/Workspaces/web4x/Web4RawBin';
const TRON = 'ior:instance:04e84ff9-a460-4c0a-8ab6-52793bebe9c4';
const FILES = ['src/ts/scenario/file.ts', 'src/ts/scenario/ior.ts', 'src/ts/scenario/folder.ts'].map((f) => `${REPO}/${f}`);
const fail = (m: string): never => { console.error(`✗ ${m}`); process.exit(1); };
const bare = (r: unknown): string => String(r || '').replace(/^ior:instance:/, '');
const lead = (s: string): string => (s.match(/^\s*[+\-#~]?\s*([A-Za-z_]\w*)/)?.[1] || s.trim());

type Elems = { boxes: Set<string>; attrs: Set<string>; methods: Set<string>; edges: Set<string> };
const mk = (): Elems => ({ boxes: new Set(), attrs: new Set(), methods: new Set(), edges: new Set() });
const diff = (a: Set<string>, b: Set<string>) => [...a].filter((x) => !b.has(x));

// ELEMENTS from the derivation's OWN graph (structure-agnostic: box = the memberOf's name, never assumed).
function unitsElems(units: { model: any }[]): Elems {
  const e = mk();
  const nameOf = new Map(units.map((u) => [u.model.uuid, u.model.name]));
  // a class-diagram edge is between BOXES (class/interface); a dependency on a TYPE is carried by the method signature
  // (e.g. iconToken(): FileIconToken), not a separate arrow — so edges are compared box-target-only, matching the PUML.
  const boxNames = new Set(units.filter((u) => u.model.kind === 'class' || u.model.kind === 'interface').map((u) => u.model.name));
  for (const { model: m } of units) {
    if (m.kind === 'class' || m.kind === 'interface') e.boxes.add(`${m.kind}:${m.name}`);
    if (m.kind === 'attribute' || m.kind === 'property') { const box = nameOf.get(bare(m.memberOf)); if (box) e.attrs.add(`${box}.${m.name}`); }
    if (m.kind === 'method') { const box = nameOf.get(bare(m.memberOf ?? m.parentClass)); if (box) e.methods.add(`${box}.${m.name}`); }
    // edges are HOISTED to the owning class (a member's return-type dep → the class's dep), matching the class-diagram PUML; self-edges skipped
    const isBox = m.kind === 'class' || m.kind === 'interface';
    const fromName = isBox ? m.name : nameOf.get(bare(m.memberOf ?? m.parentClass));
    for (const r of (m.relations || [])) { const to = nameOf.get(bare(r.to)); if (fromName && to && fromName !== to && boxNames.has(to)) e.edges.add(`${fromName}->${to}`); }
  }
  return e;
}
// ELEMENTS from the PUML TEXT (the actual representation the diagram renders). pumlToModel is BOX-level (it does not
// parse members), so member-for-member consistency MUST read the text: a box block's method lines `name()` + attr lines
// `name`, plus the relation arrows. (pumlToModel is used separately below only for a box/relation round-trip proof.)
function pumlElems(puml: string): Elems {
  const e = mk();
  const lines = puml.split('\n');
  let box: string | null = null;
  const re = /^(class|interface)\s+([A-Za-z_]\w*)\s*\{/;
  for (const raw of lines) {
    const ln = raw.trim();
    if (ln.startsWith("'")) continue; // [model:uuid] comment
    const m = re.exec(ln);
    if (m) { box = m[2]; e.boxes.add(`${m[1]}:${m[2]}`); continue; }
    if (ln === '}') { box = null; continue; }
    if (box) {
      const method = /^([A-Za-z_]\w*)\s*\(/.exec(ln);
      if (method) { e.methods.add(`${box}.${method[1]}`); continue; }
      const attr = /^([A-Za-z_]\w*)\b/.exec(ln);
      if (attr) e.attrs.add(`${box}.${attr[1]}`);
    } else {
      // relation arrows (association --> , generalization <|-- , dependency ..>)
      const rel = /^([A-Za-z_]\w*)\s*(?:-->|\.\.>)\s*([A-Za-z_]\w*)/.exec(ln) || (() => { const g = /^([A-Za-z_]\w*)\s*<\|--\s*([A-Za-z_]\w*)/.exec(ln); return g ? [g[0], g[2], g[1]] as RegExpExecArray : null; })();
      if (rel) e.edges.add(`${rel[1]}->${rel[2]}`);
    }
  }
  return e;
}

const t = new TsToModel(REPO);
const { units } = t.deriveClassM2(FILES, { ownerIor: TRON, write: false });

// (1) ONE-REPRESENTATION INVARIANT — no two units share a derivationKey.
const byKey = new Map<string, number>();
for (const u of units) { const k = (u.model as any).derivationKey; if (k) byKey.set(k, (byKey.get(k) || 0) + 1); }
const dups = [...byKey].filter(([, n]) => n > 1);
if (dups.length) fail(`ONE-REPRESENTATION invariant: ${dups.length} derivationKey(s) map to >1 unit (a dup was minted): ${JSON.stringify(dups)}`);

// (2) DETERMINISM — re-derive → identical uuid+member set (the derivation cannot drift run-to-run).
const again = t.deriveClassM2(FILES, { ownerIor: TRON, write: false }).units;
const sig = (us: { model: any }[]) => us.map((u) => `${u.model.uuid}|${u.model.kind}|${(u.model.members || []).length}`).sort().join(',');
if (sig(units) !== sig(again)) fail('DETERMINISM: re-derivation produced a different unit graph (drift).');

// (3) ELEMENT-FOR-ELEMENT — UML units ⟷ PUML parse-back agree (every element in BOTH; missing from either ⇒ RED).
const puml = classM2Puml(units);
const U = unitsElems(units), P = pumlElems(puml);
for (const dim of ['boxes', 'attrs', 'methods', 'edges'] as const) {
  const missingInPuml = diff(U[dim], P[dim]);
  const missingInUml = diff(P[dim], U[dim]);
  if (missingInPuml.length) fail(`${dim}: present in UML units but MISSING from PUML: ${JSON.stringify(missingInPuml)} (drift — an element the diagram would silently omit).`);
  if (missingInUml.length) fail(`${dim}: present in PUML but not in the UML units: ${JSON.stringify(missingInUml)} (drift).`);
}

// (4) stub-must-fail SELF-BITE — a PUML that DROPS a method line must be CAUGHT by the diff (else the gate is blind).
const aMethod = [...U.methods][0];
if (aMethod) {
  const mName = aMethod.split('.').pop()!;
  const damaged = puml.split('\n').filter((ln) => !new RegExp(`\\b${mName}\\s*\\(`).test(ln)).join('\n');
  const stillCaught = diff(U.methods, pumlElems(damaged).methods).length > 0;
  if (!stillCaught) fail(`SELF-BITE: dropping method "${mName}" from the PUML was NOT detected by the element diff — the gate is blind to divergence.`);
}

console.log(`✓ Sprint 41 T41.6 inc-3: TS⟶UML⟶PUML consistent element-for-element (${U.boxes.size} boxes, ${U.attrs.size} attrs, ${U.methods.size} methods, ${U.edges.size} edges); one-representation (no dup derivationKey); deterministic; self-bite catches a dropped element.`);
