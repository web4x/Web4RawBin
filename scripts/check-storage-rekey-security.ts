/**
 * R40.22 storage re-key — SECURITY GATE (ci:gates:raw). Continuously re-verifies the load-bearing
 * properties so they cannot silently stop being true (the S23-audio anti-pattern: a one-time proof that
 * nobody re-runs rots). A future refactor that widens the READ type back to string, restores the ||token
 * fallback, or bypasses homePathFor MUST turn this RED — not merely contradict a test file nobody runs.
 *
 * Run: /opt/node22/bin/node --import tsx scripts/check-storage-rekey-security.ts   (exits 1 on any failure)
 *
 * Runtime-behavioral (tsx, works where vitest's native binding doesn't). Covers G1 (READ map-only →
 * storageId cannot authenticate) + G4 (no-home cannot resolve to a directory — homePathFor throws).
 * stub-must-fail: revert READ to `|| token`, or homePathFor to not-throw, and this gate goes RED.
 */
import { resolveHomeKey, homePathFor, type StorageMap } from '../src/ts/server/storage-id.js';

const fails: string[] = [];
const OWNER = 'owner-token-A', SID = 'storage-id-X', USERS = '/data/users';
const sm: StorageMap = { path: '/dev/null', map: { [OWNER]: SID } };

// G1 — READ is MAP-ONLY: a storageId (a map VALUE, never a KEY) must NOT resolve to any home.
if (resolveHomeKey(OWNER, { mint: false }, true, sm) !== SID) fails.push('G1: legit token must READ its own storageId');
if (resolveHomeKey(SID, { mint: false }, true, sm) !== null) fails.push('G1: ★ a storageId presented as a token must READ null (no home) — the ||token fallback is the exploit');
if (resolveHomeKey('never-seen', { mint: false }, true, sm) !== null) fails.push('G1: unknown token must READ null');
if (resolveHomeKey('x', { mint: false }, false, sm) !== 'x') fails.push('G1: INERT must return the token');

// G4 — no-home can NEVER resolve to a directory: homePathFor throws on null/empty/traversal.
const throws = (k: any): boolean => { try { homePathFor(USERS, k, 'rooms'); return false; } catch { return true; } };
if (!throws(null)) fails.push('G4: ★ homePathFor(null) must THROW (never resolve to the users root)');
if (!throws('')) fails.push('G4: ★ homePathFor("") must THROW (the falsy-path-joinable hole)');
if (!throws('../etc')) fails.push('G4: homePathFor(traversal) must THROW');
try { if (homePathFor(USERS, SID, 'rooms') !== `${USERS}/${SID}/rooms`) fails.push('G4: valid key must build the correct path'); } catch { fails.push('G4: valid key must NOT throw'); }

if (fails.length) {
  console.error('✗ check:storage-rekey-security FAILED — a security property regressed:');
  for (const f of fails) console.error('  - ' + f);
  process.exit(1);
}
console.log('✓ check:storage-rekey-security PASS — READ map-only (storageId=no-auth) + no-home cannot resolve to a directory.');
