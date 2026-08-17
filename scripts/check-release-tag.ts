// Release-identity gate (FAMILY: release-identity divergence — served vs committed vs TAGGED). served==committed is
// guarded elsewhere (BOOT_VERSION + the version single-source); this adds the missing third leg: ==TAGGED. Every
// deployed version MUST have a git tag `v<version>` that POINTS AT the commit that shipped it — so an untagged deploy is
// impossible-to-MISS, not merely against a written standard. WHY (measured 2026-08-17): the tag-on-deploy habit failed —
// last tag v0.7.91 while served/committed is 0.8.100 = ~109 untagged releases. A habit doesn't hold; only a mechanism does.
// MODE: report-only (default) — lists the untagged CURRENT version + the backfill gap, ALWAYS exit 0 (never red-from-birth
//       while the planner backfills the ~109 historic tags). --strict — exit 1 if the current version is untagged/mis-tagged
//       (flip once the backfill lands AND the expert wires tag-creation into the deploy path).
// Run: node --import tsx scripts/check-release-tag.ts [--strict]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STRICT = process.argv.includes('--strict');
const git = (args: string[]): string => { try { return execFileSync('git', args, { cwd: ROOT, encoding: 'utf-8' }).trim(); } catch { return ''; } };

// committed version = the DRY single source (== served, guarded by served==committed elsewhere).
export function versionAtRef(ref: string): string | null {
  const raw = ref === '' ? (fs.existsSync(path.join(ROOT, 'package.json')) ? fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8') : '') : git(['show', `${ref}:package.json`]);
  if (!raw) return null;
  try { return JSON.parse(raw).version || null; } catch { return null; }
}

// A version is VALIDLY TAGGED iff a tag `v<version>` exists AND the package.json AT that tag has the SAME version
// (the tag points at a commit that actually shipped this version — not a stray tag on the wrong commit).
export function tagIsValidFor(version: string): { tag: string; exists: boolean; pointsAtShip: boolean } {
  const tag = `v${version}`;
  const exists = git(['tag', '-l', tag]) === tag;
  const pointsAtShip = exists && versionAtRef(tag) === version;
  return { tag, exists, pointsAtShip };
}

// SELF-BITE: the validity predicate MUST reject a missing tag AND a tag pointing at a mismatched version.
const selfBiteMissing = tagIsValidFor('0.0.0-nonexistent').pointsAtShip === false; // no such tag → invalid
const anExistingTag = git(['tag', '-l', 'v0.7.91']) === 'v0.7.91';
const selfBiteWrongVer = !anExistingTag || (versionAtRef('v0.7.91') === '0.7.91'); // an existing tag DOES point at its own version (control)

if (process.argv[1] && /check-release-tag\.(ts|js|mjs)$/.test(process.argv[1])) {
  if (!selfBiteMissing) { console.error('✗ check-release-tag: SELF-BITE FAILED (a nonexistent tag validated) — gate INERT. RED.'); process.exit(1); }

  const version = versionAtRef('');
  if (!version) { console.error('✗ check-release-tag: no package.json version. RED.'); process.exit(1); }
  const cur = tagIsValidFor(version);

  // ★ FORWARD GUARD is this gate's job: the CURRENT deploy must be validly tagged — impossible-to-MISS an untagged release.
  // ★ The HISTORIC BACKFILL enumeration is the PLANNER's SINGLE SOURCE — this gate does NOT roll its own version/tag count
  // (two independent enumerations of the same quantity = the two-source disease: my history-walk once said 514, then 357
  // after `git fetch --tags`, vs the planner's authoritative enumeration from v0.6.0 — a gate must not publish a number that
  // contradicts the backfill it measures). Fetch tags before reading; consult the planner's enumeration for the gap.
  console.log(`release-tag gate [${STRICT ? 'STRICT' : 'report-only'}] — served==committed==TAGGED (family: release-identity divergence)`);
  console.log(`  current version ${version}: tag ${cur.tag} exists=${cur.exists} points-at-ship=${cur.pointsAtShip}`);
  console.log(`  backfill status: SINGLE SOURCE = planner's enumeration (scrum.pmo/standards/release-tagging.md) — NOT computed here.`);

  const currentOk = cur.exists && cur.pointsAtShip;
  if (currentOk) { console.log(`  ✓ current deploy ${version} is validly tagged (${cur.tag} → ships ${version}).`); process.exit(0); }

  const msg = `${STRICT ? '✗' : '⚠'} check-release-tag: current deploy ${version} is ${cur.exists ? `MIS-TAGGED (${cur.tag} points at ${versionAtRef(cur.tag) || '?'}, not ${version})` : `UNTAGGED (no ${cur.tag})`} — tag the shipping commit (expert wires tag-on-deploy).`;
  (STRICT ? console.error : console.log)(msg);
  if (STRICT) process.exit(1);
  console.log(`  (report-only: not failing while the planner backfills; flip --strict once the current version tags + the deploy path auto-tags. self-BITE ✓)`);
}
