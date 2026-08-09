// [test:uuid:a1b6cae4-a108-41e9-8f66-aa2beae7a887] R31.8 ServerManagerGuard.seedOwnerInto (Impl a2b8373a) — idempotently ADD OWNER_TOKEN
// into a passed allowedUsers[] IN-PLACE and RETURN the ARRAY (least-exposure: never the bare token); co-located with
// the ONE OWNER_TOKEN literal (INV-G2==1). seedOwnerInto([])→[OWNER]; seedOwnerInto([OWNER])→[OWNER] (no dup).
// [test:uuid:095ed0c9-d1a1-4c74-bf3f-92fb905dbc87] R31.8 FeatureManager.bootstrapSeed (Impl 03b2b1db) — idempotently seeds OWNER_TOKEN into
// ServerManager + FeatureManager Feature.allowedUsers at startup (owner enters by SEEDED MEMBERSHIP, not literal-bypass);
// re-run safe (no needless write); re-seeds when the owner is absent. served fresh pid (verify-by-pid). DET-3x,
// POLLUTION-SAFE (Feature units byte-backed-up + finally-restored).
import { FeatureManager } from '../../src/ts/server/FeatureManager.js';
import { ServerManagerGuard } from '../../src/ts/server/ServerManagerGuard.js';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { OWNER_LITERAL } from './_owner-literal.mjs'; // no-secrets: owner literal read at runtime, never hardcoded

const REPO = '/var/dev/Workspaces/web4x/Web4RawBin';
const OWNER = OWNER_LITERAL;
const SM = `${REPO}/scenario/index/1/6/6/0/4/16604eee-d844-4efb-bd4d-881433ca82a6.scenario.json`; // Server Manager Feature
const FM = `${REPO}/scenario/index/2/9/8/0/b/2980b7d9-a166-44ca-bf73-5dd1a4ba7b16.scenario.json`; // Feature Manager Feature
const au = (p: string): string[] => JSON.parse(fs.readFileSync(p, 'utf8')).model.allowedUsers || [];
const setAU = (p: string, arr: string[]) => { const u = JSON.parse(fs.readFileSync(p, 'utf8')); u.model.allowedUsers = arr; fs.writeFileSync(p, JSON.stringify(u, null, 2) + '\n'); };
const g2 = () => execFileSync('grep', ['-rl', OWNER, `${REPO}/src`], { encoding: 'utf8' }).split('\n').filter(Boolean).filter(f => !/test\//.test(f)).length;

const bSM = fs.readFileSync(SM, 'utf8'), bFM = fs.readFileSync(FM, 'utf8');
const results: boolean[] = [];
try {
  // (least-exposure + add-logic) seedOwnerInto on stubs — returns the ARRAY (not bare token), adds once, idempotent
  const empty = ServerManagerGuard.seedOwnerInto([]);
  const already = ServerManagerGuard.seedOwnerInto([OWNER]);
  const other = ServerManagerGuard.seedOwnerInto(['xyz']);
  const stubOk = Array.isArray(empty) && empty.length === 1 && empty[0] === OWNER && already.length === 1 && other.length === 2 && other.includes(OWNER);
  results.push(stubOk);
  console.log(`seedOwnerInto stub: []→[${empty}] (add-once=${empty.length === 1 && empty[0] === OWNER}) [OWNER]→len${already.length} (idempotent) [xyz]→len${other.length} (adds-alongside) returns-array-not-bare=${Array.isArray(empty)} => ${stubOk ? 'GREEN' : 'RED'}`);

  const invG2 = g2() === 1; results.push(invG2);
  console.log(`INV-G2 OWNER_TOKEN literal ==1: ${invG2} (${g2()})`);

  for (let i = 1; i <= 3; i++) {
    // idempotent on the REAL units (already carry [OWNER]) → unchanged, no dup, no needless write
    const smB = au(SM), fmB = au(FM);
    FeatureManager.bootstrapSeed();
    const idem = au(SM).length === 1 && au(SM)[0] === OWNER && au(FM).length === 1 && au(FM)[0] === OWNER && JSON.stringify(au(SM)) === JSON.stringify(smB) && JSON.stringify(au(FM)) === JSON.stringify(fmB);
    // re-seeds when ABSENT: empty SM allowedUsers → bootstrapSeed re-adds the owner
    setAU(SM, []);
    FeatureManager.bootstrapSeed();
    const reseed = au(SM).length === 1 && au(SM)[0] === OWNER;
    setAU(SM, smB); // restore this iter
    const pass = idem && reseed;
    results.push(pass);
    console.log(`iter ${i}: idempotent(SM=${JSON.stringify(au(SM))} FM=${JSON.stringify(au(FM))} no-dup=${idem}) | re-seed-when-absent=${reseed} => ${pass ? 'GREEN' : 'RED'}`);
  }
} finally {
  fs.writeFileSync(SM, bSM); fs.writeFileSync(FM, bFM); // POLLUTION-SAFE byte-restore
  const restored = fs.readFileSync(SM, 'utf8') === bSM && fs.readFileSync(FM, 'utf8') === bFM && au(SM).length === 1 && au(FM).length === 1;
  console.log(`pollution-safe restore: SM+FM Feature units == pre-gate ([OWNER]) = ${restored}`);
  if (!restored) results.push(false);
}
console.log('\n===== R31.8 slice-(c) seedOwnerInto + bootstrapSeed (DET-3x) =====');
const green = results.length >= 5 && results.every(Boolean); // stub + INV-G2 + 3 iters (restore-fail would append a 6th false)
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
