// R40.81 one-store migration (Task 40.81 d864b05f) — Slice 1 DATA UNIFICATION. Radical-OOP target: exactly ONE physical
// unit store (scenario/index); the second physical store (data/model-store/index) collapses INTO it — every model-store-only
// unit relocated byte-identically at its own uuid shard, every byte-identical overlap skipped, divergence FAIL-CLOSED.
//
// DRY-RUN (default): read-only — enumerate the REAL unit files in MODEL_STORE (symlinks are already views, skipped) and
// classify each uuid vs scenario/index: relocate (only in model-store) / skip (present + byte-identical) / DIVERGENT
// (present + differs → count + list). divergent MUST be 0; on --apply the migration REFUSES if divergent>0 (never a silent pick).
// --apply is GATED and, per the design chokepoint-1, NOT enabled here until the architect confirms the write shape
// (ScenarioIndex.put byte-identical keyed on the SOURCE uuid — no dedup/reuse mint helper). This file ships the dry-run + the
// snapshot hard-guard now; the apply pass lands after the architect confirm. Run on a SCRATCH index copy for --apply (R40.31).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MODEL_STORE = path.join(ROOT, 'data/model-store/index');
const SCEN_INDEX = path.join(ROOT, 'scenario/index');
const SNAPSHOT = path.join(ROOT, 'test/baseline/model-store-premigration-v0.8.186.tar.gz');
const APPLY = process.argv.includes('--apply');

// shard path for a uuid in an index root: <root>/<c0>/<c1>/<c2>/<c3>/<c4>/<uuid>.scenario.json (the repo convention)
function shardPath(root: string, uuid: string): string {
  return path.join(root, ...uuid.slice(0, 5).split(''), `${uuid}.scenario.json`);
}

// recursively collect REAL *.scenario.json files (NOT symlinks — a symlink is already a view into the one store)
function realUnitFiles(dir: string): string[] {
  const out: string[] = [];
  let ents: fs.Dirent[];
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of ents) {
    const p = path.join(dir, e.name);
    if (e.isSymbolicLink()) continue;            // a symlink unit file = already a view; not a duplicate real store entry
    if (e.isDirectory()) out.push(...realUnitFiles(p));
    else if (e.isFile() && e.name.endsWith('.scenario.json')) out.push(p);
  }
  return out;
}

// HARD GUARD (INV-REVERSIBLE): the migration refuses to run without the pre-migration snapshot.
if (!fs.existsSync(SNAPSHOT)) {
  console.error(`✗ REFUSING: pre-migration snapshot absent (${path.relative(ROOT, SNAPSHOT)}) — reversibility floor missing. Capture it before migrating.`);
  process.exit(1);
}
if (APPLY) {
  console.error('✗ --apply is HELD at chokepoint-1 (architect confirm of the relocate write shape: ScenarioIndex.put byte-identical keyed on source uuid, no dedup helper). Dry-run only for now.');
  process.exit(1);
}

const files = realUnitFiles(MODEL_STORE);
let relocate = 0, skipIdentical = 0, divergent = 0;
const divergentUuids: string[] = [];
const relocateUuids: string[] = [];
// ★ PO safety routing: the OVERLAP set (uuid real in BOTH stores) is the ONLY place zero-data-loss can break — prove
// byte-identical PER-UUID (33/33), never in aggregate. Collect every overlap uuid with its size + a sha256 of BOTH copies.
const overlap: Array<{ uuid: string; size: number; sha: string; identical: boolean }> = [];
const sha = (b: Buffer) => crypto.createHash('sha256').update(b).digest('hex').slice(0, 16);
for (const f of files) {
  const uuid = path.basename(f, '.scenario.json');
  const dest = shardPath(SCEN_INDEX, uuid);
  if (!fs.existsSync(dest)) { relocate++; if (relocateUuids.length < 5) relocateUuids.push(uuid); continue; }
  const a = fs.readFileSync(f), b = fs.readFileSync(dest);
  const identical = a.equals(b);
  overlap.push({ uuid, size: a.length, sha: sha(a), identical });
  if (identical) skipIdentical++;
  else { divergent++; if (divergentUuids.length < 40) divergentUuids.push(uuid); }
}

console.log('=== R40.81 one-store migration — Slice 1 DRY-RUN (data unification) ===');
console.log(`  snapshot present: ${path.relative(ROOT, SNAPSHOT)} ✓ (reversibility floor)`);
console.log(`  MODEL_STORE real unit files (symlinks excluded): ${files.length}`);
console.log(`  RELOCATE (model-store-only → scenario/index): ${relocate}   e.g. ${relocateUuids.map((u) => u.slice(0, 8)).join(', ') || '-'}`);
console.log(`  SKIP (present + byte-identical overlap):       ${skipIdentical}`);
console.log(`  DIVERGENT (present + differs):                 ${divergent}`);
console.log(`  --- OVERLAP set (real in BOTH stores = the ONLY zero-data-loss risk) — PER-UUID proof (${overlap.length} uuids) ---`);
for (const o of overlap) console.log(`    ${o.identical ? '✓' : '✗ DIVERGENT'} ${o.uuid}  ${o.size}b  sha:${o.sha}`);
console.log(`  → ${skipIdentical}/${overlap.length} byte-identical per-uuid (NOTE: MODEL_STORE also has symlink entries that are already views into scenario/index — not real-file overlaps, no data-loss risk; the architect's "115 overlap" = ${overlap.length} real + those symlinks).`);
if (divergent > 0) {
  console.error(`  ✗ DIVERGENT>0 — ABORT-on-apply (a unit changed since measurement; re-measure, never silently pick). uuids: ${divergentUuids.join(', ')}`);
  process.exit(2);
}
console.log(`  ✓ divergent=0 — loss-free collapse (INV-DATA satisfiable): relocate ${relocate} + skip ${skipIdentical} = ${relocate + skipIdentical} uuids resolve once in scenario/index post-apply.`);
console.log('  --apply HELD for architect chokepoint-1 confirm (write shape) + a SCRATCH index copy (R40.31).');
