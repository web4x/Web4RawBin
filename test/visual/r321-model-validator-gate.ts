// [test:uuid:28cac10f-09d3-4319-a4c5-7ce9339611ad] R32.1 MDA model-identity foundation — GREEN (3rd independent confirmation). Multi-impl: (1) validate(seed)==0 + (2) anti-green-wash planted M1->M3-skip CAUGHT (level-integrity, no collateral) -> Impl 4d0883ad ModelValidator.validate; (3) seed 0-churn idempotent (isolated worktree, 0 written) -> Impl f65c9b50 SeedMdaModel.seedModel. Structural (scenario-unit invariants, NO device). Measured differently than expert/architect tsx: real on-disk index + IN-MEMORY planted defect + isolated-worktree re-seed.
// R32.1 MDA model-identity foundation — INDEPENDENT structural gate (3rd confirmation; expert tsx + architect tsx + vitest CI
// already verified). Measured DIFFERENTLY: real on-disk ModelElement index + an IN-MEMORY planted defect + an isolated-worktree
// seed run. (1) validate(seed)==0 violations; (2) ANTI-GREEN-WASH: plant an M1 whose instanceOf skips M2 (→M3 direct) → the
// validator MUST return a level-integrity violation (a validator that greens a broken chain is worthless); (3) seed 0-churn
// (idempotent) — re-seed in an isolated git worktree writes 0 (zero shared-tree pollution).
import { ModelValidator } from '../../src/ts/scenario/ModelValidator.ts';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const REPO = '/var/dev/Workspaces/web4x/Web4RawBin';
const WT = '/tmp/claude-0/-var-dev-Workspaces-AI-Claude/dd6c6fae-b1a2-4ce7-8a87-6a8cac45eff4/scratchpad/r321-wt';
const NODE = '/root/.vscode-server/bin/903b1e9d8990623e3d7da1df3d33db3e42d80eda/node';
const sh = (c: string, cwd: string) => execSync(c, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

// build a duck-typed UnitIndex from the on-disk ModelElement units (read-only)
const files = sh(`grep -rl '"ior": *"ior:class:ModelElement"' scenario/`, REPO).trim().split('\n').filter(Boolean);
const units = files.map(f => JSON.parse(fs.readFileSync(path.join(REPO, f), 'utf8')));
const mkIndex = (arr: any[]) => ({ list: () => arr.map(u => u.model.uuid as string), get: (uuid: string) => arr.find(u => u.model.uuid === uuid) || null });
const V = new ModelValidator();

// (1) real seed validates clean
const v1 = V.validate(mkIndex(units) as any);
const validateClean = v1.length === 0;

// (2) anti-green-wash: plant an M1 that skips M2 (instanceOf → an M3 directly) → MUST be caught
const anM3 = units.find(u => u.model.metaLevel === 'M3');
const PLANT = 'planted-m1-skip-m2-0000000000000000';
const planted = { ior: 'ior:class:ModelElement', model: { uuid: PLANT, metaLevel: 'M1', kind: 'planted', name: 'PLANTED M1 skipping M2', instanceOf: [`ior:instance:${anM3.model.uuid}`], instances: [] }, ownerIor: null };
const vPlant = V.validate(mkIndex([...units, planted]) as any);
const plantedCaught = vPlant.some((x: any) => x.uuid === PLANT && x.assertion === 'level-integrity');
const cleanStillClean = !vPlant.some((x: any) => x.uuid !== PLANT); // the plant is the ONLY new violation (no collateral false-positives)

// (3) seed 0-churn in an isolated worktree (zero shared-tree pollution)
let seedChurn = -1;
try { sh(`git worktree remove --force ${WT}`, REPO); } catch { /* none */ }
try { fs.rmSync(WT, { recursive: true, force: true }); } catch { /* none */ }
sh(`git worktree add --detach ${WT} HEAD`, REPO);
try {
  const out = sh(`${NODE} scripts/seed-mda-model.mjs`, WT);
  seedChurn = parseInt((out.match(/(\d+) written\/changed/) || [])[1] ?? '-1', 10);
} finally { try { sh(`git worktree remove --force ${WT}`, REPO); } catch { /* */ } }
const seedZeroChurn = seedChurn === 0;

console.log(`(1) validate(seed)==0: ${validateClean} (${v1.length} violations, ${units.length} ModelElements)`);
console.log(`(2) planted M1→M3-skip CAUGHT: ${plantedCaught} (level-integrity on the plant) | no-collateral: ${cleanStillClean}`);
console.log(`(3) seed 0-churn (isolated worktree re-seed): ${seedZeroChurn} (${seedChurn} written/changed)`);
const green = validateClean && plantedCaught && cleanStillClean && seedZeroChurn;
console.log('\n===== R32.1 model-validator foundation =====');
console.log('OVERALL:', green ? 'GREEN — validator clean on seed, CATCHES planted broken chain, seed idempotent' : 'RED');
process.exitCode = green ? 0 : 1;
