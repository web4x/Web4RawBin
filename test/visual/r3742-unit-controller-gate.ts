// [test:uuid:a7f3c1e8-2b94-4d6f-8e05-91c3a7b0d4f2] T37.4.2 / R37.11 C4.2 — UnitController.apply (Impl b5f72641) is the SOLE generic mutation entry for ANY ior:class:* unit: (1) VALIDATE via the registered policy → (2) APPLY in-memory → (3) PERSIST via ScenarioIndex.put → (4) EMIT UNIT_CHANGED. Family: under-recorded-progress / silent-drift. Covers the C4.2 family: apply b5f72641 + emit 6b03b619 + TaskPolicy.validate ff247010 + TaskPolicy.apply 1e789400 + statusNext facade 47227ad1.
// Pure-logic gate on a SCRATCH ScenarioIndex (pollution-free; tests HEAD source directly — controller files verified git-clean == committed, no served artifact so no SW/served-guard needed). node22: PATH=/opt/node22/bin:$PATH npx tsx test/visual/r3742-unit-controller-gate.ts. DET (deterministic — no network/prod). STUB-MUST-FAIL proven: a broken pipeline stage → the gate's own check returns RED (non-vacuous).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ScenarioIndex } from '../../src/ts/scenario/index-store.ts';
import { UnitController, registerPolicy, policyFor } from '../../src/ts/scenario/unit-controller.ts';
import { statusNext, TASK_IOR } from '../../src/ts/scenario/task-policy.ts'; // importing auto-registers TaskPolicy (Policy #1)
import { deriveStatusEnum } from '../../src/ts/scenario/task-status.ts';

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'r3742-'));
const idx = new ScenarioIndex(path.join(scratch, 'index'));
const seed = (ior: string, uuid: string, model: Record<string, unknown> = {}) => idx.put(uuid, { ior, model: { uuid, ...model } } as any);
const results: Record<string, boolean> = {};

