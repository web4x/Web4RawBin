/**
 * R40.22 step-3 — CI SAFETY GATE for the revoked-token kill (BLOCKING; wired into ci:gates:raw).
 * Recomputes the revoked set from the ior:class:Device units (single-source computeRevocationScope) and
 * asserts the safety invariants that make the kill safe, then checks the TRACKED salted-hash list against
 * the derivation, plus allowlist hygiene for the credential-guard exemption.
 *
 * Run: /opt/node22/bin/node --import tsx scripts/check-revoked-tokens.ts   (exits 1 on any failure)
 *
 * INVARIANTS (design-pii-containment-by-construction.md §step-3; architect f1ab00e21 / PO):
 *   (derivation)  |revoked| == 116 ; revoked ∩ enrolled-79 == 0 ; ∩ Tron == 0 ; ∩ File-owners == 0
 *   (A hash list) the tracked list = SALTED HASHES only (64-hex, NEVER a raw uuid token); == the derivation
 *   (C allowlist) the credential-guard exemption is EXPLICIT+NAMED and a BITE FAILS if it GROWS
 *   (armed)       REVOKED_ARMED ⇒ the tracked list MUST exist at exactly EXPECTED (arm+list land together)
 * Over-revoking is the lockout risk → any drift is RED, not a warning.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ScenarioIndex } from '../src/ts/scenario/index.js';
import { ServerManagerGuard } from '../src/ts/server/ServerManagerGuard.js';
import { computeRevocationScope, EXPECTED_REVOKED_COUNT, REVOKED_ARMED, hashToken, REVOKED_LIST_PATH } from '../src/ts/server/revoked-tokens.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HASH_LIST = REVOKED_LIST_PATH; // R40.22 path-unify (a): the ONE source, shared with the runtime — no divergence possible

// (C) ALLOWLIST HYGIENE — the ONE tracked file permitted to hold token-DERIVED (hashed) data. The
// trace-pii-guard credential sweep is report-only and scenario-scoped (scans scenario/**/*.scenario.json),
// so it never sees this repo-root file; the enforcement lives HERE, in the blocking gate. This allowlist
// is EXPLICIT + NAMED, and the BITE below FAILS if it GROWS — an exemption that can quietly gain entries
// is a credential-tracking bypass, and this sits inside the very guard that stops us re-committing tokens.
const CREDENTIAL_TRACK_EXEMPTION = ['revoked-token-hashes.json'] as const;
const EXEMPTION_BITE_MAX = 1; // grow this ONLY with an explicit review + a matching design ruling.

const idx = new ScenarioIndex(path.join(ROOT, 'scenario/index'));
const isOwner = (t: string) => ServerManagerGuard.isOwner(t);
const scope = computeRevocationScope(idx, isOwner);
const revoked = scope.revoked;

const fails: string[] = [];
// (derivation)
if (revoked.length !== EXPECTED_REVOKED_COUNT) fails.push(`|revoked| = ${revoked.length}, expected ${EXPECTED_REVOKED_COUNT}`);
if (revoked.some(t => scope.enrolled.has(t))) fails.push(`revoked ∩ enrolled-79 != 0`);
if (revoked.some(t => scope.fileOwners.has(t))) fails.push(`revoked ∩ File-owners != 0`);
if (revoked.some(t => isOwner(t))) fails.push(`revoked ∩ Tron(owner) != 0`);
if (new Set(revoked).size !== revoked.length) fails.push(`duplicate tokens in revoked set`);

// (C) BITE — the exemption allowlist must not silently grow.
if (CREDENTIAL_TRACK_EXEMPTION.length > EXEMPTION_BITE_MAX) {
  fails.push(`credential-track exemption GREW to ${CREDENTIAL_TRACK_EXEMPTION.length} (max ${EXEMPTION_BITE_MAX}) — a tracked-credential bypass; review required`);
}

const listExists = fs.existsSync(HASH_LIST);
if (listExists) {
  let entries: string[] = [];
  try {
    const raw = JSON.parse(fs.readFileSync(HASH_LIST, 'utf-8'));
    entries = (Array.isArray(raw) ? raw : (raw && Array.isArray(raw.revoked) ? raw.revoked : [])).filter((x: unknown): x is string => typeof x === 'string');
  } catch { fails.push(`hash list unparseable`); }
  // (A) POSITIVE credential guard: the tracked list must be SALTED HASHES only — no raw uuid tokens leaked in.
  const notHash = entries.filter(h => !/^[0-9a-f]{64}$/.test(h));
  const tokenShaped = entries.filter(h => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(h));
  if (notHash.length) fails.push(`hash list has ${notHash.length} entr(ies) that are not 64-hex SHA-256`);
  if (tokenShaped.length) fails.push(`hash list has ${tokenShaped.length} RAW-TOKEN-shaped entr(ies) — must be hashed, NEVER raw`);
  // list must equal the derivation (hash each derived token; compare sets — no drift).
  const derivedHashes = new Set(revoked.map(hashToken));
  const frozen = new Set(entries);
  const missing = [...derivedHashes].filter(h => !frozen.has(h)).length;
  const extra = [...frozen].filter(h => !derivedHashes.has(h)).length;
  if (missing || extra) fails.push(`tracked hash list drifted from derivation: ${missing} missing, ${extra} extra`);
  console.log(`tracked hash list: ${entries.length} hashes (drift: ${missing} missing / ${extra} extra)`);
} else {
  console.log('tracked hash list absent (revoked-token-hashes.json) — server fail-open, kill not yet armed.');
}

// (armed) arming and the list must land atomically — REVOKED_ARMED true without a full list is the
// "looks armed while accepting whatever fell out" failure.
if (REVOKED_ARMED && (!listExists)) fails.push(`REVOKED_ARMED=true but revoked-token-hashes.json is ABSENT`);

console.log(`derived: enrolled=${scope.enrolled.size} unenrolled=${scope.unenrolled.size} revoked=${revoked.length} fileOwners=${scope.fileOwners.size} | armed=${REVOKED_ARMED}`);
if (fails.length) {
  console.error('✗ check:revoked-tokens FAILED:');
  for (const f of fails) console.error('  - ' + f);
  process.exit(1);
}
console.log('✓ check:revoked-tokens PASS — 116 disjoint; hash list all-hashes & matches derivation; exemption allowlist within bite.');
