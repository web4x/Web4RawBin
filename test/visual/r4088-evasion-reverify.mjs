// [test:uuid:7a7c1365-3ecf-4e7c-81e9-2c0e0ce61b94] R40.88 no-mkdir-for-a-model-folder guard (Impl = scripts/check-no-mkdir-for-a-model-folder.ts) —
// the tester-owned INDEPENDENT adversarial Test: plants own seeds into the guard's REAL repo-scan (not its self-bite) and certifies
// e3 self-attest-comment CAUGHT · e2 discriminator CAUGHT · e4 recursive:true idiomatic CAUGHT · e1 aliased-mkdir honest residual ·
// control raw-mkdir CAUGHT · baseline 0-noise on legit recursive:true outside the shard-store path.
// R40.88 STANDING EVASION RE-VERIFY — the guard's own self-bite is necessary but INSUFFICIENT (a self-bite can be gamed
// alongside the guard). This attacks the HARDENED guard (scripts/check-no-mkdir-for-a-model-folder.ts) with an INDEPENDENT
// tester's OWN seeds, planted into the guard's REAL src/ts repo-scan and run through the ACTUAL guard binary — the way the PO
// certified R40.88: "plant YOUR OWN seeds into the guard's REAL repo-scan, not its built-in self-bite." Every future guard
// should be attacked the same way by default, so this lives in the repo, not in a session scratchpad.
//
// PASS criteria (the certified invariant):
//   e3  self-attested `// physicality-gated` comment           → MUST be CAUGHT (comment does not suppress; architect GATE list only)
//   e2  no-op `resolveFolderRefToDir()` discriminator in scope → MUST be CAUGHT (a discriminator does not gate)
//   e1  aliased mkdir (`const mk = fsSync.mkdirSync; mk(t)`)     → MUST NOT be caught = the HONEST accepted residual (matches header)
//   control  raw non-owner `mkdirSync(t)` (no recursive)        → MUST be CAUGHT (proves the hazard side is not inert)
//   e4  idiomatic `mkdirSync(userDir, { recursive: true })`     → MUST be CAUGHT (architect 3f9a2d309 scoped SHARD_EXCLUDE to the
//       shard-store path; recursive:true is the commonest mkdir form so a global exclusion defeats the guard — now closed).
// Run: node test/visual/r4088-evasion-reverify.mjs   (exit 0 = certified; exit 1 = a certified invariant regressed)
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const GUARD = 'scripts/check-no-mkdir-for-a-model-folder.ts';
const SEEDDIR = path.join(REPO, 'src/ts');
const NODE22 = '/opt/node22/bin/node';
const SEED_RE = /^_r4088_.*_mine\.ts$/; // every seed file this harness ever plants matches this — used for the pre-run sweep

// PRE-RUN SWEEP (test-fixture-cleanup discipline): remove any seed a prior crashed run left behind, so we never scan a stale seed.
for (const n of fs.readdirSync(SEEDDIR)) { if (SEED_RE.test(n)) { try { fs.unlinkSync(path.join(SEEDDIR, n)); console.log('pre-sweep removed stale seed:', n); } catch {} } }

const runGuard = () => { try { execSync(`${NODE22} --import tsx ${GUARD}`, { cwd: REPO, stdio: 'pipe', timeout: 60000 }); return true; } catch { return false; } };
const plantRunClean = (file, src) => { const p = path.join(SEEDDIR, file); try { fs.writeFileSync(p, src); return !runGuard(); /* caught = guard RED */ } finally { try { fs.unlinkSync(p); } catch {} } };

const SEEDS = [
  { key: 'e3-selfattest-comment', expectCaught: true,  file: '_r4088_e3_mine.ts',
    src: `// physicality-gated: self-attested, must NOT suppress\nexport function planted(p: string) { return FolderService.createPhysicalWithUnit({ parent: p, name: 'x' }); }\n` },
  { key: 'e2-discriminator',      expectCaught: true,  file: '_r4088_e2_mine.ts',
    src: `export function planted(parent: string) { const _d = resolveFolderRefToDir(parent); return FolderService.createPhysicalFolder({ parent, name: 'x' }); }\n` },
  { key: 'e1-aliased-mkdir',      expectCaught: false, file: '_r4088_e1_mine.ts', // honest accepted residual
    src: `import fsSync from 'node:fs';\nexport function planted(t: string) { const mk = fsSync.mkdirSync; mk(t); }\n` },
  { key: 'control-raw-mkdir',     expectCaught: true,  file: '_r4088_ctl_mine.ts', // hazard side must be LIVE (no recursive:true)
    src: `import fsSync from 'node:fs';\nexport function planted(t: string) { fsSync.mkdirSync(t); }\n` },
  { key: 'e4-recursive-idiomatic', expectCaught: true, file: '_r4088_e4_mine.ts', // CLOSED by architect 3f9a2d309 (SHARD_EXCLUDE scoped to the shard-store path); recursive:true is the commonest form → must be caught outside that path
    src: `import fsSync from 'node:fs';\nexport function planted(t: string) { fsSync.mkdirSync(t + '/userfolder', { recursive: true }); }\n` },
];

const baseline = runGuard();
console.log(`BASELINE (no seed): ${baseline ? 'GREEN' : 'RED'}`);
const results = SEEDS.map((s) => { const caught = plantRunClean(s.file, s.src); const pass = caught === s.expectCaught; console.log(`  ${s.key.padEnd(24)} expect-caught=${String(s.expectCaught).padEnd(5)} caught=${String(caught).padEnd(5)} => ${pass ? 'PASS' : 'FAIL'}`); return pass; });

const leftover = fs.readdirSync(SEEDDIR).filter((n) => SEED_RE.test(n));
const restGreen = runGuard();
console.log(`\ncleanup: leftover-seeds=${JSON.stringify(leftover)}  guard-green-after=${restGreen}`);
const certified = baseline && results.every(Boolean) && leftover.length === 0 && restGreen;
console.log(`\n===== R40.88 EVASION RE-VERIFY: ${certified ? 'CERTIFIED (e2/e3/e4 closed, e1 residual honest, hazard live, clean)' : 'REGRESSED'} =====`);
process.exit(certified ? 0 : 1);
