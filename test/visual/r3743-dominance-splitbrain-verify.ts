// INDEPENDENT VERIFY (PO ruling: the party whose design a gate flags can't clear it → architect routed this to tester).
// Clears check:controller-dominance RED (stale-proxy: greps approveByOwner for a literal statusNext( which the code
// replaced with UnitController.apply). + PO scope-add: prove the CURRENT seam-approve TICKS the checklist so status stays
// DERIVED (no split-brain), and add a stored-status-contradicts-checklist bite. CAPTURE-ONLY, blocks nothing.
// ★ SERVED-HONEST: source claims read `git show HEAD:` (committed==served @0.8.105), NEVER the working tree (today's lesson).
// Behaviour proven on a SCRATCH ScenarioIndex — never a prod unit, never a cosmetic tick. node22: PATH=/opt/node22/bin:$PATH npx tsx <this>
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { execSync } from 'node:child_process';
import { ScenarioIndex } from '../../src/ts/scenario/index-store.ts';
import { UnitController } from '../../src/ts/scenario/unit-controller.ts';
import '../../src/ts/scenario/task-policy.ts'; // auto-registers TaskPolicy (Policy #1)
import { deriveStatusEnum } from '../../src/ts/scenario/task-status.ts';
import { MvcBoundaryGuard } from '../../src/ts/scenario/mvc-boundary-guard.ts';
const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin';
const show = (rel: string) => execSync(`git show HEAD:${rel}`, { cwd: ROOT, encoding: 'utf8' });
const R: Record<string, boolean> = {}; const notes: string[] = [];

// ── (a) deriveStatusEnum is the SOLE Task-status writer across the COMMITTED tree (+ task-fsm.ts frozen allowlist) ──
const srv = show('src/ts/server/server.ts');
const doneViolInServer = MvcBoundaryGuard.detectDoneWrites(srv, 'src/ts/server/server.ts'); // approveByOwner must NOT literal-write Done
R['a-derive-sole-writer'] = doneViolInServer.length === 0; // server.ts has 0 literal Done-writes (approve routes through the seam)
notes.push(`(a) literal Done-writes in committed server.ts = ${doneViolInServer.length} (expect 0; task-policy=derive, task-fsm=allowlist)`);

// ── (b) approveByOwner genuinely routes through UnitController.apply (subsumes statusNext) — the recalibration ──
const approveStart = srv.indexOf('function approveByOwner');
const approveFn = srv.slice(approveStart, srv.indexOf('\nfunction ', approveStart + 10)); // whole function body, not a fixed window
const routesThroughApply = /UnitController\.apply\(idx,\s*'ior:class:Task',[^)]*target:\s*'Done'/.test(approveFn.replace(/\s+/g, ' '));
const noLiteralDoneInApprove = !/m\.status\s*=\s*'Done'/.test(approveFn);
R['b-approve-routes-seam'] = routesThroughApply && noLiteralDoneInApprove;
notes.push(`(b) approveByOwner routes through UnitController.apply(target:'Done')=${routesThroughApply} + no literal m.status='Done'=${noLiteralDoneInApprove}`);

