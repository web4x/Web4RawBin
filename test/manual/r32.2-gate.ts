// R32.2 gate (tsx runner — local vitest is env-broken; tester/CI runs the vitest mirror).
// Hermetic: a temp index seeded with the real M2 units (scenario/index/a/1/d/2/e) + the generated M1 units,
// so ModelValidator level-integrity (M1→M2) resolves. Asserts the AST→M2 map, get+set→one property,
// members/memberOf composition, typed→relatesTo(+UmlAssociation), deterministic 0-churn re-run, validator=0.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TsToModel, keyToUuid } from '../../src/ts/scenario/TsToModel.js';
import { ModelValidator } from '../../src/ts/scenario/ModelValidator.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const FIXTURE = path.join(ROOT, 'test', 'fixtures', 'r32.2-sample.ts');
const REL_FIXTURE = 'test/fixtures/r32.2-sample.ts';
const SEED_SHARD = path.join(ROOT, 'scenario', 'index', 'a', '1', 'd', '2', 'e');

const TMP = path.join(ROOT, 'test', 'manual', '.r32.2-tmp');
fs.rmSync(TMP, { recursive: true, force: true });
const TMP_INDEX = path.join(TMP, 'scenario', 'index');
const TMP_SEED = path.join(TMP_INDEX, 'a', '1', 'd', '2', 'e');
fs.mkdirSync(TMP_SEED, { recursive: true });
for (const f of fs.readdirSync(SEED_SHARD)) fs.copyFileSync(path.join(SEED_SHARD, f), path.join(TMP_SEED, f)); // M2 units

const gen = new TsToModel(ROOT);
const r1 = gen.generate([FIXTURE], { indexDir: TMP_INDEX });
const byName = new Map(r1.units.map((u) => [u.model.name, u.model]));
const u = (n: string) => { const m = byName.get(n); assert.ok(m, `unit '${n}' generated`); return m!; };

const facet = (n: string, model: string, code: string) => {
  const m = u(n);
  assert.ok(m.instanceOf.includes(`ior:instance:${model}`), `${n} instanceOf model-facet`);
  assert.ok(m.instanceOf.includes(`ior:instance:${code}`), `${n} instanceOf code-facet`);
};
// AST→M2 multi-facet map
facet('Circle', 'a1d2e3f4-0000-4a1b-8c2d-000000000003', 'a1d2e3f4-0000-4a1b-8c2d-000000000013'); // class
facet('Shape', 'a1d2e3f4-0000-4a1b-8c2d-000000000004', 'a1d2e3f4-0000-4a1b-8c2d-000000000015'); // interface
facet('makeId', 'a1d2e3f4-0000-4a1b-8c2d-000000000008', 'a1d2e3f4-0000-4a1b-8c2d-000000000019'); // function
facet('Id', 'a1d2e3f4-0000-4a1b-8c2d-000000000009', 'a1d2e3f4-0000-4a1b-8c2d-000000000020'); // type (+ ts-type-code)
facet('center', 'a1d2e3f4-0000-4a1b-8c2d-000000000005', 'a1d2e3f4-0000-4a1b-8c2d-000000000017'); // attribute
facet('radius', 'a1d2e3f4-0000-4a1b-8c2d-000000000007', 'a1d2e3f4-0000-4a1b-8c2d-000000000018'); // property
facet('area', 'a1d2e3f4-0000-4a1b-8c2d-000000000006', 'a1d2e3f4-0000-4a1b-8c2d-000000000016'); // method

// kinds
assert.equal(u('Circle').kind, 'class'); assert.equal(u('Shape').kind, 'interface');
assert.equal(u('Id').kind, 'type'); assert.equal(u('makeId').kind, 'function');
assert.equal(u('radius').kind, 'property'); assert.equal(u('area').kind, 'method'); assert.equal(u('center').kind, 'attribute');

// get+set → ONE property (exactly one unit named 'radius', of kind property)
assert.equal(r1.units.filter((x) => x.model.name === 'radius').length, 1, 'get+set → ONE property');

// members[] composition + reverse memberOf
const circle = u('Circle');
const circleMembers = (circle.members || []);
for (const mn of ['center', 'radius', 'area', '_r']) assert.ok(circleMembers.includes(`ior:instance:${u(mn).uuid}`), `Circle.members ∋ ${mn}`);
assert.equal(u('area').memberOf, `ior:instance:${circle.uuid}`, 'area.memberOf = Circle');

// typed attribute → relatesTo Point via UmlAssociation
const center = u('center');
assert.ok((center.relatesTo || []).includes(`ior:instance:${u('Point').uuid}`), 'center relatesTo Point');
assert.ok((center.relations || []).some((r) => r.type === 'ior:instance:a1d2e3f4-0000-4a1b-8c2d-000000000010'), 'center relation = UmlAssociation');
// implements → UmlGeneralization
assert.ok((circle.relations || []).some((r) => r.to === `ior:instance:${u('Shape').uuid}` && r.type === 'ior:instance:a1d2e3f4-0000-4a1b-8c2d-000000000011'), 'Circle →Generalization Shape');

// deterministic uuid = keyToUuid(sourceFile::qualifiedName)
assert.equal(circle.uuid, keyToUuid(`${REL_FIXTURE}::Circle`), 'Circle uuid deterministic');
assert.equal(u('area').uuid, keyToUuid(`${REL_FIXTURE}::Circle.area`), 'Circle.area uuid deterministic');

// idempotent re-run → 0 churn
const r2 = gen.generate([FIXTURE], { indexDir: TMP_INDEX });
assert.equal(r2.wrote, 0, `re-run 0-churn (wrote=${r2.wrote})`);
assert.equal(r2.removed, 0, `re-run 0-removed (removed=${r2.removed})`);

// ModelValidator over the temp index (M2 seed + generated M1) = 0 violations
const listUnits = (): string[] => {
  const out: string[] = []; const stack = [TMP_INDEX];
  while (stack.length) { const d = stack.pop()!; for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) stack.push(p); else if (e.name.endsWith('.scenario.json')) out.push(e.name.replace('.scenario.json', '')); } }
  return out;
};
const readUnit = (uuid: string) => { try { return JSON.parse(fs.readFileSync(path.join(TMP_INDEX, ...uuid.slice(0, 5).split(''), `${uuid}.scenario.json`), 'utf-8')); } catch { return null; } };
const violations = new ModelValidator().validate({ list: listUnits, get: readUnit });
assert.deepEqual(violations, [], `ModelValidator = 0 violations (got ${JSON.stringify(violations)})`);

fs.rmSync(TMP, { recursive: true, force: true });
console.log(`[r32.2-gate] GREEN — ${r1.units.length} M1 units; multi-facet map ✓; get+set→1 property ✓; members/memberOf ✓; relatesTo+UmlAssociation ✓; Generalization ✓; deterministic uuid ✓; re-run 0-churn ✓; ModelValidator=0 ✓`);
