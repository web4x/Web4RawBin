// R32.1 MDA M3/M2 seed (architect build spec 124f9955d §A). DETERMINISTIC + IDEMPOTENT: pinned UUIDs (SEED_UUIDS)
// → re-run mints nothing new (the same-UUID/no-re-mint law at the seed level = R31.13 determinism discipline).
// Emits ior:class:ModelElement units (2 M3 reflexive + 17 M2), each instanceOf-linked ONE level up with the reverse
// `instances` accruing on the M3 units → correct-by-construction. Writes to the sharded scenario/index path directly
// (same on-disk form as ScenarioIndex.put; no symlinks for these units). Gate: re-run → `git status` ZERO churn.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const INDEX = path.join(ROOT, 'scenario', 'index');

// Pinned v4 UUIDs (constants → idempotent). Tail 01..19 distinguishes; all valid v4 (…-4xxx-8xxx-…).
const U = {
  Class:            'a1d2e3f4-0000-4a1b-8c2d-000000000001',
  Relationship:     'a1d2e3f4-0000-4a1b-8c2d-000000000002',
  UmlClass:         'a1d2e3f4-0000-4a1b-8c2d-000000000003',
  UmlInterface:     'a1d2e3f4-0000-4a1b-8c2d-000000000004',
  UmlAttribute:     'a1d2e3f4-0000-4a1b-8c2d-000000000005',
  UmlMethod:        'a1d2e3f4-0000-4a1b-8c2d-000000000006',
  UmlProperty:      'a1d2e3f4-0000-4a1b-8c2d-000000000007',
  UmlFunction:      'a1d2e3f4-0000-4a1b-8c2d-000000000008',
  UmlType:          'a1d2e3f4-0000-4a1b-8c2d-000000000009',
  UmlAssociation:   'a1d2e3f4-0000-4a1b-8c2d-000000000010',
  UmlGeneralization:'a1d2e3f4-0000-4a1b-8c2d-000000000011',
  UmlDependency:    'a1d2e3f4-0000-4a1b-8c2d-000000000012',
  'ts-class-code':  'a1d2e3f4-0000-4a1b-8c2d-000000000013',
  'puml-class-code':'a1d2e3f4-0000-4a1b-8c2d-000000000014',
  'ts-interface-code':'a1d2e3f4-0000-4a1b-8c2d-000000000015',
  'ts-method-code': 'a1d2e3f4-0000-4a1b-8c2d-000000000016',
  'ts-attribute-code':'a1d2e3f4-0000-4a1b-8c2d-000000000017',
  'ts-property-code':'a1d2e3f4-0000-4a1b-8c2d-000000000018',
  'ts-function-code':'a1d2e3f4-0000-4a1b-8c2d-000000000019',
};

// key, metaLevel, kind, instanceOf-keys (→ meta one level up; M3 self/near-top). Order fixed → deterministic.
const ELEMS = [
  ['Class', 'M3', 'class', ['Class']],                 // MOF fixed point (self)
  ['Relationship', 'M3', 'relationship', ['Class']],   // a relationship IS-A classifier at M3
  // M2 model metaclasses → instanceOf Class
  ['UmlClass', 'M2', 'class', ['Class']],
  ['UmlInterface', 'M2', 'interface', ['Class']],
  ['UmlAttribute', 'M2', 'attribute', ['Class']],
  ['UmlMethod', 'M2', 'method', ['Class']],
  ['UmlProperty', 'M2', 'property', ['Class']],
  ['UmlFunction', 'M2', 'function', ['Class']],
  ['UmlType', 'M2', 'type', ['Class']],
  // M2 relationship metaclasses → instanceOf Relationship
  ['UmlAssociation', 'M2', 'relationship', ['Relationship']],
  ['UmlGeneralization', 'M2', 'relationship', ['Relationship']],
  ['UmlDependency', 'M2', 'relationship', ['Relationship']],
  // M2 code-representation metaclasses → instanceOf Class (their M1 instances are the concrete artifacts)
  ['ts-class-code', 'M2', 'class', ['Class']],
  ['puml-class-code', 'M2', 'class', ['Class']],
  ['ts-interface-code', 'M2', 'interface', ['Class']],
  ['ts-method-code', 'M2', 'method', ['Class']],
  ['ts-attribute-code', 'M2', 'attribute', ['Class']],
  ['ts-property-code', 'M2', 'property', ['Class']],
  ['ts-function-code', 'M2', 'function', ['Class']],
];

const ref = (key) => `ior:instance:${U[key]}`;

// reverse `instances` accrues on each meta (deterministic order = ELEMS order)
const instances = {};
for (const [key, , , of] of ELEMS) for (const metaKey of of) (instances[metaKey] ||= []).push(ref(key));

const shardPath = (uuid) => path.join(INDEX, ...uuid.slice(0, 5).split(''), `${uuid}.scenario.json`);

// [impl:uuid:f65c9b50-8577-4f2c-b53e-361108149d6a] SeedMdaModel.seedModel — R31.10/13 no-mis-attribution: credits
// the SEED's idempotent 0-churn to the seed (NOT to ModelValidator.validate). Name-matches Method seedModel.
export function seedModel() {
  let wrote = 0;
  for (const [key, metaLevel, kind, of] of ELEMS) {
    const uuid = U[key];
    const unit = {
      ior: 'ior:class:ModelElement',
      model: { uuid, name: key, metaLevel, kind, instanceOf: of.map(ref), instances: instances[key] || [] },
      ownerIor: null,
    };
    const file = shardPath(uuid);
    const json = JSON.stringify(unit, null, 2) + '\n';
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const prev = fs.existsSync(file) ? fs.readFileSync(file, 'utf-8') : '';
    if (prev !== json) { fs.writeFileSync(file, json); wrote++; }
  }
  console.log(`[seed-mda-model] ${ELEMS.length} ModelElement units (2 M3 + ${ELEMS.length - 2} M2); ${wrote} written/changed, ${ELEMS.length - wrote} unchanged.`);
  return wrote;
}

// Run only as a CLI (not on import) so tests can import seedModel() side-effect-free.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) seedModel();
