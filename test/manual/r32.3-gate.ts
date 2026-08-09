// R32.3 gate (tsx runner; vitest mirror for tester/CI). DATA+CONFIG contract of the MDA model tree over the
// SHARED rb-trace-tree (NO tree fork): ModelElement forward-key = members (composition children), relatesTo is
// NOT a child, node type = M2 model-facet (icon), member-count badge = members.length, deterministic re-run.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TsToModel } from '../../src/ts/scenario/TsToModel.js';
import { forwardKeysForMode } from '../../src/ts/shared/chain-model.js';
import { TRACE_ICONS } from '../../src/public/ts/trace/icons.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const FIXTURE = path.join(ROOT, 'test', 'fixtures', 'r32.2-sample.ts');
const SEED = path.join(ROOT, 'scenario', 'index', 'a', '1', 'd', '2', 'e');
const TMP = path.join(ROOT, 'test', 'manual', '.r32.3-tmp');
const IDX = path.join(TMP, 'scenario', 'index');
fs.rmSync(TMP, { recursive: true, force: true });
const seedTmp = path.join(IDX, 'a', '1', 'd', '2', 'e');
fs.mkdirSync(seedTmp, { recursive: true });
for (const f of fs.readdirSync(SEED)) fs.copyFileSync(path.join(SEED, f), path.join(seedTmp, f));

// AC-2 — ONE additive forward-key entry: ModelElement → members (all modes); nothing else.
assert.deepEqual(forwardKeysForMode('ModelElement', 'scenario'), ['members'], 'ModelElement scenarioFwd=[members]');
assert.deepEqual(forwardKeysForMode('ModelElement', 'trace'), ['members'], 'ModelElement traceFwd=[members]');
// AC-5 — relatesTo is NOT a child forward-key.
assert.ok(!forwardKeysForMode('ModelElement', 'scenario').includes('relatesTo'), 'relatesTo NOT a forward-key');
// AC-3 — TRACE_ICONS gained the Uml* model-facet icons (lowercase; rb-trace-tree lowercases the type).
for (const k of ['umlclass', 'umlinterface', 'umlattribute', 'umlmethod', 'umlproperty', 'umlfunction']) assert.ok(TRACE_ICONS[k], `TRACE_ICONS.${k}`);
// AC-7 additive: other types untouched (spot-check Class still → methods).
assert.deepEqual(forwardKeysForMode('Class', 'scenario'), ['methods'], 'Class forward-key unregressed');

const r1 = new TsToModel(ROOT).generate([FIXTURE], { indexDir: IDX });
const byName = new Map(r1.units.map((u) => [u.model.name, u.model]));
const U = (n: string) => { const m = byName.get(n); assert.ok(m, n); return m!; };
const M2NAME = new Map<string, string>(); // uuid → seed M2 name (for facet resolution)
for (const f of fs.readdirSync(seedTmp)) { const u = JSON.parse(fs.readFileSync(path.join(seedTmp, f), 'utf-8')); M2NAME.set(u.model.uuid, u.model.name); }

// AC-4 — class members[] = its methods+attributes+properties; badge = members.length (childRefCount stamp reuse).
const circle = U('Circle');
const memberUuids = (circle.members || []).map((r) => r.replace('ior:instance:', ''));
for (const mn of ['center', '_r', 'radius', 'area']) assert.ok(memberUuids.includes(U(mn).uuid), `Circle.members ∋ ${mn}`);
assert.equal((circle.members || []).length, 4, 'Circle member-count badge = 4');
assert.equal(U('area').memberOf, `ior:instance:${circle.uuid}`, 'area.memberOf = Circle (reverse composition)');

// AC-3 — node type = M2 MODEL-facet metaclass (the Uml* instanceOf) → lowercased icon key present.
const facetOf = (m: { instanceOf: string[] }): string => { for (const r of m.instanceOf) { const n = M2NAME.get(r.replace('ior:instance:', '')) || ''; if (n.startsWith('Uml')) return n; } return 'ModelElement'; };
assert.equal(facetOf(circle), 'UmlClass', 'Circle model-facet = UmlClass');
assert.equal(facetOf(U('area')), 'UmlMethod', 'area model-facet = UmlMethod');
assert.equal(facetOf(U('radius')), 'UmlProperty', 'radius model-facet = UmlProperty');
assert.ok(TRACE_ICONS[facetOf(circle).toLowerCase()], 'facet icon resolves (umlclass)');

// AC-5 — relatesTo target (Point) is NOT a composition child of Circle (edge, not member).
assert.ok(!memberUuids.includes(U('Point').uuid), 'Point NOT a Circle member (relatesTo edge, not child)');
assert.ok((U('center').relatesTo || []).includes(`ior:instance:${U('Point').uuid}`), 'center relatesTo Point (edge exists for detail/R32.6)');

// AC-6 — deterministic re-run = 0 churn (stable tree, no dup nodes).
const r2 = new TsToModel(ROOT).generate([FIXTURE], { indexDir: IDX });
assert.equal(r2.wrote, 0, 'deterministic re-run 0-churn');

fs.rmSync(TMP, { recursive: true, force: true });
console.log(`[r32.3-gate] GREEN — ModelElement fwd=[members]✓ relatesTo-not-child✓ Uml* icons✓ Class-unregressed✓ members/memberOf composition✓ badge=members.length✓ model-facet type✓ deterministic 0-churn✓`);
