#!/usr/bin/env node
/**
 * node20+ preflight — runs the given command under a node20+ binary, re-using node22/node20 if the current node is
 * too old. Same self-healing principle as scripts/start.mjs, but for vitest/rolldown + ci:gates (which need node20.19+/
 * 22.12+, a higher bar than tsx's node18). So `npm test` / `npm run ci:gates` NEVER fail on wrong-node by construction —
 * run them under node16 and they auto-use node22. Usage: node scripts/with-node20.mjs <command…>
 */
import { spawnSync, execSync } from 'node:child_process';
import { existsSync, readdirSync, realpathSync } from 'node:fs';
import path from 'node:path';

const MIN = 20;
const major = (v) => parseInt(String(v).replace(/^v/, '').split('.')[0], 10) || 0;
const ver = (b) => { try { return execSync(`"${b}" --version`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return ''; } };

function findNode(min) {
  if (major(process.version) >= min) return process.execPath;
  const cands = [];
  for (const n of ['node22', 'node20', 'node']) { try { const p = execSync(`command -v ${n}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); if (p) cands.push(p); } catch { /* not on PATH */ } }
  cands.push('/opt/node22/bin/node');
  try { const base = path.join(process.env.HOME || '/root', '.nvm/versions/node'); for (const d of readdirSync(base)) { const p = path.join(base, d, 'bin/node'); if (existsSync(p)) cands.push(p); } } catch { /* no nvm */ }
  for (const c of cands) if (existsSync(c) && major(ver(c)) >= min) return c;
  return null;
}

let node = findNode(MIN);
if (!node) { console.error(`✗ need node${MIN}+ (vitest/rolldown/ci:gates). Install node22 side-by-side (see scripts/start.mjs + the web4rawbin node-toolchain note) or expose node22 on PATH.`); process.exit(1); }
try { node = realpathSync(node); } catch { /* keep as-is */ } // resolve `node22` symlink → the real bindir that actually holds `node`/`npm`/`npx`

const cmd = process.argv.slice(2).join(' ');
if (!cmd) { console.error('usage: node scripts/with-node20.mjs <command…>'); process.exit(1); }

// prepend the chosen node's REAL bindir so `node`/`npm`/`npx`/node_modules/.bin shims all resolve to node20+
const env = { ...process.env, PATH: `${path.dirname(node)}:${process.env.PATH}` };
if (major(process.version) < MIN) console.log(`↻ node ${process.version} <${MIN} → running under ${ver(node)} @ ${node}`);
const r = spawnSync(cmd, { shell: true, stdio: 'inherit', env });
process.exit(r.status ?? 1);
