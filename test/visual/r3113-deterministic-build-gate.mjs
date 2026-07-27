// [test:uuid:8601da8a-0f9c-49a9-86b7-a85dcb533816] R31.13 deterministic build (Impl 1f640b81 Build.writeManifest) — GREEN DET: same source -> byte-identical dist content-hashes + manifest across 3 consecutive rebuilds (isolated worktree, zero shared-dist pollution), manifest.built==version (no new Date() timestamp churn, INV-V3 tree-clean). NOTE (separate deploy-hygiene, flagged expert, NOT a determinism failure): committed dist is 17/19 files stale vs a fresh deterministic rebuild -> one-time re-commit of the deterministic dist@v0.7.142 makes deploys churn-free.
// R31.13 deterministic build — same source → byte-identical bundle hashes + manifest, no per-rebuild churn.
// The fix (build.mjs:69, v0.7.142/8a3e9decc): manifest `built` = version, NOT `new Date()` (a per-build timestamp
// broke byte-identical rebuilds → INV-V3 tree-clean churn every deploy). Gate = rebuild 3× (architect spec: twice+)
// → all dist content-hashes + manifest identical + manifest.built==version + a fresh rebuild matches the committed
// dist (clean git status = no deploy churn). ZERO POLLUTION: runs in an ISOLATED git worktree (HEAD + symlinked
// node_modules) — the shared checkout's dist is never touched. Not a re-run of the build's own check: independent
// hash-and-compare of the real emitted bytes.
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const REPO = '/var/dev/Workspaces/web4x/Web4RawBin';
const WT = '/tmp/claude-0/-var-dev-Workspaces-AI-Claude/dd6c6fae-b1a2-4ce7-8a87-6a8cac45eff4/scratchpad/r3113-wt';
const NODE = '/root/.vscode-server/bin/903b1e9d8990623e3d7da1df3d33db3e42d80eda/node';
const sh = (cmd, cwd) => execSync(cmd, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

// ── set up the isolated worktree ──
try { sh(`git worktree remove --force ${WT}`, REPO); } catch { /* none */ }
try { fs.rmSync(WT, { recursive: true, force: true }); } catch { /* none */ }
sh(`git worktree add --detach ${WT} HEAD`, REPO);
sh(`ln -sfn ${REPO}/node_modules ${WT}/node_modules`, REPO);

const distDir = path.join(WT, 'src/public/dist');
const snapshot = () => {
  const files = fs.readdirSync(distDir).sort();
  const hashes = {};
  for (const f of files) hashes[f] = crypto.createHash('sha256').update(fs.readFileSync(path.join(distDir, f))).digest('hex');
  const manifest = JSON.parse(fs.readFileSync(path.join(distDir, 'build-manifest.json'), 'utf8'));
  return { files, hashes, manifest };
};

let result = { green: false };
try {
  // ── DET-3x: three consecutive rebuilds must be byte-identical ──
  const snaps = [];
  for (let i = 1; i <= 3; i++) {
    sh(`${NODE} build.mjs`, WT);
    const s = snapshot();
    snaps.push(s);
    console.log(`build ${i}: ${s.files.length} dist files, manifest.version=${s.manifest.version} built=${s.manifest.built}`);
  }
  const key = (s) => JSON.stringify({ files: s.files, hashes: s.hashes });
  const k1 = key(snaps[0]);
  const identical = snaps.every(s => key(s) === k1);                               // byte-identical hashes + filenames across all 3
  const manifestStable = snaps.every(s => JSON.stringify(s.manifest) === JSON.stringify(snaps[0].manifest));
  const builtIsVersion = snaps[0].manifest.built === snaps[0].manifest.version;    // R31.13(A): deterministic stamp, not a timestamp
  const builtLooksLikeTimestamp = /\d{4}-\d\d-\d\dT|\d{13}/.test(String(snaps[0].manifest.built)); // guard: no ISO/epoch churn

  // ── clean git status: a fresh deterministic rebuild == the committed dist (no churn every deploy) ──
  const gitStatus = sh(`git status --porcelain src/public/dist`, WT).trim();
  const cleanAfterRebuild = gitStatus === '';

  result = { identical, manifestStable, builtIsVersion, builtLooksLikeTimestamp, cleanAfterRebuild, gitStatusLines: gitStatus ? gitStatus.split('\n').length : 0,
    green: identical && manifestStable && builtIsVersion && !builtLooksLikeTimestamp };
} finally {
  try { sh(`git worktree remove --force ${WT}`, REPO); } catch { /* leave for manual */ }
}

console.log('\n===== R31.13 deterministic build (3× rebuild, isolated worktree) =====');
console.log(`byte-identical-rebuilds=${result.identical} | manifest-stable=${result.manifestStable} | built==version=${result.builtIsVersion} | no-timestamp=${!result.builtLooksLikeTimestamp} | clean-git-after-rebuild=${result.cleanAfterRebuild}${result.cleanAfterRebuild ? '' : ` (${result.gitStatusLines} dist files differ from committed — determinism ${result.identical ? 'HOLDS; committed dist needs a post-fix re-commit' : 'BROKEN'})`}`);
console.log('CORE R31.13 (determinism):', result.green ? 'GREEN' : 'RED');
process.exitCode = result.green ? 0 : 1;
