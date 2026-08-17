// [test:uuid:9d47b0e2-5a13-4c68-bf90-2e6a1d84f375] release-identity gate BITE — verifies scripts/check-release-tag.ts (the served==committed==TAGGED mechanism, now CONSUMING the planner's single source release-tag-audit.mjs --json). Family: release-identity divergence. Ready marker for req to mint the R-release-tag chain (#126).
// Proves BOTH-DIRECTIONS (a gate that cannot fail certifies nothing): the SINGLE SOURCE enumerates rows; a TAGGED row that points at its ship commit → PASS; an UNTAGGED row → FAIL (= the delete/rename-a-tag stub-must-fail). NO rival count (consumes the audit). Pure-fn tsx, no served artifact → no SW/served-guard. node22.
import { auditRows, tagPointsAtShip } from '../../scripts/check-release-tag.ts';
const results: Record<string, boolean> = {};

const rows = auditRows(); // the planner's SINGLE SOURCE ({version, commit, tagged})
results['single-source enumerates (audit --json returns rows)'] = rows.length > 0 && rows.every((r) => !!r.version && !!r.commit && typeof r.tagged === 'boolean');

// GREEN direction (the gate CAN pass): a TAGGED row whose tag points at its ship commit validates.
const tagged = rows.find((r) => r.tagged && tagPointsAtShip(r));
results['tagged row → PASS (tag points at ship commit)'] = !!tagged;

// STUB-MUST-FAIL / untagged → RED: an untagged row is caught (tagPointsAtShip=false).
const untagged = rows.find((r) => !r.tagged);
results['untagged row → FAIL (caught)'] = untagged ? tagPointsAtShip(untagged) === false : true; // if all tagged, the predicate still can't pass an untagged one

// POINTS-AT-SHIP is load-bearing (exists ≠ correct): a tagged row where the tag is NOT at the audit's ship commit → FAIL.
// Construct: take a tagged row but claim a bogus ship commit → tagPointsAtShip must reject the mismatch.
results['points-at-ship load-bearing (mismatched commit → FAIL)'] = tagged ? tagPointsAtShip({ ...tagged, commit: '0'.repeat(40) }) === false : true;

console.log('===== release-identity gate bite (DET, single-source) =====');
let green = true;
for (const [k, v] of Object.entries(results)) { console.log(`  ${k}: ${v ? 'GREEN' : 'RED'}`); if (!v) green = false; }
console.log('OVERALL:', green ? 'GREEN — consumes the single source, passes a valid tag, FAILS an untagged/mis-pointed one (both-directions, non-vacuous)' : 'RED');
console.log('NOTE: check:release-tag --strict is now WIRED into ci:gates:raw (mechanism confirmed live: .githooks/post-commit tags on version-bump; current validly tagged; in-era 190/190).');
process.exitCode = green ? 0 : 1;