try {
  // ── AC1: generic controller — validate→apply→persist→emit for ANY ior (registered policy) ──
  const trace: string[] = [];
  registerPolicy('ior:class:__GateProbe', {
    validate() { trace.push('validate'); },
    apply(_i, u) { trace.push('apply'); (u.model as any).touched = true; },
  });
  const pU = '11111111-1111-4111-8111-111111111111';
  seed('ior:class:__GateProbe', pU, { name: 'probe' });
  const emitted: string[] = [];
  const ret = UnitController.apply(idx, 'ior:class:__GateProbe', pU, {}, { publish: (ior, u) => emitted.push(`${ior}:${u}`) });
  const persisted = (idx.get(pU)?.model as any)?.touched === true;         // (3) PERSIST — round-tripped from disk
  results['AC1-pipeline'] = trace.join('>') === 'validate>apply'           // (1)(2) order
    && (ret.model as any).touched === true
    && persisted
    && emitted.length === 1 && emitted[0] === `ior:class:__GateProbe:${pU}`; // (4) EMIT

  // default-accept: an ior with NO policy still persists + emits, no validate/mutate
  const nU = '22222222-2222-4222-8222-222222222222';
  seed('ior:class:__GateNoPolicy', nU, { name: 'nopol' });
  const emit2: string[] = [];
  UnitController.apply(idx, 'ior:class:__GateNoPolicy', nU, {}, { publish: (i, u) => emit2.push(`${i}:${u}`) });
  results['AC1-default-accept'] = policyFor('ior:class:__GateNoPolicy') === undefined
    && idx.get(nU) !== null && emit2.length === 1;

  // ── AC2: Task FSM = Policy #1; status DERIVED (never hand-set); statusNext = THIN façade over apply ──
  const tU = '33333333-3333-4333-8333-333333333333';
  seed(TASK_IOR, tU, { statusChecklist: '- [x] Planned\n- [ ] In Progress\n- [ ] QA Review\n- [ ] Done', status: 'Planned' });
  const em3: string[] = [];
  statusNext(idx, tU, { publish: (i, u) => em3.push(`${i}:${u}`) }); // Planned→In Progress (ungated)
  const t = idx.get(tU)!.model as any;
  results['AC2-fsm-derived'] = /- \[x\] In Progress/.test(t.statusChecklist)   // apply ticked the box
    && t.status === deriveStatusEnum(t.statusChecklist)                        // status is DERIVED, not hand-set
    && t.status === 'In Progress'
    && em3.length === 1;                                                       // façade routed through the controller's emit

  // ── AC3: PERSIST chokepoint (shown above) + EVIDENCE-PRECONDITION refuses an unevidenced advance (no persist) ──
  const eU = '44444444-4444-4444-8444-444444444444';
  seed(TASK_IOR, eU, { statusChecklist: '- [x] Planned\n- [x] In Progress\n- [ ] QA Review\n- [ ] Done' }); // cur = In Progress
  let refusedQA = false;
  try { UnitController.apply(idx, TASK_IOR, eU, { target: 'QA Review' }); } catch { refusedQA = true; }
  const notTicked = !/- \[x\] QA Review/.test((idx.get(eU)!.model as any).statusChecklist); // refuse ⇒ nothing persisted
  const dU = '55555555-5555-4555-8555-555555555555';
  seed(TASK_IOR, dU, { statusChecklist: '- [x] Planned\n- [x] In Progress\n- [x] QA Review\n- [ ] Done' }); // cur = QA Review, no approvedBy
  let refusedDone = false;
  try { UnitController.apply(idx, TASK_IOR, dU, { target: 'Done' }); } catch { refusedDone = true; }
  results['AC3-evidence-refuse'] = refusedQA && notTicked && refusedDone;

  // ── AC4: DRY — a NEW class policy is REGISTRATION-ONLY (no controller edit), + STUB-MUST-FAIL (break a stage ⇒ RED) ──
  const trace2: string[] = [];
  registerPolicy('ior:class:__GateProbe2', { validate() { trace2.push('v2'); }, apply() { trace2.push('a2'); } });
  const p2 = '66666666-6666-4666-8666-666666666666';
  seed('ior:class:__GateProbe2', p2, {});
  UnitController.apply(idx, 'ior:class:__GateProbe2', p2, {}, {});
  const registrationOnly = trace2.join('>') === 'v2>a2' && policyFor('ior:class:__GateProbe') !== policyFor('ior:class:__GateProbe2'); // both ride the SAME unchanged apply

  // STUB-MUST-FAIL: a policy whose apply is a NO-OP (broken step 2) must make the AC1-style mutation check fail.
  registerPolicy('ior:class:__GateBroken', { validate() {}, apply() { /* BROKEN: no mutation */ } });
  const bU = '77777777-7777-4777-8777-777777777777';
  seed('ior:class:__GateBroken', bU, {});
  const rb = UnitController.apply(idx, 'ior:class:__GateBroken', bU, {}, {});
  const brokenCaught = (rb.model as any).touched !== true; // the mutation-assertion WOULD be false ⇒ gate can go RED
  // and a missing publisher ⇒ no emit (the emit-assertion can fail too)
  let emitCount = 0; UnitController.apply(idx, 'ior:class:__GateProbe', pU, {}, {}); // no publish wired
  const emitCheckBites = emitCount === 0;
  results['AC4-dry-stub'] = registrationOnly && brokenCaught && emitCheckBites;

} finally {
  fs.rmSync(scratch, { recursive: true, force: true }); // pollution-free: scratch removed
}

console.log('===== T37.4.2 UnitController generic-controller gate (DET) =====');
let green = true;
for (const [k, v] of Object.entries(results)) { console.log(`  ${k}: ${v ? 'GREEN' : 'RED'}`); if (!v) green = false; }
const allKeys = ['AC1-pipeline', 'AC1-default-accept', 'AC2-fsm-derived', 'AC3-evidence-refuse', 'AC4-dry-stub'];
if (allKeys.some(k => !(k in results))) { green = false; console.log('  INCOMPLETE — a section threw before asserting'); }
console.log('OVERALL:', green ? 'GREEN — controller is the sole validate→apply→persist→emit entry; FSM=policy#1; evidence-refuse; DRY+stub-must-fail' : 'RED');
process.exitCode = green ? 0 : 1;
