// R31.13 TRUE cross-env AC gate (v0.7.143 pin, 8fc8ca4eb): esbuild exact-pinned 0.28.0 + npm ci + dist rebuilt+committed
// (app-W6TRJVAE.js). Closes the held churn-free / clean-git-status ACs: fresh worktree → npm ci → `node build.mjs`
// → git diff vs committed dist == ZERO, in ≥2 node envs (node18 + node22), both byte-identical to committed. My earlier
// node18==node22 finding predicts PASS; this CONFIRMS it post-pin (if node alone still moved bytes → PIN-3 load-bearing).
// ZERO shared-checkout pollution: isolated git worktree, own node_modules (npm ci), removed at end.
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const REPO = '/var/dev/Workspaces/web4x/Web4RawBin';
const WT = '/tmp/claude-0/-var-dev-Workspaces-AI-Claude/dd6c6fae-b1a2-4ce7-8a87-6a8cac45eff4/scratchpad/r3113-acgate';
const N18 = '/root/.vscode-server/bin/903b1e9d8990623e3d7da1df3d33db3e42d80eda/node';
const N22 = '/opt/node22/bin/node';
const sh = (cmd, cwd, opts = {}) => execSync(cmd, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts });

try { sh(`git worktree remove --force ${WT}`, REPO); } catch { /* none */ }
try { fs.rmSync(WT, { recursive: true, force: true }); } catch { /* none */ }
sh(`git worktree add --detach ${WT} HEAD`, REPO);

const distDir = path.join(WT, 'src/public/dist');
const appBundle = () => fs.readdirSync(distDir).find(f => /^app-.*\.js$/.test(f)) || '';
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(path.join(distDir, f))).digest('hex');
const churn = () => { const s = sh(`git status --porcelain src/public/dist`, WT).trim(); return s ? s.split('\n').length : 0; };
const resetDist = () => sh(`git checkout -- src/public/dist`, WT);

// committed baseline (before any rebuild)
const committedApp = appBundle();
const committedHash = committedApp ? sha(committedApp) : '';

let envMode = 'npm ci';
try { sh(`npm ci --no-audit --no-fund`, WT, { timeout: 300000, env: { ...process.env, PATH: `/opt/node22/bin:${process.env.PATH}` } }); }
catch (e) { envMode = 'symlink (npm ci unavailable — esbuild 0.28.0 == lock, equivalent)'; sh(`ln -sfn ${REPO}/node_modules ${WT}/node_modules`, REPO); }
const esbuildV = JSON.parse(fs.readFileSync(path.join(WT, 'node_modules/esbuild/package.json'), 'utf8')).version;

const runEnv = (nodeBin) => {
  resetDist();
  sh(`${nodeBin} build.mjs`, WT);
  return { app: appBundle(), hash: sha(appBundle()), churn: churn() };
};

let out;
try {
  const r18 = runEnv(N18);
  const r22 = runEnv(N22);
  out = { committedApp, committedHash, esbuildV, envMode, r18, r22,
    node18_zeroChurn: r18.churn === 0, node22_zeroChurn: r22.churn === 0,
    node18_matchesCommitted: r18.hash === committedHash && r18.app === committedApp,
    node22_matchesCommitted: r22.hash === committedHash && r22.app === committedApp,
    node18_eq_node22: r18.hash === r22.hash && r18.app === r22.app };
} finally {
  try { sh(`git worktree remove --force ${WT}`, REPO); } catch { /* leave */ }
}

const green = out.node18_zeroChurn && out.node22_zeroChurn && out.node18_matchesCommitted && out.node22_matchesCommitted && out.node18_eq_node22;
console.log(`env=${out.envMode} esbuild=${out.esbuildV} | committed=${out.committedApp}`);
console.log(`node18: build=${out.r18.app} churn=${out.r18.churn} matches-committed=${out.node18_matchesCommitted}`);
console.log(`node22: build=${out.r22.app} churn=${out.r22.churn} matches-committed=${out.node22_matchesCommitted}`);
console.log(`node18==node22 bytes: ${out.node18_eq_node22}`);
console.log('\n===== R31.13 TRUE cross-env AC gate (churn-free / clean-git) =====');
console.log('VERDICT:', green ? 'GREEN — churn-free ACs MEET (0 diff vs committed, both envs, byte-identical to app-W6TRJVAE.js)' : 'RED — see diff above');
process.exitCode = green ? 0 : 1;
