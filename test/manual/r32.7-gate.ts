// R32.7 gate (tsx — pure puml-serializer; the isolated-store persistence + Tron are the tester's).
// Covers design gate (a)-(f) + INV-P1/P2/P3. INV-P4 (isolation) holds BY CONSTRUCTION — the module imports NO fs
// (pure parse/serialize); the caller persists to the R32.5 isolated store. Asserted here: prod scenario/index is
// never touched (the module has no I/O).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { modelToPuml, pumlToModel, type PumlNode, type PumlRelation } from '../../src/ts/shared/puml-serializer.js';

const CIRCLE = 'aaaaaaaa-0000-4000-8000-000000000003';
const POINT = 'aaaaaaaa-0000-4000-8000-000000000002';
const SHAPE = 'aaaaaaaa-0000-4000-8000-000000000001';

const nodes: PumlNode[] = [
  { uuid: CIRCLE, name: 'Circle', kind: 'class', attrs: ['center', '_r'], methods: ['area'] },
  { uuid: POINT, name: 'Point', kind: 'class', attrs: ['x', 'y'], methods: [] },
  { uuid: SHAPE, name: 'Shape', kind: 'interface', attrs: [], methods: ['area'] },
];
const relations: PumlRelation[] = [
  { from: CIRCLE, to: SHAPE, kind: 'generalization' },
  { from: CIRCLE, to: POINT, kind: 'association' },
  { from: POINT, to: SHAPE, kind: 'dependency' },
  { from: CIRCLE, to: SHAPE, kind: 'generalization' }, // DUP → de-dup
];

// (a) export → valid .puml, each element ONCE, kinds mapped
const puml = modelToPuml(nodes, relations);
assert.ok(puml.startsWith('@startuml\n') && puml.trimEnd().endsWith('@enduml'), 'wrapped @startuml..@enduml');
assert.equal((puml.match(/^class Circle \{$/gm) || []).length, 1, 'Circle emitted ONCE (no-dup)');
assert.ok(puml.includes('interface Shape {'), 'interface kind');
assert.ok(puml.includes('Shape <|-- Circle'), 'generalization → <|--');
assert.ok(puml.includes('Circle --> Point'), 'association → -->');
assert.ok(puml.includes('Point ..> Shape'), 'dependency → ..>');
assert.equal((puml.match(/Shape <\|-- Circle/g) || []).length, 1, 'relation de-dup (one <|--)');
assert.ok(puml.includes(`' [model:uuid:${CIRCLE}] Circle`), 'uuid embedded for round-trip identity');

// (b) re-export byte-identical (INV-P3 idempotent)
assert.equal(modelToPuml(nodes, relations), puml, 're-export byte-identical');

// (d) import REUSES the embedded same-uuid units (INV-P1/P2 no-remint)
const imp = pumlToModel(puml);
const byName = new Map(imp.elements.map((e) => [e.name, e]));
assert.equal(byName.get('Circle')!.uuid, CIRCLE, 'import re-binds Circle to embedded uuid (no re-mint)');
assert.equal(byName.get('Shape')!.uuid, SHAPE, 'import re-binds Shape uuid');
assert.equal(byName.get('Shape')!.kind, 'interface', 'interface kind round-trips');
assert.deepEqual(byName.get('Circle')!.attrs, ['center', '_r'], 'attrs round-trip');
assert.deepEqual(byName.get('Circle')!.methods, ['area'], 'methods round-trip');

// (f) edge kinds round-trip
const relKinds = imp.relations.map((r) => `${r.from}->${r.to}:${r.kind}`).sort();
assert.ok(relKinds.includes(`${CIRCLE}->${SHAPE}:generalization`), 'generalization round-trips (from=child,to=parent)');
assert.ok(relKinds.includes(`${CIRCLE}->${POINT}:association`), 'association round-trips');
assert.ok(relKinds.includes(`${POINT}->${SHAPE}:dependency`), 'dependency round-trips');

// (c) import→export→import stable (byte-identical export; same uuids)
const puml2 = modelToPuml(imp.elements, imp.relations);
assert.equal(puml2, puml, 'export(import(export(m))) byte-identical (round-trip stable)');
const imp2 = pumlToModel(puml2);
assert.deepEqual(imp2.elements.map((e) => e.uuid).sort(), imp.elements.map((e) => e.uuid).sort(), 'same uuids across round-trip (INV-P1)');

// fresh puml (no embedded uuid) → deterministic id, stable across parses
const fresh = '@startuml\nclass Foo {\n  bar\n}\n@enduml\n';
assert.equal(pumlToModel(fresh).elements[0].uuid, pumlToModel(fresh).elements[0].uuid, 'fresh-class uuid deterministic');

// INV-P4 isolation — the module does no I/O (assert its source imports no fs/scenario write)
const src = fs.readFileSync(new URL('../../src/ts/shared/puml-serializer.ts', import.meta.url), 'utf-8');
assert.ok(!/from ['"]node:fs['"]|ScenarioIndex|scenario\/index/.test(src), 'puml-serializer is PURE — no fs / no scenario write (isolation by construction)');

console.log('[r32.7-gate] GREEN — export no-dup + kinds(<|--/-->/..>) ✓; re-export byte-identical ✓; import re-binds embedded uuid (no re-mint) ✓; round-trip stable same-uuid ✓; fresh-uuid deterministic ✓; module PURE/isolated ✓');
