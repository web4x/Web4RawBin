/**
 * R37.3 [impl]-marker forward-guard + reporter (architect da2a029e8 policy B + PO honest-buckets). Uses the SINGLE-SOURCE
 * predicate src/ts/scenario/impl-marker-attach.ts (same one trace-audit imports). Symmetric partner of test-marker-audit.ts.
 *
 *   default : report the 7-way buckets. No exit-fail.
 *   --strict: FORWARD-GUARD — fail (exit 1) if a NON-crediting marker appears that is NOT in the committed baseline
 *             (test/.impl-marker-baseline.json). Stops the hole GROWING without blocking on the existing backlog.
 *   --write-baseline: snapshot the current non-crediting uuids as the baseline.
 * CREDIT-CONFERRING = PROVEN_COMPLETE (method/handler attach) + COMPLETE_FILE_SCOPE (component-scope tag). Everything
 * else (split-for-cluster / anon-handler residue / unproven-needs-reattach / fictional / outside-scope) does NOT credit.
 *
 * Run: /opt/node22/bin/node --import tsx scripts/impl-marker-audit.ts [--strict|--write-baseline]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanImplMarkers, type ImplMarkerRef } from '../src/ts/scenario/impl-marker-attach.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = path.join(ROOT, 'test/.impl-marker-baseline.json');
const MODE = process.argv.includes('--write-baseline') ? 'write-baseline' : process.argv.includes('--strict') ? 'strict' : 'report';
const rel = (f: string) => path.relative(ROOT, f);
const r = scanImplMarkers(ROOT, fs as any, path.join);
const nonCrediting: ImplMarkerRef[] = [...r.splitForCluster, ...r.anonHandler, ...r.unproven, ...r.fictional, ...r.outsideScope];

console.log(`\n[impl]-marker audit — ${MODE} (${r.markerTotal} markers / ${r.fileCount} files, src+scripts; test=outside-scope)`);
console.log(`  PROVEN_COMPLETE     : ${r.complete.length}   COMPLETE_FILE_SCOPE : ${r.completeFileScope.length}   → credit ${r.complete.length + r.completeFileScope.length}`);
console.log(`  SPLIT_FOR_CLUSTER   : ${r.splitForCluster.length}   ANON_HANDLER : ${r.anonHandler.length}   UNPROVEN/needs-reattach : ${r.unproven.length}   FICTIONAL : ${r.fictional.length}   outside-scope : ${r.outsideScope.length}`);

if (MODE === 'write-baseline') {
  const uuids = nonCrediting.map((m) => m.uuid).sort();
  fs.writeFileSync(BASELINE, JSON.stringify({ note: 'R37.3 [impl]-marker delta baseline — non-crediting uuids at snapshot. --strict fails on any NON-crediting marker NOT listed (stops the hole growing). Shrink on drain (consolidate/reattach).', count: uuids.length, uuids }, null, 2) + '\n');
  console.log(`\n✓ wrote baseline (${uuids.length} non-crediting uuids) → ${rel(BASELINE)}`);
  process.exit(0);
}

if (MODE === 'strict') {
  const baseline: Set<string> = fs.existsSync(BASELINE) ? new Set(JSON.parse(fs.readFileSync(BASELINE, 'utf-8')).uuids || []) : new Set();
  const newBad = nonCrediting.filter((m) => !baseline.has(m.uuid));
  if (newBad.length > 0) {
    console.error(`\n✗ FORWARD-GUARD FAIL (INV-T2 [impl]): ${newBad.length} NEW non-crediting [impl] marker(s) not in baseline — a [impl:uuid] must HEAD a named-member decl or a handler node with a method label:`);
    for (const m of newBad.slice(0, 20)) console.error(`  - ${m.uuid.slice(0, 8)} @ ${rel(m.file)} (${m.label || m.text.slice(0, 40)})`);
    if (!fs.existsSync(BASELINE)) console.error('  (no baseline yet — run --write-baseline to snapshot the existing backlog)');
    process.exit(1);
  }
  console.log(`\n✓ forward-guard: no NEW non-crediting [impl] markers beyond the ${baseline.size}-uuid baseline.`);
  process.exit(0);
}
console.log('\n(report only — use --strict in ci:gates, --write-baseline to snapshot.)');
