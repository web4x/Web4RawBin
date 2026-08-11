#!/usr/bin/env node
// checklist-chain-audit.mjs — detector for the UNDER-RECORDED-PROGRESS family.
//
// FAMILY (under-recorded-progress): a task's CHECKLIST lags its CHAIN — the chain reached a
// shipped Impl (markerPending=false) or a two-keyed passing Test, while the checklist derives
// Planned/early. This class is INVISIBLE to the status-vs-checklist drift detector, because the
// stored status EQUALS the derived status (both Planned) — the lie is checklist-vs-CHAIN, a
// different pair. It corrupts Tron's QA steering (he decides from statuses that are stale).
//
// COVERAGE COUNTS ONLY ON A REAL CHAIN-EDGE: a Test covers an Impl iff the Test uuid is in
// Impl.tests[] AND the Test.implementations[] references that Impl back (TWO-KEYED) AND
// Test.status==='pass'. A Test that merely MENTIONS the requirement in prose is NOT coverage
// (that is the phantom-coverage illusion — C2's cited test was a cross-credit to another Impl,
// C6's was an R-C7 bite that named R-C6 in its description; neither was a chain-edge).
//
// Tiers: FAIL = derived==Planned AND chain has a shipped Impl (unambiguous: nothing recorded but
// code shipped — the C2/C6 class; exits non-zero for ci:gates). WARN = softer lags flagged
// verify-owner-first (a shared Impl/Method can make a shipped-Impl/passing-Test belong to a
// SIBLING req, so these are NOT confirmed under-records — report, do not fail).
//
// Usage:  node checklist-chain-audit.mjs [--bite] [--report] [ROOT]
//   --bite    run the stub-must-fail self-test (proves non-vacuity: weaken the logic -> RED). Exit 1 on any bite failure.
//   --report  list FAIL+WARN and exit 0 (survey mode, never fails CI)
//   (default) list FAIL+WARN; exit 1 if the FAIL tier is non-empty (the ci:gates condition)
//
// I (robbin-planner) own this AUDIT SCRIPT. ci:gates REGISTRATION (package.json) is the expert's
// — never edit package.json here (standing law; ci:gates:raw has been silently weakened before).

import fs from 'fs';
import path from 'path';
// C4 (C): the ONE real-chain-edge predicate (src/ts/scenario/step-evidence.ts). Imported DYNAMICALLY with a
// SELF-DESCRIBING guard: a plain-node invocation (no tsx) can't load the .ts, and the raw failure is a cryptic
// ERR_UNKNOWN_FILE_EXTENSION / ERR_MODULE_NOT_FOUND that reads as a PRODUCT failure (cost real time tonight on
// r4010's exit-9). Fail closed, but say WHICH kind: RED_INFRA (exit 2, runner missing tsx) is DISTINCT from the
// audit's own RED_FAILED (exit 1, real under-recorded-progress). Never make a .js copy — that re-forks the very
// single-source (C) we just retired.
let StepEvidence;
try {
  ({ StepEvidence } = await import('../src/ts/scenario/step-evidence.js'));
} catch (e) {
  console.error('❌ RED_INFRA — checklist-chain-audit requires node20+ with tsx. Run: `node --import tsx scripts/checklist-chain-audit.mjs` (NOT plain node). This is a RUNNER/INFRA failure, not an audit failure (exit 2 ≠ the audit\'s RED_FAILED exit 1).');
  console.error(`   loader error: ${(e && (e.code || e.message)) || e}`);
  process.exit(2);
}

const ORDER = ['Planned', 'In Progress', 'QA Review', 'Done'];
const ref = s => String(s || '').replace('ior:instance:', '');

function deriveStatusEnum(cl) {
  if (typeof cl !== 'string') return 'Planned';
  let best = 'Planned';
  for (const line of cl.split('\n')) {
    const m = line.match(/^- \[x\] (Planned|In Progress|QA Review|Done)/);
    if (m && ORDER.indexOf(m[1]) > ORDER.indexOf(best)) best = m[1];
  }
  return best;
}
const implementingUnticked = cl => typeof cl === 'string' && /^\s*- \[ \] implementing/m.test(cl);

