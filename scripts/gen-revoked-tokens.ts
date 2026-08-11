/**
 * R40.22 step-3 — GENERATE the frozen revoked-token list (the 116 dormant dev/test raw-only Device
 * tokens) into data/revoked-tokens.json. Deliberate, reviewed, run-once-per-deploy step — NOT a live
 * derivation (the server never widens the set at runtime).
 *
 * Run: /opt/node22/bin/node --import tsx scripts/gen-revoked-tokens.ts [--write]
 *   (no flag = dry-run: prints the counts + invariants, writes nothing.  --write = materialize the file.)
 *
 * REFUSES TO WRITE unless every safety invariant holds (|revoked|==116, disjoint from enrolled/Tron/
 * File-owners) — over-revoking is the lockout risk, so a drift fails LOUD instead of shipping a bad list.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ScenarioIndex } from '../src/ts/scenario/index.js';
import { ServerManagerGuard } from '../src/ts/server/ServerManagerGuard.js';
import { computeRevocationScope, EXPECTED_REVOKED_COUNT, hashToken } from '../src/ts/server/revoked-tokens.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// TRACKED (salted-hash) list at repo root — deploy-durable, not a credential. NOT under data/ (runtime).
const OUT = path.join(ROOT, 'revoked-token-hashes.json');
const write = process.argv.includes('--write');

const idx = new ScenarioIndex(path.join(ROOT, 'scenario/index'));
const isOwner = (t: string) => ServerManagerGuard.isOwner(t);
const scope = computeRevocationScope(idx, isOwner);

const revoked = new Set(scope.revoked);
const interEnrolled = scope.revoked.filter(t => scope.enrolled.has(t));
const interFile = scope.revoked.filter(t => scope.fileOwners.has(t));
const interOwner = scope.revoked.filter(t => isOwner(t));

console.log(`Device-derived scope: enrolled=${scope.enrolled.size} unenrolled=${scope.unenrolled.size} fileOwners=${scope.fileOwners.size}`);
console.log(`revoked (unenrolled-only, minus enrolled, minus Tron) = ${scope.revoked.length}`);

const fails: string[] = [];
if (scope.revoked.length !== EXPECTED_REVOKED_COUNT) fails.push(`|revoked|=${scope.revoked.length}, expected ${EXPECTED_REVOKED_COUNT}`);
if (interEnrolled.length) fails.push(`revoked ∩ enrolled = ${interEnrolled.length} (must be 0)`);
if (interFile.length) fails.push(`revoked ∩ File-owners = ${interFile.length} (must be 0)`);
if (interOwner.length) fails.push(`revoked ∩ Tron(owner) = ${interOwner.length} (must be 0)`);
if (revoked.size !== scope.revoked.length) fails.push(`duplicate tokens in revoked list`);

if (fails.length) {
  console.error('✗ REFUSING TO WRITE — safety invariants failed:');
  for (const f of fails) console.error('  - ' + f);
  process.exit(1);
}
console.log('✓ invariants hold: |revoked|==116, disjoint from enrolled-79 / Tron / File-owners.');

if (!write) {
  console.log('DRY-RUN (no --write) — file NOT written. Re-run with --write to materialize revoked-token-hashes.json (tracked).');
  process.exit(0);
}
const hashes = scope.revoked.map(hashToken).sort(); // SALTED HASHES only — never the raw tokens
fs.writeFileSync(OUT, JSON.stringify({
  note: 'R40.22 step-3 auth-invalidation — SALTED SHA-256 hashes of the 116 dormant dev/test raw-only Device tokens (NOT raw tokens; safe to track). Reversible: remove an entry to accept that token again.',
  salt: 'rb-revoked-token-v1 (domain separation, public; see revoked-tokens.ts)',
  count: hashes.length,
  revoked: hashes,
}, null, 2) + '\n');
console.log(`✓ wrote ${hashes.length} SALTED HASHES → ${path.relative(ROOT, OUT)} (tracked, deploy-durable)`);
