/**
 * META-GATE — the required safety gates must stay WIRED into ci:gates:raw. Enforce, do NOT document.
 *
 * A rewind silently DROPPED check:room-persist-invariant out of ci:gates:raw (2026-09-12): the guard was code-live
 * but its gate had fallen out of the suite, so a regression would have passed unnoticed. We had gates guarding the
 * code and NOTHING guarding that the gates are wired. Same hazard family as a rewind reverting server.ts+12 files or
 * silently deleting the regen refuse-to-write guard: a rewind can un-wire a safety mechanism and leave no trace.
 * A guard that can be silently un-wired is not a guard. This gate asserts the REQUIRED set is present in ci:gates:raw
 * (remove one -> RED) and includes ITSELF (cannot be silently dropped either).
 */
import { readFileSync } from 'node:fs';

// The gates that must NEVER silently fall out of ci:gates:raw. Add R40.106 gates here as they land.
const REQUIRED = [
  'check:gates-wired',                  // self-guard: the meta-gate cannot be silently dropped either
  'check:room-persist-invariant',       // R40.107 #1/#2/#5/#6 — room identity/persist invariants
  'check:parentfolder-not-containment', // R40.106 INC-4a — containment is the edge, never parentFolder
  'check:test-room-single-source',      // test-room ratchet (tester)
];

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const raw = String(pkg.scripts?.['ci:gates:raw'] || '');
const wired = new Set([...raw.matchAll(/npm run ([\w:-]+)/g)].map((m) => m[1]));

const missing = REQUIRED.filter((g) => !wired.has(g));
if (missing.length) {
  console.error(`✗ META-GATE: required gate(s) NOT wired into ci:gates:raw — a rewind/edit un-wired a safety mechanism: ${missing.join(', ')}. Re-add them (a guard that can be silently un-wired is not a guard).`);
  process.exit(1);
}
// each required gate must also be a defined script (wired to a real runner, not a dangling npm-run)
const undef = REQUIRED.filter((g) => !pkg.scripts?.[g]);
if (undef.length) { console.error(`✗ META-GATE: required gate(s) wired but not DEFINED as scripts: ${undef.join(', ')}.`); process.exit(1); }

console.log(`✓ META-GATE: all ${REQUIRED.length} required gates wired + defined in ci:gates:raw [${REQUIRED.join(', ')}].`);