// Pure detection over a { uuid -> {ior, m} } map. No I/O, so the bite can drive it with synthetic graphs.
function audit(byUuid) {
  const get = u => byUuid.get(ref(u));
  const tasks = [...byUuid.values()].filter(x => x.ior === 'ior:class:Task');
  const fails = [], warns = [];
  for (const t of tasks) {
    const m = t.m;
    const der = deriveStatusEnum(m.statusChecklist);
    // C4 (C) SINGLE-SOURCE: the real-chain-edge predicate lives ONCE in StepEvidence; the inline copy is RETIRED so
    // this backstop and statusNext's evidence-precondition can never disagree about what "recorded" means.
    const shippedImpl = StepEvidence.evidenceForStep(get, t, 'implementing');
    const coveredByTest = StepEvidence.evidenceForStep(get, t, 'testing');
    const label = { uuid: (m.uuid || '').slice(0, 8), sprint: m.sprintName || '?', name: (m.name || '').slice(0, 50), derived: der };
    if (der === 'Planned' && shippedImpl) {
      fails.push({ ...label, reason: 'derived=Planned but chain has a SHIPPED Impl (nothing recorded, code shipped)' });
    } else if (implementingUnticked(m.statusChecklist) && shippedImpl) {
      warns.push({ ...label, reason: 'implementing[ ] but chain has a shipped Impl — verify-owner-first (shared Impl?)' });
    }
    if (coveredByTest && (der === 'Planned' || der === 'In Progress')) {
      warns.push({ ...label, reason: 'two-keyed passing Test but status<=In-Progress — verify-owner-first (shared chain?)' });
    }
  }
  return { fails, warns, scanned: tasks.length };
}

// --- stub-must-fail bite: build synthetic graphs, assert the detector behaves. Weaken audit() -> these go RED. ---
function mkMap(units) { const m = new Map(); for (const u of units) m.set(u.m.uuid, u); return m; }
const U = (ior, m) => ({ ior, m });
function runBite() {
  const asserts = [];
  const A = (cond, msg) => asserts.push({ ok: !!cond, msg });

  // Case A — MUST FLAG (fail): Planned checklist + chain reaches a shipped Impl.
  const gA = mkMap([
    U('ior:class:Task', { uuid: 'taskA', name: 'A', sprintName: 'S', statusChecklist: '- [x] Planned\n- [ ] In Progress\n  - [ ] implementing', coveredRequirements: ['ior:instance:reqA'] }),
    U('ior:class:Requirement', { uuid: 'reqA', useCases: ['ior:instance:ucA'] }),
    U('ior:class:UseCase', { uuid: 'ucA', method: 'ior:instance:mA' }),
    U('ior:class:Method', { uuid: 'mA', implementations: ['ior:instance:iA'] }),
    U('ior:class:Implementation', { uuid: 'iA', markerPending: false, tests: [] }),
  ]);
  A(audit(gA).fails.some(f => f.uuid === 'taskA'), 'A: Planned+shipped-Impl MUST be a FAIL');

  // Case B — MUST NOT flag: same shipped Impl but implementing[x] (correctly recorded).
  const gB = mkMap([
    U('ior:class:Task', { uuid: 'taskB', statusChecklist: '- [x] Planned\n- [x] In Progress\n  - [x] implementing', coveredRequirements: ['ior:instance:reqA'] }),
    U('ior:class:Requirement', { uuid: 'reqA', useCases: ['ior:instance:ucA'] }),
    U('ior:class:UseCase', { uuid: 'ucA', method: 'ior:instance:mA' }),
    U('ior:class:Method', { uuid: 'mA', implementations: ['ior:instance:iA'] }),
    U('ior:class:Implementation', { uuid: 'iA', markerPending: false, tests: [] }),
  ]);
  A(!audit(gB).fails.some(f => f.uuid === 'taskB'), 'B: correctly-recorded implementing[x] MUST NOT fail');

  // Case C — MENTION-not-WIRE must NOT count as coverage: Test names the req in prose but is not two-keyed to the Impl.
  const gC = mkMap([
    U('ior:class:Task', { uuid: 'taskC', statusChecklist: '- [x] Planned', coveredRequirements: ['ior:instance:reqC'] }),
    U('ior:class:Requirement', { uuid: 'reqC', useCases: ['ior:instance:ucC'] }),
    U('ior:class:UseCase', { uuid: 'ucC', method: 'ior:instance:mC' }),
    U('ior:class:Method', { uuid: 'mC', implementations: ['ior:instance:iC'] }),
    U('ior:class:Implementation', { uuid: 'iC', markerPending: true, tests: ['ior:instance:tOther'] }),
    // tOther is in iC.tests[] but two-keys to a DIFFERENT impl (cross-credit) + mentions reqC only in prose.
    U('ior:class:Test', { uuid: 'tOther', description: 'covers reqC per the spec', implementations: ['ior:instance:iElse'], status: 'pass' }),
  ]);
  const rC = audit(gC);
  A(!rC.warns.some(w => w.uuid === 'taskC') && !rC.fails.some(f => f.uuid === 'taskC'),
    'C: a Test that is NOT two-keyed (cross-credit / prose mention) MUST NOT count as coverage');

  // Case D — genuine two-keyed passing Test on an In-Progress task -> a WARN (verify-owner-first), not silent.
  const gD = mkMap([
    U('ior:class:Task', { uuid: 'taskD', statusChecklist: '- [x] Planned\n- [x] In Progress\n  - [x] implementing', coveredRequirements: ['ior:instance:reqD'] }),
    U('ior:class:Requirement', { uuid: 'reqD', useCases: ['ior:instance:ucD'] }),
    U('ior:class:UseCase', { uuid: 'ucD', method: 'ior:instance:mD' }),
    U('ior:class:Method', { uuid: 'mD', implementations: ['ior:instance:iD'] }),
    U('ior:class:Implementation', { uuid: 'iD', markerPending: false, tests: ['ior:instance:tD'] }),
    U('ior:class:Test', { uuid: 'tD', implementations: ['ior:instance:iD'], status: 'pass' }),
  ]);
  A(audit(gD).warns.some(w => w.uuid === 'taskD'), 'D: two-keyed passing Test + status<=In-Progress MUST WARN');

  const failed = asserts.filter(a => !a.ok);
  for (const a of asserts) console.log(`  ${a.ok ? 'PASS' : 'FAIL'}  ${a.msg}`);
  console.log(`\nBITE: ${asserts.length - failed.length}/${asserts.length} assertions passed (family: under-recorded-progress)`);
  return failed.length === 0;
}

