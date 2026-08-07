/**
 * R-C3 — `consistency:strict` ci:gate entry (INV-C3-4). Composes the S37 fail-closed guards and exits NON-ZERO
 * with a NAMED reason on any refusal — a drifted/vacuous state cannot pass CI ("no silent broken state").
 *
 *   - in-process: consistencyStrict(idx) = pin (R-C1 resolveSprintPin) + dual-status (R-C5 assertStatusConsistent),
 *     each fronted by refuseIfVacuous/assertNonVacuous so vacuous input FAILS.
 *   - subprocess: board-drift (R-C2) + migration-refuse (R-C7) via `check:sprint-md` (already fail-closed post-R-C7).
 *
 * Run: /opt/node22/bin/node --import tsx scripts/consistency-strict.ts   (tsx-via-vscode-node is denied in this env)
 * Fold into ci:gates:raw so `npm run ci:gates` enforces it.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { ScenarioIndex } from '../src/ts/scenario/index-store.js';
import { consistencyStrict } from '../src/ts/scenario/consistency-guard.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const idx = new ScenarioIndex(path.join(ROOT, 'scenario/index'));

const refusals: string[] = [];

// (a)+(c) in-process: pin + dual-status, fail-closed on vacuous input
for (const r of consistencyStrict(idx)) if (!r.ok) refusals.push(r.reason || 'unnamed refusal');

// (b) board-drift + migration-refuse: check:sprint-md is the composed fail-closed gate (round-trip byte-match)
try {
  execFileSync('npm', ['run', 'check:sprint-md'], { cwd: ROOT, stdio: 'pipe' });
} catch (e) {
  const out = (e as { stdout?: Buffer }).stdout?.toString() || '';
  refusals.push(`consistency:strict/board-files-drift: check:sprint-md FAILED (round-trip drift or refusal) — ${out.trim().split('\n').slice(-3).join(' | ') || 'see check:sprint-md output'}`);
}

if (refusals.length > 0) {
  console.error(`\n✗ consistency:strict — ${refusals.length} refusal(s) (files are the ONE source of truth; pin+board must not drift):`);
  for (const r of refusals) console.error(`  - ${r}`);
  process.exit(1);
}
console.log('✓ consistency:strict — pin == board == files == units (no drift, no vacuous pass)');
