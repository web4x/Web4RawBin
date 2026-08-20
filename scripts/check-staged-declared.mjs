#!/usr/bin/env node
// scripts/check-staged-declared.mjs — R40.48 Layer-1 subset-check: the staged set must be ⊆ what the committer
// EXPLICITLY declared via `rbadd` (.git/rb-staged manifest). Makes "explicit paths, never -A" impossible to violate
// by construction instead of by reminder (the broad-add family sweeps peers' WIP into a commit — 4 measured times).
//
// ROLLOUT (PO ruling, A+B hybrid with a MEASURED, TIME-BOXED exit):
//   default (live)  WARN-ONLY — log every undeclared staged path to stderr AND to a durable per-agent measurement log
//                   (.git/rb-staged-warnlog); NEVER blocks. This is the adoption-measurement phase.
//   --reject        ENFORCE — exit 1 on any undeclared staged path. The PO pulls this ONE toggle (a PO ruling on the
//                   measured --report data), NOT automatically. Also honored via RB_STAGED_MODE=reject.
//   --report        Read the measurement log and print the per-agent undeclared count + last-seen (readable ON DEMAND,
//                   per-agent, current — so the flip criterion is checkable, not remembered).
//   --reset         Clear the measurement log (the PO starts a fresh convergence window).
//   --selftest      Stub-must-fail: prove the check BITES (undeclared detected; reject-mode would exit 1; a fully
//                   declared set is clean). Registered in ci:gates so the guard's teeth are CI-verified.
//
// Node-only (no tsx), fast — runs in the pre-commit hot path like check-camelcase-names.mjs. Reads git output
// directly (no `cmd | while read` subshell — the value survives, per the R40.48 spec's subshell caveat).
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// ── PURE CORE (shared by the live path AND --selftest): the staged paths NOT present in the declared set. ──
export function undeclaredPaths(staged, declared) {
  const decl = new Set(declared);
  return staged.filter((p) => p && !decl.has(p));
}

function sh(cmd) { return execSync(cmd, { encoding: 'utf8' }); }
function gitDir() { return sh('git rev-parse --git-dir').trim(); }
function stagedPaths() { return sh('git diff --cached --name-only').split('\n').filter(Boolean); }
function declaredPaths(manifest) {
  return fs.existsSync(manifest) ? fs.readFileSync(manifest, 'utf8').split('\n').filter(Boolean) : [];
}

