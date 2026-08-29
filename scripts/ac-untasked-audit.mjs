#!/usr/bin/env node
// ac-untasked-audit.mjs — detector for the MINTED-BUT-NEVER-TASKED AC family (invisible = looks-covered).
//
// FAMILY (untasked-requirement / unwired-guard): a Requirement is committed to a Sprint and carries
// implementable acceptanceCriteria, yet NO task covers it — so its ACs (or a half of them) can be minted,
// look covered because the req exists, and never get an implementing task. Tron's R40.62 diagram half is
// the live instance: a4c9340d has acceptanceCriteria + is in S40.requirements[] + tasks[] EMPTY.
//
// PROPERTY (not a hand-list — the whole point, per PO): EVERY sprint-committed Requirement with
// acceptanceCriteria MUST have >=1 covering Task (some Task.coveredRequirements references it). A req that
// does not is FLAGGED. Derived from the graph, so a NEW untasked req is caught automatically — no gate edit.
//
// TIER-1 (this): whole-req-never-tasked (req.tasks/coverage EMPTY). TIER-2 (architect, deferred):
// AC-level half-built case (some ACs of a covered req untasked) — needs AC<->task mapping.
//
// Legitimately-untasked reqs are EXCLUDED (not a defect): status 'Backlog', captureOnly, conceptOnly, future.
//
// REPORT-ONLY: exits 0 always (never reds the shared chain while it flags a known-open item — right-
// requirement/wrong-rollout). Wire it BLOCKING into ci:gates only in the SAME commit that turns it green.
//
// Usage: node scripts/ac-untasked-audit.mjs [--bite] [ROOT]
//   --bite  stub-must-fail self-test (weaken -> RED, exit 1). Proves non-vacuity.
//   (default) list FLAGGED + count, exit 0.

import fs from 'fs';
import path from 'path';

const ref = s => String(s || '').replace('ior:instance:', '');

// Pure detection over a { uuid -> {ior, m} } map — no I/O so the bite can drive synthetic graphs.
function audit(byUuid) {
  const reqs = [...byUuid.values()].filter(x => x.ior === 'ior:class:Requirement');
  const tasks = [...byUuid.values()].filter(x => x.ior === 'ior:class:Task');
  const sprints = [...byUuid.values()].filter(x => x.ior === 'ior:class:Sprint');
  // reqs committed to a sprint (in some Sprint.requirements[])
  const committed = new Set();
  for (const s of sprints) for (const r of (s.m.requirements || [])) committed.add(ref(r));
  // reqs covered by SOME task (the authoritative task->req link)
  const covered = new Set();
  for (const t of tasks) for (const r of (t.m.coveredRequirements || [])) covered.add(ref(r));
  const flagged = [];
  for (const r of reqs) {
    const m = r.m;
    const hasAcs = Array.isArray(m.acceptanceCriteria) && m.acceptanceCriteria.length > 0;
    const legitUntasked = m.status === 'Backlog' || m.captureOnly === true || m.conceptOnly === true || m.future === true;
    if (committed.has(m.uuid) && hasAcs && !legitUntasked && !covered.has(m.uuid)) {
      flagged.push({ uuid: m.uuid.slice(0, 8), altId: m.altId || '?', acs: m.acceptanceCriteria.length, name: (m.name || '').slice(0, 60) });
    }
  }
  return { flagged, scanned: reqs.length };
}

function loadGraph(root) {
  const idx = path.join(root, 'scenario', 'index');
  const byUuid = new Map();
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.scenario.json')) {
        try { const j = JSON.parse(fs.readFileSync(p, 'utf8')); if (j.model && j.model.uuid) byUuid.set(j.model.uuid, { ior: j.ior, m: j.model }); } catch { /* skip malformed */ }
      }
    }
  })(idx);
  return byUuid;
}

// --- stub-must-fail bite: synthetic graphs, assert the detector behaves. Weaken audit() -> these go RED. ---
const U = (ior, m) => ({ ior, m });
function mkMap(units) { const map = new Map(); for (const u of units) map.set(u.m.uuid, u); return map; }
function runBite() {
  const asserts = [];
  const A = (ok, msg) => asserts.push({ ok: !!ok, msg });
  // Case A — MUST FLAG: sprint-committed req + ACs + no covering task.
  const gA = mkMap([
    U('ior:class:Sprint', { uuid: 'sprA', requirements: ['ior:instance:reqA'] }),
    U('ior:class:Requirement', { uuid: 'reqA', acceptanceCriteria: [{ id: 'AC1' }] }),
  ]);
  A(audit(gA).flagged.some(f => f.uuid === 'reqA'), 'A: committed req + ACs + no task MUST flag');
  // Case B — MUST NOT flag: same req but a task covers it.
  const gB = mkMap([
    U('ior:class:Sprint', { uuid: 'sprB', requirements: ['ior:instance:reqB'] }),
    U('ior:class:Requirement', { uuid: 'reqB', acceptanceCriteria: [{ id: 'AC1' }] }),
    U('ior:class:Task', { uuid: 'taskB', coveredRequirements: ['ior:instance:reqB'] }),
  ]);
  A(!audit(gB).flagged.some(f => f.uuid === 'reqB'), 'B: a covered req MUST NOT flag');
  // Case C — MUST NOT flag: Backlog/captureOnly legitimately-untasked req.
  const gC = mkMap([
    U('ior:class:Sprint', { uuid: 'sprC', requirements: ['ior:instance:reqC'] }),
    U('ior:class:Requirement', { uuid: 'reqC', acceptanceCriteria: [{ id: 'AC1' }], status: 'Backlog', captureOnly: true }),
  ]);
  A(!audit(gC).flagged.some(f => f.uuid === 'reqC'), 'C: a Backlog/captureOnly req MUST NOT flag (legit-untasked)');
  // Case D — MUST NOT flag: not committed to any sprint (pure backlog, no sprint ref).
  const gD = mkMap([
    U('ior:class:Requirement', { uuid: 'reqD', acceptanceCriteria: [{ id: 'AC1' }] }),
  ]);
  A(!audit(gD).flagged.some(f => f.uuid === 'reqD'), 'D: a req in NO sprint MUST NOT flag (not yet committed)');
  const failed = asserts.filter(a => !a.ok);
  for (const a of asserts) console.log(`${a.ok ? 'ok  ' : 'FAIL'}  ${a.msg}`);
  if (failed.length) { console.log(`\nBITE FAILED (${failed.length}) — detector is vacuous/broken.`); process.exit(1); }
  console.log(`\nBITE PASS (${asserts.length}/4) — non-vacuous.`);
}

const args = process.argv.slice(2);
if (args.includes('--bite')) { runBite(); }
else {
  const root = args.find(a => !a.startsWith('--')) || '.';
  const { flagged, scanned } = audit(loadGraph(root));
  console.log(`== ac-untasked-audit (family: untasked-requirement) — scanned ${scanned} requirements ==`);
  console.log(`FLAGGED (${flagged.length}) — sprint-committed req + ACs + NO covering task (report-only, verify-owner-first):`);
  for (const f of flagged) console.log(`  [${f.altId}] ${f.uuid} | ${f.acs} ACs | ${f.name}`);
  // REPORT-ONLY: never fails CI while unwired (right-requirement/wrong-rollout).
  process.exit(0);
}
