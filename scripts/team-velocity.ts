/**
 * team.velocity — deterministic team velocity dashboard.
 *
 * Sources: po.chainFollowUp (chain completion), git log (throughput).
 * Deterministic: same inputs → same output. Validated 3x before authoritative.
 *
 * Usage:
 *   npx tsx scripts/team-velocity.ts
 *   npx tsx scripts/team-velocity.ts --since 2026-06-10
 *   npx tsx scripts/team-velocity.ts --hours 5
 *   npx tsx scripts/team-velocity.ts --sprint S19
 *
 * [impl:uuid:e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8901] team.velocity
 */
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ScenarioIndex, type ScenarioUnit } from '../src/ts/scenario/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(__dirname, '..');
const INDEX_DIR = path.join(REPO, 'scenario/index');

const args = process.argv.slice(2);
const sinceIdx = args.indexOf('--since');
const hoursIdx = args.indexOf('--hours');
const sprintIdx = args.indexOf('--sprint');
const sprintFilter = sprintIdx !== -1 ? args[sprintIdx + 1] : null;

// Determine period
let sinceDate: string;
if (sinceIdx !== -1) {
  sinceDate = args[sinceIdx + 1];
} else if (hoursIdx !== -1) {
  const h = parseFloat(args[hoursIdx + 1]);
  const d = new Date(Date.now() - h * 3600_000);
  sinceDate = d.toISOString().slice(0, 19);
} else {
  // Default: today (UTC midnight)
  sinceDate = new Date().toISOString().slice(0, 10);
}

// --- THROUGHPUT from git ---
function gitCount(since: string, grepPattern?: string): number {
  try {
    const grep = grepPattern ? `| grep -i "${grepPattern}"` : '';
    const cmd = `git -C "${REPO}" log --oneline --since="${since}" ${grep} | wc -l`;
    return parseInt(execSync(cmd, { encoding: 'utf-8' }).trim()) || 0;
  } catch { return 0; }
}

function gitFirstLast(since: string): { first: string; last: string } {
  try {
    const first = execSync(`git -C "${REPO}" log --format=%aI --since="${since}" --reverse | head -1`, { encoding: 'utf-8' }).trim();
    const last = execSync(`git -C "${REPO}" log --format=%aI --since="${since}" | head -1`, { encoding: 'utf-8' }).trim();
    return { first, last };
  } catch { return { first: '', last: '' }; }
}

const totalCommits = gitCount(sinceDate);
const versionBumps = gitCount(sinceDate, 'v0\\.');
const { first, last } = gitFirstLast(sinceDate);

let hoursElapsed = 0;
if (first && last) {
  hoursElapsed = Math.max(0.1, (new Date(last).getTime() - new Date(first).getTime()) / 3600_000);
}

// --- CHAIN COMPLETION from scenario index ---
const idx = new ScenarioIndex(INDEX_DIR);

function model(uuid: string): Record<string, unknown> | null {
  const u = idx.get(uuid);
  return u ? u.model as Record<string, unknown> : null;
}

function unitType(uuid: string): string {
  const u = idx.get(uuid);
  return u ? u.ior.replace('ior:class:', '') : '';
}

function isOrphanByDesign(uuid: string): boolean {
  const m = model(uuid);
  if (!m) return false;
  if (m.orphanByDesign === true || m.orphanByDesign === 'true') return true;
  return String(m.tags || '').includes('orphanByDesign');
}

function ior(s: string): string { return String(s || '').replace('ior:instance:', ''); }

function isChainComplete(reqUuid: string): boolean {
  const reqM = model(reqUuid);
  if (!reqM) return false;
  const ucIors = ((reqM.useCases as string[]) || []).filter(u => unitType(ior(u)) === 'UseCase');
  if (ucIors.length === 0) return false;

  for (const ucIorStr of ucIors) {
    const ucM = model(ior(ucIorStr));
    if (!ucM) continue;
    const clsIors = (ucM.classes as string[]) || [];
    for (const clsIorStr of clsIors) {
      const clsM = model(ior(clsIorStr));
      if (!clsM) continue;
      const methIors = (clsM.methods as string[]) || [];
      for (const methIorStr of methIors) {
        const methM = model(ior(methIorStr));
        if (!methM) continue;
        const implIors = (methM.implementations as string[]) || [];
        for (const implIorStr of implIors) {
          const implM = model(ior(implIorStr));
          if (!implM) continue;
          const testIors = (implM.tests as string[]) || [];
          if (testIors.length > 0 && testIors.some(t => idx.has(ior(t)))) {
            return true; // At least one full chain exists
          }
        }
      }
    }
  }
  return false;
}

// Collect requirements
let allReqs = idx.list().filter(u => unitType(u) === 'Requirement');
if (sprintFilter) {
  const num = sprintFilter.replace(/^S/i, '');
  allReqs = allReqs.filter(u => {
    const m = model(u);
    const text = String(m?.name || '') + ' ' + String(m?.altId || '');
    return text.includes(`R${num}.`) || text.toUpperCase().includes(sprintFilter.toUpperCase());
  });
}

const included = allReqs.filter(u => !isOrphanByDesign(u));
const excluded = allReqs.length - included.length;
const complete = included.filter(u => isChainComplete(u)).length;
const total = included.length;
const remaining = total - complete;
const pct = total > 0 ? ((complete / total) * 100).toFixed(1) : '0.0';

// --- OUTPUT ---
const commitsPerHr = hoursElapsed > 0 ? (totalCommits / hoursElapsed).toFixed(1) : '0.0';
const bumpsPerHr = hoursElapsed > 0 ? (versionBumps / hoursElapsed).toFixed(1) : '0.0';
const velocityPerHr = hoursElapsed > 0 ? (complete / hoursElapsed).toFixed(2) : '0.00';

console.log(`\n# Team Velocity Dashboard`);
console.log(`Period: ${first || sinceDate} → ${last || 'now'} (${hoursElapsed.toFixed(1)}h)`);
if (sprintFilter) console.log(`Scope: ${sprintFilter}`);

console.log(`\n## Chain Completion (po.chainFollowUp canonical)`);
console.log(`  Complete: ${complete}/${total} (${pct}%) — excluded: ${excluded} orphanByDesign`);

console.log(`\n## Throughput`);
console.log(`  Commits: ${totalCommits} (${commitsPerHr}/hr)`);
console.log(`  Version bumps: ${versionBumps} (${bumpsPerHr}/hr)`);

console.log(`\n## Session`);
console.log(`  Duration: ${hoursElapsed.toFixed(1)}h`);
console.log(`  Velocity: ${velocityPerHr} chains/hr`);

if (remaining > 0 && parseFloat(velocityPerHr) > 0) {
  const eta = remaining / parseFloat(velocityPerHr);
  console.log(`\n## Projection (ESTIMATE)`);
  console.log(`  Remaining: ${remaining} chains`);
  console.log(`  At current rate (${velocityPerHr}/hr): ~${eta.toFixed(1)}h to ${total}/${total}`);
  console.log(`  ⚠ Estimate based on current rate — not a commitment`);
}

console.log('');