// Best-effort per-agent identity so the measurement is per-committer (all robbin agents share ONE git user, so the
// git author alone can't tell them apart — the agent's tmux pane title does: 'robbin-expert@host'). Precedence:
// explicit RB_AGENT env → tmux pane title → git user.name → 'unknown'. Never throws.
function agentId() {
  if (process.env.RB_AGENT) return process.env.RB_AGENT;
  try { const t = execSync("tmux display-message -p '#{pane_title}'", { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); if (t) return t; } catch { /* not in tmux */ }
  try { const u = sh('git config user.name').trim(); if (u) return u; } catch { /* no user.name */ }
  return 'unknown';
}

function report(warnlog) {
  if (!fs.existsSync(warnlog)) { console.log('R40.48 staged⊆declared — measurement log empty (0 undeclared events across all committers).'); return 0; }
  const rows = fs.readFileSync(warnlog, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  const byAgent = new Map();
  for (const r of rows) {
    const a = byAgent.get(r.agent) || { count: 0, last: '' };
    a.count++; if (!a.last || r.t > a.last) a.last = r.t;
    byAgent.set(r.agent, a);
  }
  console.log('R40.48 staged⊆declared — UNDECLARED-STAGE count per committer (current measurement window):');
  const agents = [...byAgent.entries()].sort((x, y) => y[1].count - x[1].count);
  for (const [agent, a] of agents) console.log(`  ${String(a.count).padStart(5)}  ${agent}  (last: ${a.last})`);
  const total = rows.length;
  const zeroAll = agents.every(([, a]) => a.count === 0); // (only present agents are logged, so any row => not zero)
  console.log(`  ── total undeclared events: ${total} across ${agents.length} committer(s). Flip-eligible = 0 across ALL committers.${total === 0 || zeroAll ? ' ✓ ZERO' : ''}`);
  return 0;
}

function selftest() {
  const cases = [
    { name: 'undeclared detected', staged: ['a.ts', 'b.ts', 'c.ts'], declared: ['a.ts', 'b.ts'], expect: ['c.ts'] },
    { name: 'fully declared = clean', staged: ['a.ts', 'b.ts'], declared: ['a.ts', 'b.ts', 'x.ts'], expect: [] },
    { name: 'empty manifest = ALL undeclared (plain git add)', staged: ['a.ts', 'b.ts'], declared: [], expect: ['a.ts', 'b.ts'] },
    { name: 'broad-add sweep of a peer WIP file caught', staged: ['mine.ts', 'scenario/index/peer.json'], declared: ['mine.ts'], expect: ['scenario/index/peer.json'] },
  ];
  let fail = 0;
  for (const c of cases) {
    const got = undeclaredPaths(c.staged, c.declared);
    const ok = JSON.stringify(got) === JSON.stringify(c.expect);
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${c.name}  → undeclared=[${got.join(', ')}]`);
    if (!ok) { fail++; console.error(`        expected [${c.expect.join(', ')}]`); }
  }
  // reject-mode DECISION must be RED when undeclared is non-empty (proves the future flip bites).
  const rejectWouldBlock = undeclaredPaths(['x'], []).length > 0;
  console.log(`  ${rejectWouldBlock ? 'PASS' : 'FAIL'}  reject-mode would EXIT 1 on an undeclared stage (stub-must-fail)`);
  if (!rejectWouldBlock) fail++;
  if (fail) { console.error(`check:staged-declared SELFTEST FAILED (${fail}) — the guard does not bite.`); process.exit(1); }
  console.log('check:staged-declared SELFTEST GREEN — the subset-check bites (undeclared detected; reject would block; declared is clean).');
  return 0;
}

// ── entry ──
const args = process.argv.slice(2);
if (args.includes('--selftest')) process.exit(selftest());

const gd = gitDir();
const warnlog = path.join(gd, 'rb-staged-warnlog');
if (args.includes('--report')) process.exit(report(warnlog));
if (args.includes('--reset')) { try { fs.rmSync(warnlog, { force: true }); } catch { /* ignore */ } console.log('R40.48 staged⊆declared — measurement log reset (fresh convergence window).'); process.exit(0); }

const mode = args.includes('--reject') || process.env.RB_STAGED_MODE === 'reject' ? 'reject' : 'warn';
const manifest = path.join(gd, 'rb-staged');
const und = undeclaredPaths(stagedPaths(), declaredPaths(manifest));
if (und.length) {
  const agent = agentId();
  const now = new Date().toISOString();
  for (const p of und) {
    console.error(`pre-commit WARN [R40.48 staged⊆declared]: '${p}' was staged but NOT declared via rbadd — use: ./rbadd ${p}`);
    if (mode === 'warn') { try { fs.appendFileSync(warnlog, JSON.stringify({ t: now, agent, path: p }) + '\n'); } catch { /* log best-effort */ } }
  }
  if (mode === 'reject') {
    console.error(`pre-commit BLOCKED [R40.48]: ${und.length} undeclared staged path(s) by '${agent}' — stage via ./rbadd (explicit paths only). Commit rejected.`);
    process.exit(1);
  }
  console.error(`pre-commit WARN [R40.48]: ${und.length} undeclared staged path(s) by '${agent}' (warn-only measurement — adopt ./rbadd to drain to 0; run 'node scripts/check-staged-declared.mjs --report' for the per-agent count).`);
}
process.exit(0);
