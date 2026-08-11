/**
 * R40.22 step-3 — CI SAFETY GATE for the revoked-token kill. Recomputes the revoked set from the
 * ior:class:Device units (single-source computeRevocationScope) and asserts the safety invariants that
 * make the kill safe. If a data/revoked-tokens.json is materialized, asserts it EQUALS the derivation
 * (no drift between the frozen list and the current units).
 *
 * Run: /opt/node22/bin/node --import tsx scripts/check-revoked-tokens.ts   (exits 1 on any failure)
 *
 * INVARIANTS (design-pii-containment-by-construction.md §step-3):
 *   |revoked| == 116 ; revoked ∩ enrolled-79 == 0 ; revoked ∩ Tron == 0 ; revoked ∩ File-owners == 0.
 * Over-revoking is the lockout risk → any drift is RED, not a warning.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ScenarioIndex } from '../src/ts/scenario/index.js';
import { ServerManagerGuard } from '../src/ts/server/ServerManagerGuard.js';
import { computeRevocationScope, loadRevokedTokens, EXPECTED_REVOKED_COUNT } from '../src/ts/server/revoked-tokens.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LIST = path.join(ROOT, 'data', 'revoked-tokens.json');
const idx = new ScenarioIndex(path.join(ROOT, 'scenario/index'));
const isOwner = (t: string) => ServerManagerGuard.isOwner(t);
const scope = computeRevocationScope(idx, isOwner);
const revoked = scope.revoked;

const fails: string[] = [];
if (revoked.length !== EXPECTED_REVOKED_COUNT) fails.push(`|revoked| = ${revoked.length}, expected ${EXPECTED_REVOKED_COUNT}`);
if (revoked.some(t => scope.enrolled.has(t))) fails.push(`revoked ∩ enrolled-79 != 0`);
if (revoked.some(t => scope.fileOwners.has(t))) fails.push(`revoked ∩ File-owners != 0`);
if (revoked.some(t => isOwner(t))) fails.push(`revoked ∩ Tron(owner) != 0`);
if (new Set(revoked).size !== revoked.length) fails.push(`duplicate tokens in revoked set`);

// If the frozen list is materialized, it must match the current derivation exactly (no drift).
if (fs.existsSync(LIST)) {
  const frozen = loadRevokedTokens(LIST);
  const derived = new Set(revoked);
  const missing = revoked.filter(t => !frozen.has(t));
  const extra = [...frozen].filter(t => !derived.has(t));
  if (missing.length || extra.length) fails.push(`frozen list drifted from derivation: ${missing.length} missing, ${extra.length} extra`);
  console.log(`frozen list present: ${frozen.size} tokens (drift: ${missing.length} missing / ${extra.length} extra)`);
} else {
  console.log('frozen list not materialized (data/revoked-tokens.json absent) — server fail-open, kill not yet armed.');
}

console.log(`derived: enrolled=${scope.enrolled.size} unenrolled=${scope.unenrolled.size} revoked=${revoked.length} fileOwners=${scope.fileOwners.size}`);
if (fails.length) {
  console.error('✗ check:revoked-tokens FAILED:');
  for (const f of fails) console.error('  - ' + f);
  process.exit(1);
}
console.log('✓ check:revoked-tokens PASS — |revoked|==116, disjoint from enrolled-79 / Tron / File-owners.');
