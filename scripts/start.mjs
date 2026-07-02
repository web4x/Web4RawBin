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
import { existsSync, readdirSync, realpathSync } from 'node:fs';
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

// (4) build
console.log('▸ build'); run(node18, [path.join(ROOT, 'build.mjs')]);

// (5) run the tsx server in the FOREGROUND (BLOCKING spawnSync) so it holds the pane's controlling TTY → the
// readline request-log TUI streams live in the pane (like WODA.test). An async spawn returns + detaches the child
// from the TTY → silent pane. spawnSync waits on the server + inherits stdio, matching the build-step + the old
// direct-`tsx server.ts` behavior. All self-heal (re-exec/deps/kill/build) above is unchanged.
console.log('▸ server (tsx under node18+, foreground TTY)');
const srv = spawnSync(node18, [path.join(ROOT, 'node_modules/tsx/dist/cli.mjs'), path.join(ROOT, 'src/ts/server/server.ts')], { stdio: 'inherit', cwd: ROOT, env });
process.exit(srv.status ?? 0);