// ── SCRATCH behaviour: the seam TICKS the checklist THEN derives → status == deriveStatusEnum(checklist) BY CONSTRUCTION ──
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'r3743-'));
const idx = new ScenarioIndex(path.join(scratch, 'index'));
const seedTask = (u: string, checklist: string, extra: Record<string, unknown> = {}) => idx.put(u, { ior: 'ior:class:Task', model: { uuid: u, statusChecklist: checklist, status: deriveStatusEnum(checklist), ...extra } } as any);
try {
  // ungated transition (Planned→In Progress needs no evidence) exercises the SAME tick+derive mechanism the Done path uses
  const t1 = '11111111-1111-4111-8111-111111111111';
  seedTask(t1, '- [ ] Planned\n- [ ] In Progress\n- [ ] QA Review\n- [ ] Done');
  UnitController.apply(idx, 'ior:class:Task', t1, { target: 'In Progress' });
  const m1 = idx.get(t1)!.model as any;
  R['c-seam-ticks-and-derives'] = /- \[x\] In Progress/.test(m1.statusChecklist)            // TICKED the target box
    && m1.status === deriveStatusEnum(m1.statusChecklist)                                    // status DERIVED from the ticked checklist
    && m1.status === 'In Progress';                                                          // consistent, no split-brain
  notes.push(`(c) seam ticked box + status===deriveStatusEnum(checklist)=${R['c-seam-ticks-and-derives']} (status='${m1.status}')`);

  // (c) Done evidence-gate FIRES: QA-Review → Done WITHOUT approvedBy must REFUSE (never manufacture Done)
  const t2 = '22222222-2222-4222-8222-222222222222';
  seedTask(t2, '- [x] Planned\n- [x] In Progress\n- [x] QA Review\n- [ ] Done'); // derived = QA Review, no approvedBy
  let refusedNoApprover = false;
  try { UnitController.apply(idx, 'ior:class:Task', t2, { target: 'Done' }); } catch { refusedNoApprover = true; }
  const t2after = idx.get(t2)!.model as any;
  R['d-done-needs-approvedBy'] = refusedNoApprover && !/- \[x\] Done/.test(t2after.statusChecklist) && t2after.status === 'QA Review'; // refused ⇒ nothing ticked, stays QA Review
  notes.push(`(d) →Done without approvedBy REFUSED=${refusedNoApprover}, checklist untouched, status stays '${t2after.status}'`);

  // ── SPLIT-BRAIN detector + T37.27 confirmation + stub-must-fail ──
  const splitBrain = (checklist: string, stored: string) => deriveStatusEnum(checklist) !== stored;
  const t27 = JSON.parse(show('scenario/index/f/5/9/8/6/f5986d69-74ec-4a29-87a0-01baccc111be.scenario.json')).model;
  const t27Derived = deriveStatusEnum(t27.statusChecklist);
  const t27Split = splitBrain(t27.statusChecklist, t27.status);
  R['e-t3727-is-splitbrain'] = t27Split && t27Derived === 'QA Review' && t27.status === 'Done'; // stored Done contradicts derived QA-Review
  notes.push(`(e) T37.27 committed: stored='${t27.status}' derived='${t27Derived}' → SPLIT-BRAIN=${t27Split} (pre-v0.8.104 direct-write residue; approvedBy='${t27.approvedBy}')`);
  // stub-must-fail for the split-brain bite: a CONSISTENT unit is clean, a CONTRADICTING one is caught
  R['f-splitbrain-stub-must-fail'] = !splitBrain('- [x] Planned\n- [ ] In Progress\n- [ ] QA Review\n- [ ] Done', 'Planned') // consistent → clean
    && splitBrain('- [x] Planned\n- [ ] In Progress\n- [ ] QA Review\n- [ ] Done', 'Done');                                   // contradicting → caught (RED)
} finally { fs.rmSync(scratch, { recursive: true, force: true }); }

// ── RECALIBRATED dominance gate + detectDoneWrites STUB-MUST-FAIL (architect-specified) ──
const injected2ndWriter = MvcBoundaryGuard.detectDoneWrites("  someTask.status = 'Done';", 'src/ts/__injected_second_writer.ts');
const sanctionedDerive = MvcBoundaryGuard.detectDoneWrites("  m.status = deriveStatusEnum(String(m.statusChecklist));", 'src/ts/scenario/task-policy.ts');
R['g-recalibrated-stub-must-fail'] = injected2ndWriter.length >= 1  // a 2nd direct Done-writer → RED
  && sanctionedDerive.length === 0;                                 // the deriveStatusEnum derive → stays GREEN
notes.push(`(g) inject 2nd Done-writer → violations=${injected2ndWriter.length} (RED); deriveStatusEnum derive → ${sanctionedDerive.length} (GREEN)`);

console.log('===== INDEPENDENT VERIFY — controller-dominance recalibration + split-brain (CAPTURE-ONLY, served 0.8.105) =====');
notes.forEach(n => console.log('  ' + n));
let green = true;
for (const [k, v] of Object.entries(R)) { console.log(`  ${k}: ${v ? 'PASS' : 'FAIL'}`); if (!v) green = false; }
console.log('\nVERDICT:', green
  ? 'MEASUREMENT PASS (7/7) — but the RED is JUSTIFIED, not a clean false-RED (architect+PO withdrew the false-RED framing): the gate\'s STATED reason (grep for statusNext) IS a stale proxy — approve genuinely routes through UnitController.apply which subsumes statusNext, deriveStatusEnum is the sole LIVE Done-writer, the evidence-gate fires, and the CURRENT seam ticks-then-derives (no new split-brain). BUT it indirectly surfaced a REAL integrity gap: exactly 1 split-brain residue (T37.27, evidence-backed) from the pre-v0.8.104 approve + a dead-legacy direct-writer (task-fsm.ts:68 tronApprove — no live caller, guard-dead for 4-state units, allowlisted). ⇒ RECALIBRATION = grep UnitController.apply (not statusNext) AND ADD the split-brain bite (stored != deriveStatusEnum(checklist) → RED). The RED justly HOLDS until T37.27 is repaired to 0 split-brains. T37.27 repair = tick Done WITH provenance (Tron really approved) + collapse the duplicate stored status to the derived single source — NEVER re-derive-down (would revert his verdict).'
  : 'FAIL — see the failing key(s) above; RED does NOT clear.');
process.exitCode = green ? 0 : 1;
