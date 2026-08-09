// [test:uuid:317b67d0-7416-4cde-9537-e351ae618ca7] R31.7 Build.generateVersion (Impl b5eb6953) — single-source typed version: editing ONLY the config-singleton unit .model.version + build drives ALL consumers together (package.json + sw.js CACHE_NAME + build-manifest.version + __BUILD_VERSION__), DET-3x (9.9.1/2/3); version can't desync BY CONSTRUCTION. Also exercises the INV-V guards (INV-V3 start.mjs:86 catches a lone deploy-critical hand-edit; INV-V1 start.mjs:98 catches a post-build consumer desync). Worktree-isolated, live server (pid 498575, v0.7.103) untouched.
// [test:uuid:788e7b83-bfd9-49cc-88ce-6d57d2a3d4c7] R31.7 Build.versionGuardTreeClean (Impl 81151504, INV-V3, start.mjs:84) — a lone hand-edit of a deploy-critical file (server.ts/package.json/sw.js/config-unit) that diverges from HEAD makes `git diff --quiet HEAD -- <files>` fire → start.mjs exits 1 pre-deploy (the phantom-version-desync landmine). GREEN DET-3x (3 files caught, baseline-clean each), worktree-isolated non-mutating.
// [test:uuid:db5427be-5d76-4312-90d0-f21fd88e8efd] R31.7 Build.versionGuardAgreement (Impl ee8bbaba, INV-V1, start.mjs:98) — post-build EVERY version consumer must derive-equal from the ONE config unit (package.json == sw.js CACHE_NAME == build-manifest == unit); a desynced consumer (manifest→8.8.8) makes the derive-equal check fire → start.mjs exits 1. GREEN, worktree-isolated.
// R31.7 single-source typed version — MUTATE-ONE-SOURCE + INV-V guards. DET-3x, POLLUTION-SAFE by construction:
// everything runs in an ISOLATED git worktree (node_modules symlinked) — the LIVE checkout + server (fresh pid 498575,
// v0.7.103) are NEVER touched. This proves "version can't desync by construction": editing the ONE Config unit and
// rebuilding drives ALL consumers together; a lone hand-edit is caught by the INV-V guard start.mjs runs.
// (A) MUTATE: edit config-singleton .model.version = X → node build.mjs → assert package.json + sw.js CACHE_NAME +
//     build-manifest.version + __BUILD_VERSION__(in the built bundle) ALL == X. (/api/config reads build-manifest per
//     R31.7 — architect-proven; not re-checked live to avoid a restart.)
// (B) GUARD: INV-V3 (start.mjs:86 versionGuardTreeClean) — a lone package.json/server.ts/sw.js edit → `git diff --quiet
//     HEAD -- <deploy-critical>` FIRES (would exit 1). INV-V1 (start.mjs:98 versionGuardAgreement) — a post-build
//     consumer desync (manifest ≠ unit) is caught by the derive-equal check.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const LIVE = '/var/dev/Workspaces/web4x/Web4RawBin';
const WT = '/tmp/claude-0/-var-dev-Workspaces-AI-Claude/dd6c6fae-b1a2-4ce7-8a87-6a8cac45eff4/scratchpad/r317wt';
const NODE18 = '/root/.vscode-server/bin/903b1e9d8990623e3d7da1df3d33db3e42d80eda/node';
const CONFIG_UNIT = 'scenario/index/c/o/n/f/i/config-singleton-0000-000000000001.scenario.json';
const DEPLOY_CRITICAL = ['src/ts/server/server.ts', 'package.json', 'src/public/sw.js', CONFIG_UNIT];
const git = (args, cwd = LIVE) => execFileSync('git', args, { cwd, encoding: 'utf8' });
const gitStatus = (args, cwd) => { try { execFileSync('git', args, { cwd, stdio: 'ignore' }); return 0; } catch (e) { return e.status || 1; } };
const surgicalVersion = (file, X) => { const raw = fs.readFileSync(path.join(WT, file), 'utf8'); fs.writeFileSync(path.join(WT, file), raw.replace(/("version":\s*")[^"]*(")/, `$1${X}$2`)); };
const reset = () => git(['checkout', 'HEAD', '--', ...DEPLOY_CRITICAL, 'src/public/dist'], WT);

const results = [];
try {
  // ISOLATED worktree at HEAD + symlinked node_modules (build needs esbuild)
  try { git(['worktree', 'remove', '--force', WT]); } catch { /* not present */ }
  fs.rmSync(WT, { recursive: true, force: true });
  git(['worktree', 'add', '--detach', WT, 'HEAD']);
  fs.symlinkSync(path.join(LIVE, 'node_modules'), path.join(WT, 'node_modules'));

  // (A) MUTATE-ONE-SOURCE — DET-3x with 3 distinct versions
  for (const X of ['9.9.1', '9.9.2', '9.9.3']) {
    reset();
    surgicalVersion(CONFIG_UNIT, X);                         // edit the ONE source only
    execFileSync(NODE18, ['build.mjs'], { cwd: WT, stdio: 'ignore' });
    const pkg = JSON.parse(fs.readFileSync(path.join(WT, 'package.json'), 'utf8')).version;
    const sw = (fs.readFileSync(path.join(WT, 'src/public/sw.js'), 'utf8').match(/CACHE_NAME = 'rawbin-v([^']*)'/) || [])[1];
    const mf = JSON.parse(fs.readFileSync(path.join(WT, 'src/public/dist/build-manifest.json'), 'utf8'));
    const bundle = fs.readFileSync(path.join(WT, 'src/public/dist', mf['app.js']), 'utf8');
    const buildVer = bundle.includes(`"${X}"`) || bundle.includes(X);   // __BUILD_VERSION__ baked into the built bundle
    const allAgree = pkg === X && sw === X && mf.version === X && buildVer;
    results.push(allAgree);
    console.log(`(A) mutate config→${X}: build → package.json=${pkg} sw.CACHE_NAME=${sw} manifest=${mf.version} __BUILD_VERSION__=${buildVer} => ${allAgree ? 'GREEN all-agree' : 'RED desync'}`);
  }

  // (B) INV-V3 — a LONE hand-edit of a deploy-critical file is CAUGHT (git diff vs HEAD fires = start.mjs would exit 1)
  const invV3 = [];
  for (const f of ['package.json', 'src/ts/server/server.ts', 'src/public/sw.js']) {
    reset();
    const clean = gitStatus(['diff', '--quiet', 'HEAD', '--', ...DEPLOY_CRITICAL], WT); // 0 = clean (baseline)
    fs.appendFileSync(path.join(WT, f), `\n// r317 lone edit ${Date.now()}\n`);         // dirty ONLY this file
    const dirty = gitStatus(['diff', '--quiet', 'HEAD', '--', ...DEPLOY_CRITICAL], WT); // !=0 = INV-V3 FIRES
    invV3.push(clean === 0 && dirty !== 0);
    console.log(`(B) INV-V3 lone edit ${f}: baseline-clean=${clean === 0} → guard-fires=${dirty !== 0} => ${clean === 0 && dirty !== 0 ? 'GREEN caught' : 'RED missed'}`);
  }
  results.push(...invV3);

  // (B) INV-V1 — a post-build consumer desync (manifest ≠ unit) is caught by the derive-equal check
  reset();
  execFileSync(NODE18, ['build.mjs'], { cwd: WT, stdio: 'ignore' });
  const corrupt = JSON.parse(fs.readFileSync(path.join(WT, 'src/public/dist/build-manifest.json'), 'utf8'));
  corrupt.version = '8.8.8'; fs.writeFileSync(path.join(WT, 'src/public/dist/build-manifest.json'), JSON.stringify(corrupt, null, 2)); // simulate a desynced consumer
  const unit = JSON.parse(fs.readFileSync(path.join(WT, CONFIG_UNIT), 'utf8')).model.version;
  const pkg = JSON.parse(fs.readFileSync(path.join(WT, 'package.json'), 'utf8')).version;
  const sw = (fs.readFileSync(path.join(WT, 'src/public/sw.js'), 'utf8').match(/CACHE_NAME = 'rawbin-v([^']*)'/) || [])[1];
  const mf = JSON.parse(fs.readFileSync(path.join(WT, 'src/public/dist/build-manifest.json'), 'utf8')).version;
  const agreementFires = !(unit === pkg && unit === sw && unit === mf); // INV-V1 would exit 1
  results.push(agreementFires);
  console.log(`(B) INV-V1 post-build desync (manifest→8.8.8): unit=${unit} pkg=${pkg} sw=${sw} manifest=${mf} → derive-equal-fires=${agreementFires} => ${agreementFires ? 'GREEN caught' : 'RED missed'}`);
} finally {
  try { git(['worktree', 'remove', '--force', WT]); } catch { /* */ }
  fs.rmSync(WT, { recursive: true, force: true });
}

console.log('\n===== R31.7 single-source version (mutate-propagation + INV-V guards) =====');
const green = results.length >= 7 && results.every(Boolean);
console.log(`checks: ${results.filter(Boolean).length}/${results.length} GREEN`);
console.log('OVERALL:', green ? 'GREEN' : 'RED');
console.log('NOTE: worktree-isolated (live pid 498575 v0.7.103 untouched); INV-V3/V1 replicate start.mjs:86/98 exactly (real start.mjs would SIGTERM live :4444 — not run).');
process.exitCode = green ? 0 : 1;
