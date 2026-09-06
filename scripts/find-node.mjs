/**
 * THE ONE node-version finder (extracted from with-node20.mjs so it is reused, not forked). Returns a node binary whose
 * major >= `min`, or null. Used by with-node20.mjs (min 20 = vitest/rolldown/ci:gates) AND the gate harnesses (min 18 =
 * tsx). Same self-healing principle as scripts/start.mjs: a script started under node16 finds node18+/20+/22 side-by-side.
 * T37.32 (A4): the r241/r245 gates spawned bare `npx tsx …` under the default node16 → tsx needs node18+ → ERR_UNKNOWN_FILE_EXTENSION → null.
 */
import { execSync } from 'node:child_process';
import { existsSync, readdirSync, realpathSync } from 'node:fs';
import path from 'node:path';

export const major = (v) => parseInt(String(v).replace(/^v/, '').split('.')[0], 10) || 0;
export const nodeVersion = (bin) => { try { return execSync(`"${bin}" --version`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return ''; } };

/** A node binary with major >= min (current node if already ok, else node22/20/18 on PATH, /opt/node22, nvm, or vscode-server). null if none. */
export function findNode(min) {
  if (major(process.version) >= min) return process.execPath;
  const cands = [];
  for (const n of ['node22', 'node20', 'node18', 'node']) { try { const p = execSync(`command -v ${n}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); if (p) cands.push(p); } catch { /* not on PATH */ } }
  cands.push('/opt/node22/bin/node');
  try { const base = path.join(process.env.HOME || '/root', '.nvm/versions/node'); for (const d of readdirSync(base)) { const p = path.join(base, d, 'bin/node'); if (existsSync(p)) cands.push(p); } } catch { /* no nvm */ }
  try { const base = '/root/.vscode-server/bin'; for (const d of readdirSync(base)) { const p = path.join(base, d, 'node'); if (existsSync(p)) cands.push(p); } } catch { /* no vscode-server node */ } // the node18+ the tester/anchor use
  for (const c of cands) { if (existsSync(c) && major(nodeVersion(c)) >= min) { try { return realpathSync(c); } catch { return c; } } }
  return null;
}