function loadRoot(root) {
  const dir = path.join(root, 'scenario', 'index');
  const walk = d => { let o = []; for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) o.push(...walk(p)); else if (e.name.endsWith('.scenario.json')) o.push(p); } return o; };
  const m = new Map();
  for (const f of walk(dir)) { try { const j = JSON.parse(fs.readFileSync(f, 'utf8')); const mm = j.model || {}; if (mm.uuid) m.set(mm.uuid, { ior: j.ior, m: mm }); } catch { } }
  return m;
}

// --- main ---
const args = process.argv.slice(2);
if (args.includes('--bite')) {
  console.log('== checklist-chain-audit BITE (stub-must-fail: weaken the logic and these go RED) ==');
  process.exit(runBite() ? 0 : 1);
}
const report = args.includes('--report');
const root = args.find(a => !a.startsWith('--')) || '/var/dev/Workspaces/web4x/Web4RawBin';
const { fails, warns, scanned } = audit(loadRoot(root));
console.log(`== checklist-chain-audit (family: under-recorded-progress) — scanned ${scanned} tasks ==\n`);
console.log(`FAIL (${fails.length}) — derived=Planned but chain SHIPPED (confirmed under-recorded):`);
for (const f of fails) console.log(`  [${f.sprint}] ${f.uuid} derived=${f.derived} | ${f.name} | ${f.reason}`);
console.log(`\nWARN (${warns.length}) — verify-owner-first (shared-chain possible, NOT confirmed):`);
for (const w of warns) console.log(`  [${w.sprint}] ${w.uuid} derived=${w.derived} | ${w.name} | ${w.reason}`);
if (report) process.exit(0);
if (fails.length) { console.log(`\n✗ ${fails.length} confirmed under-recorded-progress task(s) — tick the checklist to measured reality (let status derive).`); process.exit(1); }
console.log('\n✓ no CURRENTLY under-recorded-progress (FAIL tier empty).');
console.log('  NOTE: FAIL=0 = clean RIGHT NOW, NOT proof the family never occurred. Known instances');
console.log('  (S37 C2/C6, 2026-08-11) were RECONCILED honestly to In-Progress (70123010e/5172291fc),');
console.log('  not born clean — this guard exists because the class is real and recurs.');
process.exit(0);
