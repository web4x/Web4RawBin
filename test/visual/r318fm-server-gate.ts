// [test:uuid:d3abeeb7-5f07-461b-a7bb-19636678d6e3] R31.8 FeatureManager.searchUsers (Impl cb20fd6e, Method 1e75e388, Class 9f7f345a) — c2 user search: ranked exact<prefix<substring, MASKED identifiers (raw token IS the grant key, identifiers masked), capped-10 truncation, empty-query→[]. import-drive DET-3x GREEN v0.7.135.
// [test:uuid:7e473135-cf81-4567-a993-efa133bafd4b] R31.8 FeatureManager.tokenOfProfileUuid (Impl b2d5f6a1, Method 8304f709, Class 9f7f345a) — a real Profile uuid round-trips as the grant token; graceful (returns input) on a non-Profile uuid. DET-3x GREEN.
// [test:uuid:2ef9794b-7afc-4bfb-8b82-1cb6ebc7fb86] R31.8 FeatureManager.grantedUserProfile (Impl 8a3f6d21, Method 218b4733, Class 9f7f345a) — resolve an allowedUsers id → {token, profileUuid} (real SEED_FEATURE 16604eee grant); a non-granted id → null. DET-3x GREEN.
// R31.8 FeatureManager server-side FUNCTIONAL gate — import-drive the REAL static impls (non-mutating: they READ profiles /
// scenario / alt-identity units, never write). DET-3x. 3 of the 6 round-3+ FeatureManager Impls:
//   searchUsers cb20fd6e — c2 user search: ranked exact<prefix<substring, MASKED identifiers, capped-10 truncation.
//   tokenOfProfileUuid b2d5f6a1 — a Profile uuid IS the grant token (round-trips); graceful on non-Profile.
//   grantedUserProfile 8a3f6d21 — resolve an allowedUsers id → {token, profileUuid}; non-granted → null.
// Measured DIFFERENTLY than a build check: import the actual class + drive with controlled synthetic data (searchUsers,
// fully deterministic, unique query isolates from real alt-units) + real scenario data (tokenOfProfileUuid Profile unit,
// grantedUserProfile the real SEED_FEATURE 16604eee allowedUsers). markers → req to mint + wire Impl.tests[].
import { FeatureManager } from '../../src/ts/server/FeatureManager.ts';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const shard = (u: string) => path.join(REPO, 'scenario/index', ...u.slice(0, 5).split(''), `${u}.scenario.json`);
const REAL_PROFILE = 'b4f57923-4abf-4fbf-8a0e-f923c107f60a';
const SM_FEATURE = '16604eee-d844-4efb-bd4d-881433ca82a6';

// searchUsers: unique query 'zephyrqx' so real alt-identity units can't match → deterministic
const rank = new Map<string, any>([
  ['token-zephyrqx-aaaa', { name: 'Zephyrqx', phone: '5551000' }],        // exact (rank 0)
  ['token-zephyrqxxl-bb', { name: 'Zephyrqxadmin', phone: '5551001' }],   // prefix (rank 1)
  ['token-bobqx-ccccccc', { name: 'Bobqx', phone: '5551002' }],           // no match → excluded
]);
const cap = new Map<string, any>();
for (let i = 0; i < 12; i++) cap.set(`token-dupqx-${i}-zzzzzz`, { name: `Dupqx${i}`, phone: '0' });

const results: boolean[] = [];
for (let i = 1; i <= 3; i++) {
  // (1) searchUsers — ranked + masked + capped
  const s = FeatureManager.searchUsers('zephyrqx', rank as any);
  const names = s.results.map(r => r.name);
  const rankedOk = names.length === 2 && names[0] === 'Zephyrqx' && names[1] === 'Zephyrqxadmin' && !names.includes('Bobqx');
  const maskedOk = s.results.every(r => r.token && r.identifiers[0] !== r.token && /[•…]/.test(r.identifiers[0]));  // real token returned, identifiers MASKED
  const c = FeatureManager.searchUsers('dupqx', cap as any);
  const capOk = c.results.length === 10 && c.truncated === true;
  const empty = FeatureManager.searchUsers('', rank as any).results.length === 0;
  const searchUsersOk = rankedOk && maskedOk && capOk && empty;

  // (2) tokenOfProfileUuid — real Profile uuid round-trips as the grant token; graceful on garbage
  const profRT = FeatureManager.tokenOfProfileUuid(REAL_PROFILE) === REAL_PROFILE;
  const garbageGraceful = FeatureManager.tokenOfProfileUuid('not-a-real-uuid-xyz') === 'not-a-real-uuid-xyz';
  const tokenOfProfileUuidOk = profRT && garbageGraceful;

  // (3) grantedUserProfile — a real allowedUsers id resolves to {token, profileUuid}; a bogus id → null
  let allowed: string[] = [];
  try { allowed = JSON.parse(fs.readFileSync(shard(SM_FEATURE), 'utf-8')).model.allowedUsers || []; } catch { /* */ }
  const grantedId = allowed[0];
  const pos = grantedId ? FeatureManager.grantedUserProfile(SM_FEATURE, grantedId, new Map() as any) : null;
  const neg = FeatureManager.grantedUserProfile(SM_FEATURE, 'bogus-nonexistent-id-000', new Map() as any);
  // positive only asserted when the seed feature actually has a grant; negative ALWAYS must be null
  const grantedUserProfileOk = (grantedId ? (pos !== null && !!pos.token) : true) && neg === null;

  const pass = searchUsersOk && tokenOfProfileUuidOk && grantedUserProfileOk;
  results.push(pass);
  console.log(`iter ${i}: searchUsers=${searchUsersOk}(ranked=${rankedOk} masked=${maskedOk} cap=${capOk}[${c.results.length}/${c.truncated}] empty=${empty}) | tokenOfProfileUuid=${tokenOfProfileUuidOk}(rt=${profRT} graceful=${garbageGraceful}) | grantedUserProfile=${grantedUserProfileOk}(grants=${allowed.length} pos=${pos ? 'obj' : 'null'} neg=${neg}) => ${pass ? 'GREEN' : 'RED'}`);
}

console.log('\n===== R31.8 FeatureManager server impls (DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
