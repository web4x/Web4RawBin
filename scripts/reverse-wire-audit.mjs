#!/usr/bin/env node
// reverse-wire-audit.mjs — detector for the EXISTENCE-!=-CONNECTION family (reverse-wire integrity).
//
// FAMILY (existence != connection): a wiring edge exists in ONE direction but not its mirror. A task's
// coveredRequirements[] names a req, but the req.tasks[] does NOT name the task back (or vice versa); or a
// referenced uuid is DANGLING (no unit on disk). A forward-only read sees the task as "wired" — the graph
// only lies when you read from the OTHER end. This is the reverse-wire analogue of checklist-vs-chain: the
// pair a one-directional check never inspects.
//
// TIERS (mirrors checklist-chain-audit.mjs FAIL/WARN):
//   FAIL = DANGLING ref — a tasks[]/coveredRequirements[] uuid with NO unit on disk. Unambiguous; exits non-zero.
//   WARN = REVERSE-ASYMMETRY — a forward edge (task.coveredRequirements -> req) with no back edge (req.tasks[]).
//          Reported, not failed: the "does req.tasks[] mirror every covering subtask, or list the coordination
//          root only" invariant is a req-owned call (see R37.4 / T37.4 root-vs-subtask, 2026-08-17). Self-drains
//          as reqs get wired or the invariant is ruled root-only. COUNT emitted so it cannot re-accumulate silently.
//
// NOT A GAP (excluded by construction) — legitimate CROSS-SPRINT. A task executed in sprint A that covers a req
//   homed in sprint B is the HONEST record, NOT a defect (PO ruling 2026-08-17): a requirement keeps its original
//   home (re-homing rewrites history); a task belongs to the sprint where the work is EXECUTED (Tron's pinned
//   sprint / new-work-into-existing-sprint rule). Such an edge, wired BOTH ways, produces ZERO findings here —
//   this detector checks wiring SYMMETRY only, never sprint-membership.
//
// Usage:  node reverse-wire-audit.mjs [--bite] [--report] [SPRINT_UUID | --all]
//   --bite    stub-must-fail self-test (weaken audit() -> RED). Exit 1 on any bite failure.
//   --report  list FAIL+WARN + COUNT, exit 0 (survey / the self-draining metric)
//   (default) list FAIL+WARN + COUNT; exit 1 iff the FAIL tier is non-empty (the ci:gates condition)
//   SPRINT_UUID scopes to one sprint (default b86b53cc = S37, the pinned current); --all sweeps every Sprint unit.
//
// I (robbin-planner) own this AUDIT SCRIPT. ci:gates REGISTRATION (package.json) is the EXPERT's — never edit
// package.json here (standing law, same as checklist-chain-audit.mjs). Wire the FAIL tier as the hard gate +
// emit the WARN COUNT report-only; flip WARN->strict once the count is driven to 0 (auto-strict-at-0, self-draining).

import fs from 'fs';
import path from 'path';

const ref = s => String(s || '').replace('ior:instance:', '');
const DEFAULT_SPRINT = 'b86b53cc-13cb-409a-81d6-2025b5f2979e'; // S37 (pinned current)

// Pure audit over a { uuid -> {ior, m} } map + the set of sprint uuids in scope. No I/O, so the bite drives it
// with synthetic graphs. For each in-scope sprint: walk its tasks[] and requirements[], check both mirrors.
function audit(byUuid, sprintUuids) {
  const get = u => byUuid.get(ref(u));
  const fails = [], warns = [];
  let taskCount = 0, reqCount = 0;
  const seenTask = new Set(), seenReq = new Set();
  for (const su of sprintUuids) {
    const s = get(su); if (!s) continue;
    const label = u => (u.m && u.m.name || '').slice(0, 46);
    // task -> req mirror
    for (const t of (s.m.tasks || []).map(ref)) {
      if (seenTask.has(t)) continue; seenTask.add(t); taskCount++;
      const tu = get(t);
      if (!tu) { fails.push(`DANGLING: sprint ${su.slice(0,8)}.tasks[] -> task ${t.slice(0,8)} MISSING on disk`); continue; }
      for (const r of (tu.m.coveredRequirements || []).map(ref)) {
        const ru = get(r);
        if (!ru) { fails.push(`DANGLING: task ${t.slice(0,8)} "${label(tu)}" -> req ${r.slice(0,8)} MISSING on disk`); continue; }
        if (!(ru.m.tasks || []).map(ref).includes(t))
          warns.push(`REVERSE-ASYMMETRY: task ${t.slice(0,8)} "${label(tu)}" covers req ${r.slice(0,8)}(${ru.m.altId||'?'}) but req.tasks[] omits it`);
      }
    }
    // req -> task mirror
    for (const r of (s.m.requirements || []).map(ref)) {
      if (seenReq.has(r)) continue; seenReq.add(r); reqCount++;
      const ru = get(r);
      if (!ru) { fails.push(`DANGLING: sprint ${su.slice(0,8)}.requirements[] -> req ${r.slice(0,8)} MISSING on disk`); continue; }
      for (const t of (ru.m.tasks || []).map(ref)) {
        const tu = get(t);
        if (!tu) { fails.push(`DANGLING: req ${r.slice(0,8)}(${ru.m.altId||'?'}).tasks[] -> task ${t.slice(0,8)} MISSING on disk`); continue; }
        if (!(tu.m.coveredRequirements || []).map(ref).includes(r))
          warns.push(`REVERSE-ASYMMETRY: req ${r.slice(0,8)}(${ru.m.altId||'?'}) lists task ${t.slice(0,8)} "${label(tu)}" but task.coveredRequirements omits it`);
      }
    }
  }
  return { fails, warns, taskCount, reqCount };
}

