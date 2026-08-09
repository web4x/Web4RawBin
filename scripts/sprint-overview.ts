/**
 * R-C6 — sprints.overview.md region generator CLI. Default = --check (drift/missing = FAIL, current-unresolved = WARN
 * so CI is not blocked during the sprint-closure grind). --write = regenerate the between-markers index in place
 * (preserves all hand-narrative outside the markers). Fold --check into check:sprint-md / consistency:strict.
 *
 * Run: /opt/node22/bin/node --import tsx scripts/sprint-overview.ts [--write]   (tsx-via-vscode-node denied in this env)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ScenarioIndex } from '../src/ts/scenario/index-store.js';
import { SprintOverviewGenerator, BEGIN } from '../src/ts/scenario/sprint-overview-generator.js';
import { guardedWriteRegion } from './owned-output-guard.js'; // shared owned-output chokepoint (architect 38ba4a160)

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OVERVIEW = path.join(ROOT, 'scrum.pmo/sprints/sprints.overview.md');
const WRITE = process.argv.includes('--write');
const idx = new ScenarioIndex(path.join(ROOT, 'scenario/index'));
const gen = new SprintOverviewGenerator(idx);
const existing = fs.existsSync(OVERVIEW) ? fs.readFileSync(OVERVIEW, 'utf-8') : null;

if (WRITE) {
  if (existing === null) { console.error('✗ sprint-overview --write: overview file missing — refusing.'); process.exit(1); }
  const out = gen.generateOverview(existing);
  // Route through the shared owned-output chokepoint (region model: ownership = file CONTAINS the GENERATED-INDEX
  // marker; hand-narrative outside BEGIN/END is preserved by generateOverview). Never clobber a markerless file.
  const wrote = guardedWriteRegion(OVERVIEW, out, BEGIN, (b) => b === 'sprints.overview.md');
  if (!wrote) { console.error('✗ sprint-overview --write: owned-output-guard REFUSED (markerless/hand-authored target or wrong name) — nothing written.'); process.exit(1); }
  console.log(`✓ sprint-overview --write: regenerated the between-markers index (narrative outside markers preserved). ${out.length} bytes.`);
  process.exit(0);
}

// --check (default)
const chk = gen.checkOverview(existing);
const hard = chk.reasons.filter((r) => !r.startsWith('R-C6 REPORT'));
const warn = chk.reasons.filter((r) => r.startsWith('R-C6 REPORT'));
for (const w of warn) console.warn(`⚠️  ${w}`);
if (hard.length > 0) {
  console.error('✗ sprint-overview --check FAILED:');
  for (const r of hard) console.error(`  - ${r}`);
  process.exit(1);
}
console.log(`✓ sprint-overview --check: index matches units${chk.currentUnresolved ? ' (current pin UNRESOLVED — live TODO, reported above)' : ''}.`);
