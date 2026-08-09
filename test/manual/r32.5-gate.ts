// R32.5 gate (tsx; vitest mirror). GO-LIVE pipeline: TsToModel.generate(indexDir=STORE, diagram:true) → M1/M2 +
// demo Diagram view-links in an ISOLATED store; prod scenario/index NEVER mutated (isolation proven); idempotent
// re-drop. Server reroute (/api/model/tree+trace/children+/api/ior → store) + POST /api/model/generate = tester
// live gate + architect backstop (this proves the generate half hermetically).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TsToModel } from '../../src/ts/scenario/TsToModel.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const FIXTURE = path.join(ROOT, 'test', 'fixtures', 'r32.2-sample.ts');
const PROD = path.join(ROOT, 'scenario', 'index');
const SEED = path.join(PROD, 'a', '1', 'd', '2', 'e');
const STORE = path.join(ROOT, 'test', 'manual', '.r32.5-store', 'index');

const countModelElements = (dir: string): number => {
  let n = 0; const st = [dir];
  while (st.length) { const d = st.pop()!; if (!fs.existsSync(d)) continue; for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) st.push(p); else if (e.name.endsWith('.scenario.json')) { try { if (JSON.parse(fs.readFileSync(p, 'utf-8')).ior === 'ior:class:ModelElement') n++; } catch { /* */ } } } }
  return n;
};
const readShard = (base: string, uuid: string): any => { try { return JSON.parse(fs.readFileSync(path.join(base, ...uuid.slice(0, 5).split(''), `${uuid}.scenario.json`), 'utf-8')); } catch { return null; } };

// Fresh store seeded with the M2/M3 metaclasses (self-contained, like ensureStoreSeeded).
fs.rmSync(path.dirname(STORE), { recursive: true, force: true });
const seedDst = path.join(STORE, 'a', '1', 'd', '2', 'e');
fs.mkdirSync(seedDst, { recursive: true });
for (const f of fs.readdirSync(SEED)) fs.copyFileSync(path.join(SEED, f), path.join(seedDst, f));

const prodBefore = countModelElements(PROD);
const r = new TsToModel(ROOT).generate([FIXTURE], { indexDir: STORE, write: true, diagram: true });

// M1 units landed in the STORE
const byName = new Map(r.units.map((u) => [u.model.name, u.model]));
assert.ok(byName.get('Circle'), 'Circle M1 generated');
assert.ok(readShard(STORE, byName.get('Circle')!.uuid), 'Circle unit written to STORE');

// demo Diagram with Layer-2 view-links (class/interface = Circle, Point, Shape = 3), auto-layout grid, viewKind class
assert.ok(r.diagramUuid, 'diagramUuid returned');
const dUnit = readShard(STORE, r.diagramUuid!);
assert.equal(dUnit.ior, 'ior:class:Diagram', 'Diagram unit in STORE');
const views = dUnit.model.views;
assert.equal(views.length, 3, `3 class/interface view-links (got ${views.length})`);
for (const v of views) { assert.ok(v.unit.startsWith('modelelement:'), 'view-link → modelelement ref'); assert.equal(v.viewKind, 'class', 'viewKind class'); assert.ok(Number.isFinite(v.x) && Number.isFinite(v.y), 'x,y on link'); }
assert.deepEqual([views[0].x, views[0].y], [20, 20], 'grid pos [0]');
assert.deepEqual([views[1].x, views[1].y], [240, 20], 'grid pos [1] (col 2)');

// ★ ISOLATION — prod scenario/index ModelElement count UNCHANGED (all writes hit the store)
assert.equal(countModelElements(PROD), prodBefore, `prod ModelElement count unchanged (${prodBefore}) — isolation`);
assert.ok(countModelElements(STORE) > prodBefore, 'STORE has M2 seed + generated M1');

// idempotent re-drop: same UUIDs → 0 churn, same diagram
const r2 = new TsToModel(ROOT).generate([FIXTURE], { indexDir: STORE, write: true, diagram: true });
assert.equal(r2.wrote, 0, `idempotent re-drop 0-churn (got wrote=${r2.wrote})`);
assert.equal(r2.diagramUuid, r.diagramUuid, 'diagram uuid deterministic (re-drop = same)');

fs.rmSync(path.dirname(STORE), { recursive: true, force: true });
console.log(`[r32.5-gate] GREEN — generate→STORE✓ demo Diagram ${views.length} view-links (grid x,y)✓ M1 in store✓ ISOLATION prod=${prodBefore} unchanged✓ idempotent re-drop 0-churn✓ det diagram-uuid✓`);