// ---- stub-must-fail bite: synthetic graphs assert the detector behaves; weaken audit() -> RED. ----
const U = (ior, m) => ({ ior, m });
const mk = units => { const g = new Map(); for (const u of units) g.set(u.m.uuid, u); return g; };
function runBite() {
  const A = [];
  const ok = (c, msg) => A.push({ ok: !!c, msg });
  // Case A — symmetric task<->req: NO finding.
  const gA = mk([
    U('ior:class:Sprint', { uuid: 'S', tasks: ['ior:instance:t1'], requirements: ['ior:instance:r1'] }),
    U('ior:class:Task', { uuid: 't1', name: 'T', coveredRequirements: ['ior:instance:r1'] }),
    U('ior:class:Requirement', { uuid: 'r1', altId: 'R1', tasks: ['ior:instance:t1'] }),
  ]);
  const rA = audit(gA, ['S']);
  ok(rA.fails.length === 0 && rA.warns.length === 0, 'A: fully symmetric wiring MUST produce no finding');
  // Case B — forward without reverse: MUST WARN (the R37.4 class).
  const gB = mk([
    U('ior:class:Sprint', { uuid: 'S', tasks: ['ior:instance:t1'], requirements: ['ior:instance:r1'] }),
    U('ior:class:Task', { uuid: 't1', name: 'T', coveredRequirements: ['ior:instance:r1'] }),
    U('ior:class:Requirement', { uuid: 'r1', altId: 'R1', tasks: [] }),
  ]);
  ok(audit(gB, ['S']).warns.some(w => w.includes('t1')), 'B: forward-without-reverse MUST be a WARN');
  // Case C — dangling ref: MUST FAIL.
  const gC = mk([
    U('ior:class:Sprint', { uuid: 'S', tasks: ['ior:instance:tGone'], requirements: [] }),
  ]);
  ok(audit(gC, ['S']).fails.some(f => f.includes('tGone')), 'C: a dangling task ref MUST be a FAIL');
  // Case D — cross-sprint but symmetric: NOT a finding (the S37-task -> S40-req honest record).
  const gD = mk([
    U('ior:class:Sprint', { uuid: 'SA', tasks: ['ior:instance:t1'], requirements: [] }),
    U('ior:class:Task', { uuid: 't1', name: 'T', coveredRequirements: ['ior:instance:rB'] }),
    U('ior:class:Requirement', { uuid: 'rB', altId: 'R40.4', parent: 'ior:instance:SB', tasks: ['ior:instance:t1'] }),
  ]);
  const rD = audit(gD, ['SA']);
  ok(rD.fails.length === 0 && rD.warns.length === 0, 'D: cross-sprint but SYMMETRIC wiring MUST produce no finding');
  const bad = A.filter(a => !a.ok);
  for (const a of A) console.log(`  ${a.ok ? 'ok  ' : 'FAIL'} ${a.msg}`);
  console.log(bad.length ? `BITE FAILED (${bad.length})` : 'BITE PASS (4/4)');
  return bad.length ? 1 : 0;
}

// ---- disk loader ----
function loadAll(root) {
  const byUuid = new Map(), sprints = [];
  const walk = d => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.scenario.json')) {
        let j; try { j = JSON.parse(fs.readFileSync(p, 'utf8')); } catch { continue; }
        if (!j || !j.model || !j.model.uuid) continue;
        byUuid.set(j.model.uuid, { ior: j.ior, m: j.model });
        if (j.ior === 'ior:class:Sprint') sprints.push(j.model.uuid);
      }
    }
  };
  walk(root);
  return { byUuid, sprints };
}

// ---- main ----
const args = process.argv.slice(2);
if (args.includes('--bite')) process.exit(runBite());
const report = args.includes('--report');
const rest = args.filter(a => !a.startsWith('--'));
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', 'scenario', 'index');
const { byUuid, sprints } = loadAll(root);
const scope = args.includes('--all') ? sprints : (rest[0] ? [rest[0]] : [DEFAULT_SPRINT]);
const { fails, warns, taskCount, reqCount } = audit(byUuid, scope);
console.log(`reverse-wire-audit: ${scope.length} sprint(s), ${taskCount} tasks, ${reqCount} reqs. FAIL=${fails.length} WARN=${warns.length} (existence!=connection)`);
for (const f of fails) console.log('  FAIL ' + f);
for (const w of warns) console.log('  WARN ' + w);
process.exit(!report && fails.length ? 1 : 0);
