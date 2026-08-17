#!/usr/bin/env node
// release-tag-audit.mjs — THE SINGLE SOURCE for version<->tag enumeration (release-ops).
//
// Standard: scrum.pmo/standards/release-tagging.md (tag-on-deploy). This script is the ONE
// enumeration both release-ops (robbin-planner, backfill/audit) AND the tester's release-tag gate
// CONSUME — do NOT roll a second count (two independent version/tag counts = two-source-one-fact,
// exactly the disease that made 357-vs-514 look divergent when they were the same set at different
// scopes). Tester gate: `node release-tag-audit.mjs --json` -> the authoritative {version,commit,
// subject,tagged} list; assert served==committed==TAGGED against it.
//
// RULE (introduce-commit): a version X's ship commit = the FIRST (oldest) commit whose package.json
// version == X (build.mjs stamps package.json atomically with the deploy commit). A version that
// NEVER appears in package.json history NEVER shipped -> it is a sequence-gap, reported as NEVER-SHIPPED
// and NEVER tagged (do not fabricate). "tagged" claims shipped-TO-REPO, not served (see the standard).
//
// Usage:
//   node release-tag-audit.mjs --audit [LO HI]   # counts + untagged-shipped + never-shipped gaps (default full range)
//   node release-tag-audit.mjs --json  [LO HI]    # machine list the tester consumes (one line JSON per version)
//   node release-tag-audit.mjs --backfill LO HI   # create annotated tags for untagged SHIPPED versions in (LO,HI], exact commit; idempotent; refuses gaps
//   (LO exclusive, HI inclusive; semver x.y.z)
//
// I (robbin-planner) OWN this script (release-ops). Creating git TAGS is release-ops bookkeeping, NOT
// code — package.json/build.mjs are NEVER touched here (planner law). The tag-on-deploy MECHANISM
// (auto-tag inside build.mjs's deploy step) is the EXPERT's; the served==committed==tagged GATE is the
// TESTER's. This file is part-1 (the record's enumeration); it does not replace parts 2 and 3.

import { execSync } from 'node:child_process';
import path from 'node:path';

const R = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const git = a => execSync(`git -C ${R} ${a}`, { encoding: 'utf8', maxBuffer: 1 << 28 });
const cmp = (a, b) => { const A = a.split('.').map(Number), B = b.split('.').map(Number); for (let i = 0; i < 3; i++) if (A[i] !== B[i]) return A[i] - B[i]; return 0; };

// THE enumeration: version -> {commit, ct} of the first commit that ADDED that version to package.json.
function enumerate() {
  const log = git(`log --reverse -p --format=@@%H@@%ct -- package.json`);
  const firstSetAt = new Map();
  let cur = null, ct = null;
  for (const line of log.split('\n')) {
    const m = line.match(/^@@([0-9a-f]{40})@@(\d+)/);
    if (m) { cur = m[1]; ct = m[2]; continue; }
    const v = line.match(/^\+\s*"version":\s*"(\d+\.\d+\.\d+)"/);
    if (v && cur && !firstSetAt.has(v[1])) firstSetAt.set(v[1], { commit: cur, ct: Number(ct) });
  }
  return firstSetAt;
}
const tagSet = () => new Set(git('tag -l').split('\n').map(s => s.trim()).filter(Boolean));
function gapsBetween(sortedVers) {
  const gaps = [];
  for (let i = 1; i < sortedVers.length; i++) {
    const a = sortedVers[i - 1].split('.').map(Number), b = sortedVers[i].split('.').map(Number);
    if (a[0] === b[0] && a[1] === b[1]) for (let n = a[2] + 1; n < b[2]; n++) gaps.push(`${a[0]}.${a[1]}.${n}`);
  }
  return gaps;
}

const args = process.argv.slice(2);
const mode = args.find(a => a.startsWith('--')) || '--audit';
const nums = args.filter(a => /^\d+\.\d+\.\d+$/.test(a));
const map = enumerate();
const tags = tagSet();
const allSorted = [...map.keys()].sort(cmp);
const LO = nums[0] || '0.0.0';   // exclusive
const HI = nums[1] || allSorted[allSorted.length - 1]; // inclusive
const inRange = allSorted.filter(v => (nums[0] ? cmp(v, LO) > 0 : true) && cmp(v, HI) <= 0);

if (mode === '--json') {
  for (const v of inRange) console.log(JSON.stringify({ version: v, commit: map.get(v).commit, tagged: tags.has(`v${v}`) }));
  process.exit(0);
}
if (mode === '--audit') {
  const untagged = inRange.filter(v => !tags.has(`v${v}`));
  const gaps = gapsBetween(inRange);
  console.log(`release-tag-audit: range (${nums[0] || '-inf'} , ${HI}]  shipped=${inRange.length}  tagged=${inRange.length - untagged.length}  UNTAGGED=${untagged.length}  never-shipped-gaps=${gaps.length}`);
  for (const v of untagged) { const c = map.get(v).commit; console.log(`  UNTAGGED v${v.padEnd(8)} ${c.slice(0, 9)}  ${git(`log -1 --format=%s ${c}`).trim().slice(0, 62)}`); }
  if (gaps.length) console.log(`  NEVER-SHIPPED (sequence gaps, NOT tagged): ${gaps.join(', ')}`);
  process.exit(0);
}
if (mode === '--backfill') {
  if (!nums[0] || !nums[1]) { console.error('--backfill needs LO HI'); process.exit(2); }
  let made = 0, skip = 0;
  for (const v of inRange) {
    if (tags.has(`v${v}`)) { skip++; continue; }
    const c = map.get(v).commit;
    const msg = `release v${v} — tag-on-deploy standard, tagged at the exact ship commit (release-tag-audit backfill)`;
    try { git(`tag -a v${v} ${c} -m ${JSON.stringify(msg)}`); made++; } catch (e) { console.log(`FAILED v${v}: ${String(e.message || e).slice(0, 70)}`); }
  }
  console.log(`backfill (${LO} , ${HI}]: created ${made}, skipped ${skip} already-tagged. never-shipped gaps are NOT tagged (see --audit).`);
  process.exit(0);
}
console.error('unknown mode; use --audit | --json | --backfill');
process.exit(2);
