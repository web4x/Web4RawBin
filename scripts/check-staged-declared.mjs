#!/usr/bin/env node
// scripts/check-staged-declared.mjs — R40.48 Layer-1 subset-check: the staged set must be ⊆ what the committer
// EXPLICITLY declared via `rbadd` (.git/rb-staged manifest). Makes "explicit paths, never -A" impossible to violate
// by construction instead of by reminder. WHY it matters: a SHARED .git index means a broad add can sweep a PEER'S
// unverified work into your commit (happened 4×) and an index race can DROP commits outright (happened today).
//
// ROLLOUT (PO ruling, A+B hybrid with a MEASURED, TIME-BOXED, INVARIANT-gated exit):
//   default (live)  WARN-ONLY — log the commit's undeclared paths to stderr AND record a per-commit event in a durable
//                   measurement log (.git/rb-staged-warnlog); NEVER blocks. Adoption-measurement phase.
//   --reject        ENFORCE — exit 1 on any undeclared staged path. The PO pulls this ONE toggle on the --report data,
//                   NEVER automatically / on a timer. Also honored via RB_STAGED_MODE=reject.
//   --mark-rewind <agent>   Record that <agent> was REWOUND now (the trainer/SM calls this on every rewind). Lets
//                   --report measure the REAL invariant — "adoption survived a rewind" — not just the time/commit proxy.
//   --report        Per-agent undeclared + declared-commit counts, fleet window (hours + commits), and the REWIND-
//                   SURVIVAL invariant (≥1 agent rewound in-window whose POST-rewind commits are all declared). Prints
//                   the PO's flip-eligibility signals (0-undeclared AND ≥24h AND ≥25 commits AND ≥1 rewind-survived).
//   --reset         Clear the measurement log (the PO starts a fresh convergence window).
//   --selftest      Stub-must-fail: prove the check BITES. Registered in ci:gates so the guard's teeth are CI-verified.
//
// Node-only (no tsx), fast. Reads git directly (no `cmd | while read` subshell — the value survives, R40.48 spec).
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// ── PURE CORE (shared by the live path AND --selftest): the staged paths NOT present in the declared set. ──
export function undeclaredPaths(staged, declared) {
  const decl = new Set(declared);
  return staged.filter((p) => p && !decl.has(p));
}

// ── PURE CORE: the PO's flip-eligibility invariant over the measurement rows. NOT the proxy alone — requires that at
// least one agent was REWOUND in-window and every one of its POST-rewind commits stayed declared (0 undeclared). ──
export function flipSignals(rows, nowMs, { minHours = 24, minCommits = 25 } = {}) {
  const commits = rows.filter((r) => r.event === 'commit');
  const rewinds = rows.filter((r) => r.event === 'rewind');
  const totalUndeclared = commits.reduce((n, c) => n + (c.undeclared || 0), 0);
  const firstMs = rows.length ? Math.min(...rows.map((r) => Date.parse(r.t))) : nowMs;
  const spanHours = (nowMs - firstMs) / 3.6e6;
  // rewind-survival: an agent rewound at time R, with ≥1 commit after R and ALL post-R commits declared (undeclared==0).
  const survivors = [];
  for (const rw of rewinds) {
    const rMs = Date.parse(rw.t);
    const after = commits.filter((c) => c.agent === rw.agent && Date.parse(c.t) > rMs);
    if (after.length >= 1 && after.every((c) => (c.undeclared || 0) === 0)) survivors.push(rw.agent);
  }
  return {
    totalUndeclared,
    zeroUndeclared: totalUndeclared === 0,
    commitCount: commits.length,
    spanHours,
    rewindSurvived: survivors.length > 0,
    survivors: [...new Set(survivors)],
    eligible: totalUndeclared === 0 && spanHours >= minHours && commits.length >= minCommits && survivors.length > 0,
  };
}

