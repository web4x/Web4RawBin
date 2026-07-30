// R32.7 gate (vitest — pure puml-serializer; isolated-store persistence + Tron = tester's live gate).
// export no-dup + kind mapping; byte-identical re-export; import re-binds embedded uuid (no re-mint); round-trip
// stable same-uuid (INV-P1/P2/P3); module PURE = isolation by construction (INV-P4).
import { describe, it, expect } from 'vitest';
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
  { from: CIRCLE, to: SHAPE, kind: 'generalization' }, { from: CIRCLE, to: POINT, kind: 'association' },
  { from: POINT, to: SHAPE, kind: 'dependency' }, { from: CIRCLE, to: SHAPE, kind: 'generalization' },
];

describe('R32.7 PUML export/import', () => {
  const puml = modelToPuml(nodes, relations);
  it('export: each element once, kinds <|--/-->/..>, uuid embedded', () => {
    expect((puml.match(/^class Circle \{$/gm) || []).length).toBe(1);
    expect(puml).toContain('interface Shape {');
    expect(puml).toContain('Shape <|-- Circle');
    expect(puml).toContain('Circle --> Point');
    expect(puml).toContain('Point ..> Shape');
    expect((puml.match(/Shape <\|-- Circle/g) || []).length).toBe(1); // relation de-dup
    expect(puml).toContain(`' [model:uuid:${CIRCLE}] Circle`);
  });
  it('re-export byte-identical (INV-P3)', () => { expect(modelToPuml(nodes, relations)).toBe(puml); });
  it('import re-binds embedded uuid, no re-mint (INV-P1/P2)', () => {
    const imp = pumlToModel(puml); const byName = new Map(imp.elements.map((e) => [e.name, e]));
    expect(byName.get('Circle')!.uuid).toBe(CIRCLE);
    expect(byName.get('Shape')!.kind).toBe('interface');
    expect(byName.get('Circle')!.attrs).toEqual(['center', '_r']);
    expect(byName.get('Circle')!.methods).toEqual(['area']);
  });
  it('edge kinds round-trip', () => {
    const k = pumlToModel(puml).relations.map((r) => `${r.from}->${r.to}:${r.kind}`);
    expect(k).toContain(`${CIRCLE}->${SHAPE}:generalization`);
    expect(k).toContain(`${CIRCLE}->${POINT}:association`);
    expect(k).toContain(`${POINT}->${SHAPE}:dependency`);
  });
  it('round-trip stable — export(import(export)) byte-identical, same uuids', () => {
    const imp = pumlToModel(puml); const puml2 = modelToPuml(imp.elements, imp.relations);
    expect(puml2).toBe(puml);
    expect(pumlToModel(puml2).elements.map((e) => e.uuid).sort()).toEqual(imp.elements.map((e) => e.uuid).sort());
  });
  it('fresh puml (no embedded uuid) → deterministic id', () => {
    const fresh = '@startuml\nclass Foo {\n  bar\n}\n@enduml\n';
    expect(pumlToModel(fresh).elements[0].uuid).toBe(pumlToModel(fresh).elements[0].uuid);
  });
});
