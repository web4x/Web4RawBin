// [test:uuid:5c1e9a37-8b42-4d6f-9e03-a7f21c845b9d] T37.4.1 / R37.11 C4.1 — SelfHeal.selfHealOnRead (Impl 79f2dec1) read-side self-heal: a READ recomputes a Task's DERIVED status from its checklist (single source deriveStatusEnum), so a stored status that has DRIFTED from the checklist is corrected on read — a read NEVER returns a silently-wrong value (C2/C6: status stored 'Planned' while the chain had shipped). INERT when stored==derived. + STUB-MUST-FAIL. DISTINCT intent from the R19.90/R29.1 selfHeal Tests (prose-collision, different owners) — this asserts the Task status-from-checklist recompute on 79f2dec1.
// Pure-logic tsx bite — deterministic, NO served artifact ⇒ no SW/served-guard needed (stated per the rule's scope). node22: PATH=/opt/node22/bin:$PATH npx tsx test/visual/r3741-selfheal-onread-gate.ts
import { selfHealOnRead, registerSelfHeal } from '../../src/ts/scenario/self-heal.ts';
import '../../src/ts/scenario/task-policy.ts'; // side-effect: registers the Task self-heal healer (C4.1, Task = healer #1)
import { deriveStatusEnum } from '../../src/ts/scenario/task-status.ts';

const results: Record<string, boolean> = {};
const checklist = '- [x] Planned\n- [x] In Progress\n- [x] QA Review\n- [ ] Done';
const derived = deriveStatusEnum(checklist); // the reality the checklist implies (expect 'QA Review')

// ── (1) DRIFT → RECOMPUTE-TO-REALITY: stored status 'Planned' disagrees with the checklist ──
const drifted: any = { ior: 'ior:class:Task', model: { uuid: 't-drift', statusChecklist: checklist, status: 'Planned' } };
selfHealOnRead(drifted);
results['drift-recomputed'] = drifted.model.status === derived && derived !== 'Planned'; // corrected to reality, not the stale stored value

// ── (2) AGREE → INERT: stored status already equals the derived → read leaves it byte-unchanged ──
const agreed: any = { ior: 'ior:class:Task', model: { uuid: 't-agree', statusChecklist: checklist, status: derived, extra: 'keep' } };
const before = JSON.stringify(agreed.model);
selfHealOnRead(agreed);
results['inert-when-agree'] = agreed.model.status === derived && JSON.stringify(agreed.model) === before;

// ── (3) NO-HEALER ior → pass-through untouched (heal only fires for a registered ior) ──
const noHealer: any = { ior: 'ior:class:__NoHealer', model: { uuid: 'nh', statusChecklist: checklist, status: 'Planned' } };
selfHealOnRead(noHealer);
results['no-healer-passthrough'] = noHealer.model.status === 'Planned'; // untouched (no healer registered)

// ── (4) STUB-MUST-FAIL: a healer that does NOT recompute leaves the drift → proves (1)'s recompute-assertion is non-vacuous ──
registerSelfHeal('ior:class:__SelfHealStub', () => { /* BROKEN: no recompute */ });
const stubDrift: any = { ior: 'ior:class:__SelfHealStub', model: { uuid: 't-stub', statusChecklist: checklist, status: 'Planned' } };
selfHealOnRead(stubDrift);
results['stub-must-fail'] = stubDrift.model.status === 'Planned'; // broken healer left the drift uncorrected → if the REAL Task healer were this broken, (1) would go RED

console.log('===== T37.4.1 selfHealOnRead recompute-on-read bite (DET) =====');
console.log(`  derived(checklist) = '${derived}'`);
let green = true;
for (const [k, v] of Object.entries(results)) { console.log(`  ${k}: ${v ? 'GREEN' : 'RED'}`); if (!v) green = false; }
const need = ['drift-recomputed', 'inert-when-agree', 'no-healer-passthrough', 'stub-must-fail'];
if (need.some((k) => !(k in results))) { green = false; console.log('  INCOMPLETE'); }
console.log('OVERALL:', green ? 'GREEN — a read recomputes drifted status to reality, INERT when agreed, non-vacuous (stub-must-fail)' : 'RED');
process.exitCode = green ? 0 : 1;
