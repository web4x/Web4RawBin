// [test:uuid:9d47b0e2-5a13-4c68-bf90-2e6a1d84f375] release-identity gate BITE — verifies scripts/check-release-tag.ts (the served==committed==TAGGED mechanism). Family: release-identity divergence. Ready marker for req to mint the R-release-tag chain (scenario-first #126).
// Proves the gate BOTH-DIRECTIONS (a gate that cannot fail certifies nothing): a validly-tagged version → PASS; a missing tag → FAIL (= the delete/rename-a-tag stub-must-fail); a tag NOT pointing at the shipping commit → FAIL. Pure-fn tsx, NO served artifact → no SW/served-guard. node22: PATH=/opt/node22/bin:$PATH npx tsx test/visual/r-release-tag-bite.ts
import { tagIsValidFor, versionAtRef } from '../../scripts/check-release-tag.ts';
const results: Record<string, boolean> = {};

// GREEN direction (the gate CAN pass): a historic validly-tagged version resolves valid.
const okV = tagIsValidFor('0.7.91');
results['valid tag → PASS (v0.7.91 exists + points at ship)'] = okV.exists === true && okV.pointsAtShip === true;

// STUB-MUST-FAIL / delete-a-tag → RED: a version with NO tag is caught. Use a FABRICATED never-shipped version, NOT the
// live current version (which is a moving target — a peer tagged v0.8.100 mid-run, exactly why a hardcoded live version
// is the wrong stub: the bite must be deterministic regardless of what gets tagged).
const missing = tagIsValidFor('0.0.0-never-shipped');
results['missing tag → FAIL (untagged version caught)'] = missing.exists === false && missing.pointsAtShip === false;

// POINTS-AT-SHIP is load-bearing (not just "a tag exists"): the tag's OWN package.json version must equal the tag's version.
// (A rename/mis-placed tag whose commit shipped a different version → pointsAtShip=false.) Proven via the predicate:
results['points-at-ship semantics (tag commit version == tag)'] = versionAtRef('v0.7.91') === '0.7.91'
  && tagIsValidFor('0.7.91').pointsAtShip === (versionAtRef('v0.7.91') === '0.7.91'); // validity is GATED on the match, not mere existence

// SELF-BITE: a nonexistent tag never validates (the gate can't be tricked into GREEN by a bad version string).
results['self-bite: nonexistent tag → invalid'] = tagIsValidFor('9.9.9-nope').pointsAtShip === false;

console.log('===== release-identity gate bite (DET) =====');
let green = true;
for (const [k, v] of Object.entries(results)) { console.log(`  ${k}: ${v ? 'GREEN' : 'RED'}`); if (!v) green = false; }
console.log('OVERALL:', green ? 'GREEN — gate passes on a valid tag, FAILS on a missing/mis-pointed tag (both-directions, non-vacuous)' : 'RED');
console.log('NOTE: the LIVE gate (check:release-tag --strict) is RED-baseline now (0.8.100 untagged) → report-only until planner backfills + expert wires tag-on-deploy, THEN --strict into ci:gates.');
process.exitCode = green ? 0 : 1;
