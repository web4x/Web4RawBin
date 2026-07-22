#!/usr/bin/env node
/**
 * R27.6 self-healing prod launcher — `npm start` = `node scripts/start.mjs`.
 * Plain node (NO tsx to bootstrap), so it runs even under node<18; tsx 4.x needs node18+, so this launcher:
 *   (1) finds a node18+ binary and RE-EXECS itself under it if the current node is <18 (clear error if none),
 *   (2) `npm i` if node_modules is missing,
 *   (3) KILLS any server already on the ports (4444/4000),
 *   (4) `node build.mjs`,
 *   (5) spawns the tsx server under node18+.
 * One-shot; only prereq = npm exists. Works with no prior `npm i` or build.
 */
import { spawnSync, execSync } from 'node:child_process';
import { existsSync, readdirSync, realpathSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const SELF = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SELF), '..');
const PORTS = [4444, 4000];
const major = (v) => parseInt(String(v).replace(/^v/, '').split('.')[0], 10) || 0;
const ver = (bin) => { try { return execSync(`"${bin}" --version`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return ''; } };

function findNode18() {
  if (major(process.version) >= 18) return process.execPath;   // already good
  const cands = [];
  for (const n of ['node22', 'node20', 'node18', 'node']) { try { const p = execSync(`command -v ${n}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); if (p) cands.push(p); } catch { /* not on PATH */ } }
  for (const base of [path.join(process.env.HOME || '/root', '.vscode-server/bin'), path.join(process.env.HOME || '/root', '.nvm/versions/node')]) {
    try { for (const d of readdirSync(base)) { for (const rel of ['node', 'bin/node']) { const p = path.join(base, d, rel); if (existsSync(p)) cands.push(p); } } } catch { /* dir absent */ }
  }
  for (const c of cands) if (major(ver(c)) >= 18) return c;
  return null;
}

// [impl:uuid:329b5473-695c-4fde-9c79-97d53e090547] R29.1 ServerLauncher.selfHealingStart — orchestrate the self-heal
function selfHealingStart() {
  const node18 = findNode18();
  if (!node18) { console.error('✗ start: no node18+ found (tsx needs node18+). Install node18+ or expose it on PATH as node18/node20/node22, or via a vscode-server node / nvm.'); process.exit(1); }

  // (1) re-exec self under node18+ if the current process is too old
  if (major(process.version) < 18) {
    console.log(`↻ start: current node ${process.version} <18 → re-exec under ${node18} (${ver(node18)})`);
    const r = spawnSync(node18, [SELF, ...process.argv.slice(2)], { stdio: 'inherit', cwd: ROOT });
    process.exit(r.status ?? 1);
  }

  // running under node18+ from here — put its REAL bindir first so `npm`/child node calls also use it (resolve the
  // `node22` symlink → /opt/node22/bin, which actually holds node/npm/npx; a symlink dir would leave `node`=system node)
  let realNode = node18; try { realNode = realpathSync(node18); } catch { /* keep */ }
  const env = { ...process.env, PATH: `${path.dirname(realNode)}:${process.env.PATH}` };
  const run = (cmd, args) => { const r = spawnSync(cmd, args, { stdio: 'inherit', cwd: ROOT, env }); if (r.status !== 0) { console.error(`✗ start: '${cmd} ${args.join(' ')}' exited ${r.status}`); process.exit(r.status ?? 1); } };

  console.log(`▸ start: node ${ver(node18)} @ ${node18}`);

  // (2) npm i if node_modules missing
  if (!existsSync(path.join(ROOT, 'node_modules'))) { console.log('▸ node_modules missing → npm i'); run('npm', ['i']); }

  // (3) kill any server already on the ports (fresh restart)
  for (const port of PORTS) {
    try {
      const pids = execSync(`lsof -ti tcp:${port} 2>/dev/null || true`, { shell: '/bin/bash' }).toString().trim().split(/\s+/).filter(Boolean);
      for (const pid of pids) { try { process.kill(parseInt(pid, 10), 'SIGTERM'); console.log(`▸ killed pid ${pid} on :${port}`); } catch { /* already gone */ } }
    } catch { /* lsof miss */ }
  }
  try { execSync('sleep 1'); } catch { /* let the ports free (server uses SO_REUSEADDR anyway) */ }

  // (4-pre) R31.7 INV-V3 (tree-clean landmine guard): the deploy-critical generator input+outputs MUST equal HEAD.
  versionGuardTreeClean(env);

  // (4) build — regenerates package.json/sw.js/manifest/__BUILD_VERSION__ from the ONE typed Config unit (R31.7)
  console.log('▸ build'); run(node18, [path.join(ROOT, 'build.mjs')]);

  // (4-post) R31.7 INV-V1 (derive-equal): every version consumer must agree with the Config unit after the build.
  versionGuardAgreement();

  // (5) foreground server (holds the pane TTY)
  runServerForeground(node18, env);
}

const CONFIG_UNIT_REL = 'scenario/index/c/o/n/f/i/config-singleton-0000-000000000001.scenario.json';

// R31.7 INV-V3: a reverted/stray per-file `git checkout <ref> -- <file>` (the phantom-7.99 incident — no reflog)
// fails LOUDLY here BEFORE deploy. SCOPED to the deploy-critical generator input+outputs ONLY — this shared repo
// always carries unrelated churn, so a whole-tree guard would false-positive every deploy and get disabled.
function versionGuardTreeClean(env) {
  const files = ['src/ts/server/server.ts', 'package.json', 'src/public/sw.js', CONFIG_UNIT_REL];
  try {
    const r = spawnSync('git', ['diff', '--quiet', 'HEAD', '--', ...files], { cwd: ROOT, env });
    if (r.status && r.status !== 0) {
      console.error('✗ R31.7 INV-V3: deploy-critical file(s) diverge from HEAD (stray edit/checkout = the version-desync landmine):');
      try { console.error(spawnSync('git', ['diff', '--name-only', 'HEAD', '--', ...files], { cwd: ROOT, env }).stdout.toString()); } catch { /* */ }
      console.error('  Fix: commit them, or `git checkout HEAD -- <file>`. Inspect old versions with `git show <ref>:<file>` (NEVER `git checkout <ref> -- <file>` — mutates the tree = the landmine).');
      process.exit(1);
    }
  } catch { /* no git → skip (dev without a repo) */ }
}

// R31.7 INV-V1: after the build, every version consumer must derive-equal from the ONE Config unit.
function versionGuardAgreement() {
  try {
    const unit = JSON.parse(readFileSync(path.join(ROOT, CONFIG_UNIT_REL), 'utf-8')).model.version;
    const pkg = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf-8')).version;
    const sw = (readFileSync(path.join(ROOT, 'src/public/sw.js'), 'utf-8').match(/CACHE_NAME = 'rawbin-v([^']*)'/) || [])[1];
    const mf = JSON.parse(readFileSync(path.join(ROOT, 'src/public/dist/build-manifest.json'), 'utf-8')).version;
    if (!(unit === pkg && unit === sw && unit === mf)) {
      console.error(`✗ R31.7 INV-V1: version consumers disagree — unit=${unit} package.json=${pkg} sw.js=${sw} manifest=${mf}. Generator failed; refusing to serve a desynced version.`);
      process.exit(1);
    }
    console.log(`✓ R31.7 version-integrity: unit == package.json == sw.js == manifest == ${unit}`);
  } catch (e) { console.error(`✗ R31.7 INV-V1: could not verify version agreement (${e && e.message ? e.message : e})`); process.exit(1); }
}

// [impl:uuid:fbef44bc-efea-42b2-aab0-7fef82afd41e] R29.1 ServerLauncher.runServerForeground — blocking foreground server spawn (holds pane TTY)
// An async spawn detaches the child from the pane's controlling TTY → silent pane; blocking spawnSync waits on the
// server + inherits stdio, so the request-log streams live in the pane (matches the build-step + old direct-tsx).
function runServerForeground(node, environ) {
  console.log('▸ server (tsx under node18+, foreground TTY)');
  const srv = spawnSync(node, [path.join(ROOT, 'node_modules/tsx/dist/cli.mjs'), path.join(ROOT, 'src/ts/server/server.ts')], { stdio: 'inherit', cwd: ROOT, env: environ });
  process.exit(srv.status ?? 0);
}

selfHealingStart();