function sh(cmd) { return execSync(cmd, { encoding: 'utf8' }); }
function gitDir() { return sh('git rev-parse --git-dir').trim(); }
function stagedPaths() { return sh('git diff --cached --name-only').split('\n').filter(Boolean); }
function declaredPaths(manifest) { return fs.existsSync(manifest) ? fs.readFileSync(manifest, 'utf8').split('\n').filter(Boolean) : []; }
function readRows(warnlog) {
  if (!fs.existsSync(warnlog)) return [];
  return fs.readFileSync(warnlog, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
}

// Best-effort per-agent identity: explicit RB_AGENT env (reliable) → tmux pane title → git user.name → 'unknown'.
// (All robbin agents share ONE git user, so RB_AGENT is the trustworthy key; tmux drifts across panes.)
function agentId() {
  if (process.env.RB_AGENT) return process.env.RB_AGENT;
  try { const t = execSync("tmux display-message -p '#{pane_title}'", { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); if (t) return t; } catch { /* not in tmux */ }
  try { const u = sh('git config user.name').trim(); if (u) return u; } catch { /* no user.name */ }
  return 'unknown';
}

function report(warnlog) {
  const rows = readRows(warnlog);
  if (!rows.length) { console.log('R40.48 staged⊆declared — measurement log empty (0 events; fresh window).'); return 0; }
  const commits = rows.filter((r) => r.event === 'commit');
  const byAgent = new Map();
  for (const c of commits) {
    const a = byAgent.get(c.agent) || { commits: 0, undeclaredCommits: 0, undeclaredPaths: 0, last: '' };
    a.commits++; if ((c.undeclared || 0) > 0) { a.undeclaredCommits++; a.undeclaredPaths += c.undeclared; }
    if (!a.last || c.t > a.last) a.last = c.t;
    byAgent.set(c.agent, a);
  }
  console.log('R40.48 staged⊆declared — per-committer (current window):');
  console.log('   commits  undecl-commits  undecl-paths  agent  (last)');
  for (const [agent, a] of [...byAgent.entries()].sort((x, y) => y[1].undeclaredPaths - x[1].undeclaredPaths))
    console.log(`  ${String(a.commits).padStart(7)}  ${String(a.undeclaredCommits).padStart(14)}  ${String(a.undeclaredPaths).padStart(12)}  ${agent}  (${a.last})`);
  const s = flipSignals(rows, Date.now());
  console.log(`  ── window: ${commits.length} commit(s) over ${s.spanHours.toFixed(1)}h; total undeclared paths = ${s.totalUndeclared}.`);
  console.log('  ── FLIP-ELIGIBILITY (PO rules the flip on this — never automatic):');
  console.log(`       0-undeclared across ALL committers : ${s.zeroUndeclared ? '✓' : '✗ (' + s.totalUndeclared + ' undeclared)'}`);
  console.log(`       sustained ≥24h                     : ${s.spanHours >= 24 ? '✓' : '✗ (' + s.spanHours.toFixed(1) + 'h)'}`);
  console.log(`       ≥25 fleet commits                  : ${s.commitCount >= 25 ? '✓' : '✗ (' + s.commitCount + ')'}`);
  console.log(`       ≥1 committer SURVIVED a rewind     : ${s.rewindSurvived ? '✓ (' + s.survivors.join(', ') + ')' : '✗ — the invariant is UNTESTED until a rewind lands in-window (time/commits alone do not prove it)'}`);
  console.log(`     ⇒ FLIP-ELIGIBLE: ${s.eligible ? '✓ YES — report to PO for the ruling' : '✗ not yet'}`);
  return 0;
}

function selftest() {
  let fail = 0;
  const chk = (name, got, expect) => { const ok = JSON.stringify(got) === JSON.stringify(expect); console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}`); if (!ok) { fail++; console.error(`        got ${JSON.stringify(got)} expected ${JSON.stringify(expect)}`); } };
  chk('undeclared detected', undeclaredPaths(['a.ts', 'b.ts', 'c.ts'], ['a.ts', 'b.ts']), ['c.ts']);
  chk('fully declared = clean', undeclaredPaths(['a.ts', 'b.ts'], ['a.ts', 'b.ts', 'x.ts']), []);
  chk('empty manifest = ALL undeclared (plain git add)', undeclaredPaths(['a.ts', 'b.ts'], []), ['a.ts', 'b.ts']);
  chk('broad-add sweep of a peer WIP file caught', undeclaredPaths(['mine.ts', 'scenario/index/peer.json'], ['mine.ts']), ['scenario/index/peer.json']);
  // reject-mode DECISION must be RED when undeclared is non-empty (proves the future flip bites).
  console.log(`  ${undeclaredPaths(['x'], []).length > 0 ? 'PASS' : 'FAIL'}  reject-mode would EXIT 1 on an undeclared stage`);
  if (undeclaredPaths(['x'], []).length === 0) fail++;
  // flip invariant: proxy met but NO rewind-in-window ⇒ NOT eligible (asserts the invariant, not the proxy).
  const now = Date.parse('2026-01-02T00:00:00Z');
  const proxyOnly = [];
  for (let i = 0; i < 30; i++) proxyOnly.push({ t: '2026-01-01T00:00:00Z', agent: 'a', event: 'commit', undeclared: 0 });
  const sProxy = flipSignals(proxyOnly, now);
  console.log(`  ${sProxy.zeroUndeclared && sProxy.spanHours >= 24 && sProxy.commitCount >= 25 && !sProxy.eligible ? 'PASS' : 'FAIL'}  proxy met (0-undecl,≥24h,≥25) but NO rewind ⇒ NOT flip-eligible`);
  if (!(sProxy.zeroUndeclared && sProxy.spanHours >= 24 && sProxy.commitCount >= 25 && !sProxy.eligible)) fail++;
  // add a rewind whose post-rewind commits are all declared ⇒ eligible.
  const withRewind = [...proxyOnly, { t: '2026-01-01T06:00:00Z', agent: 'a', event: 'rewind' }, { t: '2026-01-01T12:00:00Z', agent: 'a', event: 'commit', undeclared: 0 }];
  console.log(`  ${flipSignals(withRewind, now).eligible ? 'PASS' : 'FAIL'}  proxy + a REWIND survived (post-rewind all declared) ⇒ flip-eligible`);
  if (!flipSignals(withRewind, now).eligible) fail++;
  // a rewind whose post-rewind commit is UNDECLARED ⇒ did NOT survive ⇒ not eligible.
  const brokeAfterRewind = [...proxyOnly, { t: '2026-01-01T06:00:00Z', agent: 'a', event: 'rewind' }, { t: '2026-01-01T12:00:00Z', agent: 'a', event: 'commit', undeclared: 2 }];
  console.log(`  ${!flipSignals(brokeAfterRewind, now).eligible ? 'PASS' : 'FAIL'}  rewind then an UNDECLARED commit ⇒ NOT survived ⇒ not eligible`);
  if (flipSignals(brokeAfterRewind, now).eligible) fail++;
  if (fail) { console.error(`check:staged-declared SELFTEST FAILED (${fail}).`); process.exit(1); }
  console.log('check:staged-declared SELFTEST GREEN — subset-check bites + flip asserts the rewind-survival INVARIANT, not the proxy.');
  return 0;
}

// ── entry ──
const args = process.argv.slice(2);
if (args.includes('--selftest')) process.exit(selftest());

const gd = gitDir();
const warnlog = path.join(gd, 'rb-staged-warnlog');

if (args.includes('--mark-rewind')) {
  const agent = args[args.indexOf('--mark-rewind') + 1];
  if (!agent) { console.error('usage: --mark-rewind <agent>'); process.exit(1); }
  fs.appendFileSync(warnlog, JSON.stringify({ t: new Date().toISOString(), agent, event: 'rewind' }) + '\n');
  console.log(`R40.48 staged⊆declared — recorded REWIND of '${agent}' (rewind-survival invariant will check its next commits).`);
  process.exit(0);
}
if (args.includes('--report')) process.exit(report(warnlog));
if (args.includes('--reset')) { try { fs.rmSync(warnlog, { force: true }); } catch { /* ignore */ } console.log('R40.48 staged⊆declared — measurement log reset (fresh convergence window).'); process.exit(0); }

const mode = args.includes('--reject') || process.env.RB_STAGED_MODE === 'reject' ? 'reject' : 'warn';
const manifest = path.join(gd, 'rb-staged');
const staged = stagedPaths();
const und = undeclaredPaths(staged, declaredPaths(manifest));
const agent = agentId();
if (und.length) {
  for (const p of und) console.error(`pre-commit WARN [R40.48 staged⊆declared]: '${p}' was staged but NOT declared via rbadd — use: ./rbadd ${p}`);
  if (mode === 'reject') {
    console.error(`pre-commit BLOCKED [R40.48]: ${und.length} undeclared staged path(s) by '${agent}' — stage via ./rbadd (explicit paths only). Commit rejected.`);
    process.exit(1);
  }
  console.error(`pre-commit WARN [R40.48]: ${und.length} undeclared staged path(s) by '${agent}' (warn-only measurement — adopt ./rbadd; 'node scripts/check-staged-declared.mjs --report' for the fleet count).`);
}
// Record ONE per-commit measurement event (warn phase only): agent + undeclared count → the per-agent counts, the
// fleet window, and the rewind-survival invariant are all derived from these + the --mark-rewind rows. Best-effort.
if (mode === 'warn' && staged.length) {
  try { fs.appendFileSync(warnlog, JSON.stringify({ t: new Date().toISOString(), agent, event: 'commit', undeclared: und.length, paths: und }) + '\n'); } catch { /* log best-effort */ }
}
process.exit(0);
