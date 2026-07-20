#!/usr/bin/env node
/**
 * planner-drive launcher (#102 fix) — runs scripts/planner-drive.ts under a node18+ binary via the tsx CLI,
 * SELF-HEALING from any default node. The repo default `node` is v16.11.0; tsx 4.x's loader needs node18+, so the
 * documented `npx tsx scripts/planner-drive.ts …` throws ERR_UNKNOWN_FILE_EXTENSION on node16 (the --experimental-
 * loader can't register `.ts`). This launcher finds node18+ (node22/20/18 on PATH, /opt/node*, nvm) and invokes the
 * tsx CLI directly (node <tsx/dist/cli.mjs> <script> — the reliable path that engages the loader), so agents can
 * self-mark hops regardless of the default node. Same principle as scripts/start.mjs (server) + with-node20.mjs (ci).
 *
 * Usage (agents): node scripts/drive.mjs <verb> [args…]
 *   node scripts/drive.mjs hop impl done expert
 *   node scripts/drive.mjs focus <task-uuid>   |   node scripts/drive.mjs status | pin | gate
 */
import { spawnSync, execSync } from 'node:child_process';
import { existsSync, readdirSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIN = 18; // tsx 4.x needs node18+
const major = (v) => parseInt(String(v).replace(/^v/, '').split('.')[0], 10) || 0;
const ver = (b) => { try { return execSync(`"${b}" --version`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return ''; } };

function findNode(min) {
  if (major(process.version) >= min) return process.execPath;
  const cands = [];
  for (const n of ['node22', 'node20', 'node18', 'node']) { try { const p = execSync(`command -v ${n}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); if (p) cands.push(p); } catch { /* not on PATH */ } }
  cands.push('/opt/node22/bin/node', '/opt/node20/bin/node');
  try { const base = path.join(process.env.HOME || '/root', '.nvm/versions/node'); for (const d of readdirSync(base)) { const p = path.join(base, d, 'bin/node'); if (existsSync(p)) cands.push(p); } } catch { /* no nvm */ }
  for (const c of cands) if (existsSync(c) && major(ver(c)) >= min) return c;
  return null;
}

let node = findNode(MIN);
if (!node) { console.error(`✗ drive: no node${MIN}+ found (tsx needs node${MIN}+). Install/expose node18+/node20/node22 on PATH (see scripts/start.mjs + the web4rawbin node-toolchain note).`); process.exit(1); }
try { node = realpathSync(node); } catch { /* keep as-is */ }
if (major(process.version) < MIN) console.log(`↻ drive: node ${process.version} <${MIN} → running under ${ver(node)} @ ${node}`);

const tsxCli = path.join(ROOT, 'node_modules/tsx/dist/cli.mjs');
const script = path.join(ROOT, 'scripts/planner-drive.ts');
const r = spawnSync(node, [tsxCli, script, ...process.argv.slice(2)], { stdio: 'inherit', cwd: ROOT });
process.exit(r.status ?? 1);
