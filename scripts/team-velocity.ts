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
const REPO = path.resolve(path.join(__dirname, '..'));
const INDEX_DIR = path.join(REPO, 'scenario/index');

const args = process.argv.slice(2);
const sinceIdx = args.indexOf('--since');
const hoursIdx = args.indexOf('--hours');
const sprintIdx = args.indexOf('--sprint');
const sprintFilter = sprintIdx !== -1 ? args[sprintIdx + 1] : null;

// Determine period — default: last 24 hours (never ambiguous early-in-day)
let sinceDate: string;
let windowLabel: string;
if (sinceIdx !== -1) {
  sinceDate = args[sinceIdx + 1];
  windowLabel = `--since ${sinceDate}`;
} else if (hoursIdx !== -1) {
  const h = parseFloat(args[hoursIdx + 1]);
  const d = new Date(Date.now() - h * 3600_000);
  sinceDate = d.toISOString().slice(0, 19);
  windowLabel = `last ${h}h`;
} else {
  const d = new Date(Date.now() - 24 * 3600_000);
  sinceDate = d.toISOString().slice(0, 19);
  windowLabel = 'last 24h (default)';
}

// --- THROUGHPUT from git (cwd-independent: explicit -C + absolute path) ---
function gitCount(since: string, grepPattern?: string): number {
  try {
    if (grepPattern) {
      const all = execSync(`git -C "${REPO}" log --oneline --since="${since}"`, { encoding: 'utf-8' });
      return (all.match(new RegExp(grepPattern, 'gim')) || []).length;
    }
    const cmd = `git -C "${REPO}" log --oneline --since="${since}" | wc -l`;
    return parseInt(execSync(cmd, { encoding: 'utf-8' }).trim()) || 0;
  } catch { return 0; }
}

function gitFirstLast(since: string): { first: string; last: string } {
  try {
    const all = execSync(`git -C "${REPO}" log --format=%aI --since="${since}"`, { encoding: 'utf-8' }).trim().split('\n').filter(Boolean);
    return { first: all[all.length - 1] || '', last: all[0] || '' };
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

// --- CHAIN COMPLETION: source from po-chain-follow-up (canonical, single source of truth) ---
function getCanonicalCompletion(sprint?: string): { complete: number; total: number; excluded: number } {
  try {
    const sprintArg = sprint ? `--sprint ${sprint}` : '--all';
    const out = execSync(`npx tsx "${path.join(__dirname, 'po-chain-follow-up.ts')}" ${sprintArg}`, { encoding: 'utf-8', cwd: REPO, timeout: 60000 });
    const m = out.match(/(\d+)\/(\d+) COMPLETE \(excluded: (\d+)/);
    if (m) return { complete: parseInt(m[1]), total: parseInt(m[2]), excluded: parseInt(m[3]) };
  } catch {}
  return { complete: 0, total: 0, excluded: 0 };
}

const { complete, total, excluded } = getCanonicalCompletion(sprintFilter || undefined);
const remaining = total - complete;
const pct = total > 0 ? ((complete / total) * 100).toFixed(1) : '0.0';

// --- OUTPUT ---
const commitsPerHr = hoursElapsed > 0 ? (totalCommits / hoursElapsed).toFixed(1) : '0.0';
const bumpsPerHr = hoursElapsed > 0 ? (versionBumps / hoursElapsed).toFixed(1) : '0.0';
const velocityPerHr = hoursElapsed > 0 ? (complete / hoursElapsed).toFixed(2) : '0.00';

console.log(`\n# Team Velocity Dashboard`);
console.log(`Window: ${windowLabel}`);
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
