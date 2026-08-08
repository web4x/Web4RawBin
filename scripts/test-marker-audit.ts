/**
 * R-C3 [test]-marker forward-guard + reporter (architect da2a029e8, PO sequence step 1). Uses the SINGLE-SOURCE
 * predicate src/ts/scenario/test-marker-attach.ts (same one the tester baseline imports → counts can't drift).
 *
 *   default : report the 3 buckets (complete / unproven / fictional) + worst files. No exit-fail.
 *   --strict: FORWARD-GUARD — fail (exit 1) if a NON-complete marker appears that is NOT in the committed baseline
 *             (test/.test-marker-baseline.json). Stops the hole GROWING without blocking on the existing backlog
 *             (delta discipline). Drain shrinks the baseline; post-drain an empty baseline makes --strict = all-complete.
 *   --write-baseline: snapshot the current non-complete uuids as the baseline (run when the file-set is LOCKED).
 *
 * Run: /opt/node22/bin/node --import tsx scripts/test-marker-audit.ts [--strict|--write-baseline]
 * CANONICAL file-set (PO ruling 2026-08-08) = full test/ + src/ (the architect shared-contract glob) — ONE glob all
 * parties share so the per-bucket counts lock to a single number. The predicate itself is file-set-agnostic.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ScenarioIndex } from '../src/ts/scenario/index-store.js';
import { scanTestMarkers } from '../src/ts/scenario/test-marker-attach.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// CANONICAL file-set (PO ruling 2026-08-08 = architect shared-contract): full test/ + src/ — ONE glob all parties
// share so the per-bucket counts lock to a single number (kills the 437-vs-387-vs-652 divergence).
const SCAN_DIRS = [path.join(ROOT, 'test'), path.join(ROOT, 'src')];
const BASELINE = path.join(ROOT, 'test/.test-marker-baseline.json');
const MODE = process.argv.includes('--write-baseline') ? 'write-baseline' : process.argv.includes('--strict') ? 'strict' : 'report';
const idx = new ScenarioIndex(path.join(ROOT, 'scenario/index'));
const bare = (s: string) => String(s).replace('ior:instance:', '').split('@')[0];
const nameOf = (u: string) => { const x = idx.get(bare(u)); return x ? String((x.model as any).name || u) : `(unresolved ${u.slice(0, 8)})`; };

// single-source: scanTestMarkers carries all 4 dims (glob+regex+block+pigeonhole) — the audit re-implements nothing.
const r = scanTestMarkers(ROOT, nameOf, fs as any, path.join);
const b = { complete: r.complete, unproven: r.unproven, fictional: r.fictional };
const rel = (f: string) => path.relative(ROOT, f);

console.log(`\n[test]-marker audit — ${MODE} (${r.markerTotal} markers / ${r.fileCount} files, BROAD test/+src/ incl *-gate.mjs)`);
if (r.outsideScope.length) console.log(`  ⚠ OUTSIDE-SCOPE (INVALID, 0 credit): ${r.outsideScope.length} [test:uuid] in non-test src files — ${r.outsideScope.slice(0, 3).map((m) => rel(m.file)).join(', ')}`);
console.log(`  PROVEN_COMPLETE  (credit stands)          : ${b.complete.length}`);
console.log(`  UNPROVEN         (suspend · needs-reattach): ${b.unproven.length}`);
console.log(`  PROVEN_FICTIONAL (deny · write-test debt)  : ${b.fictional.length}`);

if (MODE === 'write-baseline') {
  const nonComplete = [...b.unproven, ...b.fictional].map((m) => m.uuid).sort();
  fs.writeFileSync(BASELINE, JSON.stringify({ note: 'R-C3 [test]-marker delta baseline — non-complete uuids known at snapshot. --strict fails on any NON-complete marker NOT listed here (stops the hole growing). Shrink on drain.', fileSet: 'test/**/*.ts', count: nonComplete.length, uuids: nonComplete }, null, 2) + '\n');
  console.log(`\n✓ wrote baseline (${nonComplete.length} known non-complete uuids) → ${rel(BASELINE)}`);
  process.exit(0);
}

if (MODE === 'strict') {
  const baseline: Set<string> = fs.existsSync(BASELINE) ? new Set(JSON.parse(fs.readFileSync(BASELINE, 'utf-8')).uuids || []) : new Set();
  const newBad = [...b.unproven, ...b.fictional].filter((m) => !baseline.has(m.uuid));
  if (newBad.length > 0) {
    console.error(`\n✗ FORWARD-GUARD FAIL (INV-T2): ${newBad.length} NEW non-complete [test] marker(s) not in baseline — a [test:uuid] must HEAD a name-matched it()/test()/describe() block:`);
    for (const m of newBad.slice(0, 20)) console.error(`  - ${m.uuid.slice(0, 8)} @ ${rel(m.file)} (${m.unitName.slice(0, 50)})`);
    if (!fs.existsSync(BASELINE)) console.error('  (no baseline yet — run --write-baseline once the file-set is locked with the tester)');
    process.exit(1);
  }
  console.log(`\n✓ forward-guard: no NEW stacked markers beyond the ${baseline.size}-uuid baseline (backlog drains via re-attach/write-test).`);
  process.exit(0);
}

// report mode: worst files
const perFile = new Map<string, { c: number; u: number; f: number }>();
for (const m of b.complete) (perFile.get(m.file) || perFile.set(m.file, { c: 0, u: 0, f: 0 }).get(m.file)!).c++;
for (const m of b.unproven) (perFile.get(m.file) || perFile.set(m.file, { c: 0, u: 0, f: 0 }).get(m.file)!).u++;
for (const m of b.fictional) (perFile.get(m.file) || perFile.set(m.file, { c: 0, u: 0, f: 0 }).get(m.file)!).f++;
const worst = [...perFile.entries()].sort((a, z) => z[1].f - a[1].f).slice(0, 8);
console.log('  worst (by fictional):');
for (const [f, s] of worst) if (s.f) console.log(`    ${rel(f)}: fictional ${s.f} / unproven ${s.u} / complete ${s.c}`);
console.log('\n(report only — use --strict in ci:gates, --write-baseline once file-set locked.)');
