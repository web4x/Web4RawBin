/**
 * Sprint 41 T41.6 inc-2 — classM2Puml serializes the derived M2 UmlClass units → PUML, REUSING modelToPuml. This gate
 * proves the mapping follows the DERIVATION'S OWN structure (attrs land where TS put them — on the FileModel INTERFACE,
 * NOT hardcoded on File), emits methods on the class, maps relations → PUML arrows, and is deterministic (0-churn).
 * stub-must-fail: drop members/relations or hardcode attrs-on-File in classM2Puml → the assertions fail → RED.
 */
import { classM2Puml } from '../src/ts/shared/puml-serializer.js';
import type { M1Unit } from '../src/ts/scenario/TsToModel.js';

const fail = (m: string): never => { console.error(`✗ ${m}`); process.exit(1); };
const U = (s: string) => `${s}0000-0000-4000-8000-000000000000`.slice(0, 36);
const ASSOC = 'a1d2e3f4-0000-4a1b-8c2d-000000000010';
const mk = (uuid: string, name: string, kind: string, extra: Record<string, unknown> = {}): M1Unit =>
  ({ ior: 'ior:class:ModelElement', ownerIor: 'ior:instance:tron', model: { uuid, name, metaLevel: 'M1', kind, sourceFile: 'x', qualifiedName: name, instanceOf: [], ...extra } } as M1Unit);

// File = class(model + 5 methods); FileModel = interface holding the 4 attrs (the DERIVED truth, not attrs-on-File).
const units: M1Unit[] = [
  mk(U('f11e'), 'File', 'class', { members: [U('0117'), U('0217')], relations: [{ to: U('107a'), type: ASSOC }] }),
  mk(U('0117'), 'ownIor', 'method'),
  mk(U('0217'), 'renderSelf', 'method'),
  mk(U('107a'), 'Ior', 'class', { members: [] }),
  mk(U('f0de'), 'FileModel', 'interface', { members: [U('a1d1'), U('a2d1')] }),
  mk(U('a1d1'), 'uuid', 'attribute'),
  mk(U('a2d1'), 'origin', 'attribute'),
];
const puml = classM2Puml(units);

if (!/^@startuml/.test(puml) || !/@enduml\n?$/.test(puml)) fail('not a valid @startuml..@enduml document.');
if (!/\bclass File \{/.test(puml)) fail('File must be a class block.');
if (!/^\s*ownIor\(\)$/m.test(puml) || !/^\s*renderSelf\(\)$/m.test(puml)) fail('File methods (ownIor/renderSelf) must render as methods.');
if (!/\binterface FileModel \{/.test(puml)) fail('FileModel must be an interface block.');
// ★ attrs land on FileModel, NOT on File (structure-from-derivation, not hardcoded attrs-on-File)
const fileBlock = puml.slice(puml.indexOf('class File {'), puml.indexOf('}', puml.indexOf('class File {')));
if (/\buuid\b|\borigin\b/.test(fileBlock)) fail('attrs uuid/origin must NOT be on File — they live on the FileModel interface (derivation structure, not hardcoded).');
const fmBlock = puml.slice(puml.indexOf('interface FileModel {'), puml.indexOf('}', puml.indexOf('interface FileModel {')));
if (!/\buuid\b/.test(fmBlock) || !/\borigin\b/.test(fmBlock)) fail('FileModel interface must carry the uuid/origin attrs (derived structure).');
// relation mapped to a PUML association arrow
if (!/File --> Ior/.test(puml)) fail('File→Ior UmlAssociation must render as `File --> Ior`.');
// deterministic (INV-P3 byte-identical re-run)
if (classM2Puml(units) !== puml) fail('classM2Puml must be deterministic (byte-identical re-serialize).');

console.log('✓ Sprint 41 T41.6 inc-2: classM2Puml → PUML reusing modelToPuml; methods on File, attrs on FileModel (derivation structure, not hardcoded), association arrow, deterministic.');
