// Release-identity gate (FAMILY: release-identity divergence — served vs committed vs TAGGED). served==committed is
// guarded elsewhere; this is the THIRD leg: ==TAGGED. Every deployed version MUST have a git tag v<version> pointing at
// its ship commit, so an untagged deploy is impossible-to-MISS (habit lapsed TWICE; only a mechanism holds).
//
// ★ SINGLE SOURCE: this gate CONSUMES the planner's enumeration `scripts/release-tag-audit.mjs --json` ({version,commit,
// tagged}) — it does NOT roll its own version/tag count (two independent counts of one fact = the two-source disease that
// made 357-vs-514 look divergent when they were the SAME set at different scopes). The gate ADDS the tester's check the
// audit doesn't: the tag actually POINTS AT the ship commit (tagged-exists ≠ tagged-correctly).
//
// MODE: report-only (default) — reports the current deploy's tag status + the audit's gap, ALWAYS exit 0. --strict — exit 1
//       if the CURRENT version is untagged / mis-pointed. Flip --strict + wire into ci:gates ONCE the expert's tag-on-deploy
//       mechanism is confirmed LIVE in the deploy path (build.mjs) — else a lapse re-opens silently.
// Run: node --import tsx scripts/check-release-tag.ts [--strict]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STRICT = process.argv.includes('--strict');
const git = (args: string[]): string => { try { return execFileSync('git', args, { cwd: ROOT, encoding: 'utf-8' }).trim(); } catch { return ''; } };

export interface AuditRow { version: string; commit: string; tagged: boolean }
// CONSUME the planner's SINGLE-SOURCE enumeration (no rival count).
export function auditRows(): AuditRow[] {
  try {
    const out = execFileSync('node', [path.join(ROOT, 'scripts/release-tag-audit.mjs'), '--json'], { cwd: ROOT, encoding: 'utf-8', maxBuffer: 1 << 28 });
    return out.split('\n').filter(Boolean).map((l) => JSON.parse(l) as AuditRow);
  } catch { return []; }
}
// The tester's ADDED check: the tag POINTS AT the ship commit the audit names (exists ≠ correct).
export function tagPointsAtShip(row: AuditRow): boolean {
  if (!row.tagged) return false;
  const tagCommit = git(['rev-list', '-n', '1', `v${row.version}`]);
  return tagCommit !== '' && tagCommit === row.commit;
}

if (process.argv[1] && /check-release-tag\.(ts|js|mjs)$/.test(process.argv[1])) {
  const rows = auditRows();
  const version = (() => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8')).version as string; } catch { return ''; } })();
  // SELF-BITE: the single source must produce rows AND include the current version (else the gate is INERT/mis-consuming).
  if (rows.length === 0 || !version || !rows.find((r) => r.version === version)) {
    console.error(`✗ check-release-tag: SELF-BITE FAILED — release-tag-audit --json returned ${rows.length} rows, current ${version} ${rows.find((r) => r.version === version) ? 'present' : 'ABSENT'}. Gate INERT. RED.`);
    process.exit(1);
  }
  const cur = rows.find((r) => r.version === version)!;
  const currentOk = cur.tagged && tagPointsAtShip(cur);
  const untagged = rows.filter((r) => !r.tagged);

  console.log(`release-tag gate [${STRICT ? 'STRICT' : 'report-only'}] — served==committed==TAGGED (single source: release-tag-audit.mjs)`);
  console.log(`  audit enumeration: ${rows.length} shipped versions · ${rows.length - untagged.length} tagged · ${untagged.length} UNTAGGED (planner's number, not a rival count)`);
  console.log(`  current version ${version}: tagged=${cur.tagged} points-at-ship=${tagPointsAtShip(cur)} (ship commit ${cur.commit.slice(0, 9)})`);

  if (currentOk) { console.log(`  ✓ current deploy ${version} is validly tagged (v${version} → ships ${cur.commit.slice(0, 9)}).`); process.exit(0); }
  const msg = `${STRICT ? '✗' : '⚠'} check-release-tag: current deploy ${version} is ${cur.tagged ? 'MIS-POINTED (tag v' + version + ' not at ship commit ' + cur.commit.slice(0, 9) + ')' : 'UNTAGGED'} — expert's tag-on-deploy must tag the ship commit.`;
  (STRICT ? console.error : console.log)(msg);
  if (STRICT) process.exit(1);
  console.log(`  (report-only: flip --strict once the expert's tag-on-deploy is confirmed live in build.mjs. self-BITE ✓, single-source ✓)`);
}
