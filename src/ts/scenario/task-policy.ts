/**
 * C4 POLICY #1 — the Task FSM as a registered UnitController policy (design c4-mvc-view-pipeline-shape.md, architect
 * rulings 2026-08-11). ONE nested-canonical representation: model.status is the 4-state deriveStatusEnum(statusChecklist)
 * (Planned → In Progress → QA Review → Done). This policy NEVER writes model.status directly — apply ticks the CHECKLIST
 * and deriveStatusEnum is the SOLE 4-state writer (MvcBoundaryGuard enforces that). The flat 7-state task-fsm strings
 * are retired as a write target; task-fsm's TRANSITIONS + guardTransition survive as this policy's step-LEGALITY only.
 *
 * EVIDENCE-GATE (architect ruling 3): each advance is gated on THAT step's real chain-edge via the shared
 * StepEvidence.evidenceForStep — NOT a hardcoded map. Planned→In Progress: ungated (work starts). In Progress→QA Review:
 * 'testing' (a two-keyed passing Test — the strongest In-Progress sub-step, which implies implementing). QA Review→Done:
 * the Tron VERDICT (model.approvedBy, recorded by R40.10 approve which DELEGATES here) — NOT 'testing' (already gated at
 * QA-Review entry). A box ticked without its evidence corrupts the exact QA signal Tron steers by → refuse, fail-loud.
 */
import { ScenarioIndex } from './index-store.js';
import type { ScenarioUnit } from './types.js';
import { deriveStatusEnum, PROCESSING_CR_SUBSTEP, type TaskStatusEnum } from './task-status.js';
import { StepEvidence, type EvidenceStep, type ResolveRef } from './step-evidence.js';
import { UnitController, registerPolicy, type UnitPolicy, type UnitIntent, type PublishFn } from './unit-controller.js';
import { registerSelfHeal } from './self-heal.js'; // C4.1 self-heal on read (Task healer registers below)

export const TASK_IOR = 'ior:class:Task';
// The ONE canonical 4-state order (In Progress subsumes the task-fsm impl/testing sub-steps). This IS the re-expressed
// task-fsm TRANSITIONS/guardTransition legality (linear collapse) — the policy's internal step-legality.
const STATE_ORDER: TaskStatusEnum[] = ['Planned', 'In Progress', 'QA Review', 'Done'];
// Per-advance chain-edge gate (architect FINAL ruling): the target state → the evidence kind entering it requires.
// In Progress→QA Review = 'implementing' (shipped Impl); QA Review→Done = 'testing' (two-keyed passing Test) AND
// (separately) model.approvedBy = the Tron verdict — Done needs BOTH: can't approve untested work (ties R-C9 doneBasis).
const EVIDENCE_GATE: Partial<Record<TaskStatusEnum, EvidenceStep>> = { 'QA Review': 'implementing', 'Done': 'testing' };

const bare = (r: unknown): string => String(r ?? '').replace('ior:instance:', '').split('@')[0];
const resolver = (idx: ScenarioIndex): ResolveRef => (ref) => { const u = idx.get(bare(ref)); return u ? { ior: u.ior, m: u.model as Record<string, unknown> } : undefined; };
function currentState(unit: ScenarioUnit): TaskStatusEnum { return deriveStatusEnum(String((unit.model as Record<string, unknown>).statusChecklist ?? '')); }

/** guardTransition re-expressed over the 4-state order: the sole legal advance is cur→cur+1; a named target must equal it. */
function legalNext(cur: TaskStatusEnum, target?: TaskStatusEnum): TaskStatusEnum {
  const to = STATE_ORDER[STATE_ORDER.indexOf(cur) + 1];
  if (!to) throw new Error(`TaskPolicy: '${cur}' is terminal — no advance`);
  if (target && target !== to) throw new Error(`TaskPolicy: illegal skip ${cur}→${target} (only ${cur}→${to} is legal)`);
  return to;
}

/** Tick the target's top-level checklist box (- [ ] Target → - [x] Target); append it ticked if the box is absent. */
function tickBox(checklist: string, target: TaskStatusEnum): string {
  const re = new RegExp(`^(\\s*- \\[) \\](\\s*${target}\\b.*)$`, 'm');
  if (re.test(checklist)) return checklist.replace(re, '$1x]$2');
  return `${checklist.replace(/\s*$/, '')}\n- [x] ${target}`;
}

/** UN-tick a top-level box (- [x] Target → - [ ] Target); no-op if it isn't ticked. The reopen inverse of tickBox — so a
 * decline stays DERIVED (untick QA Review/Done → deriveStatusEnum recomputes to In Progress), never a direct status write. */
function untickBox(checklist: string, target: TaskStatusEnum): string {
  const re = new RegExp(`^(\\s*- \\[)[xX]\\](\\s*${target}\\b.*)$`, 'm');
  return re.test(checklist) ? checklist.replace(re, '$1 ]$2') : checklist;
}

// R40.59 (T40.1 decline-band): INSERT the OPEN processing-CR sub-step so a declined QA-Review/Done task derives the
// 'QA-Review-with-open-CR' band (NOT In Progress). IDEMPOTENT — no-op if the sub-step already exists (open OR resolved),
// so a re-run never double-inserts. Placed under the QA Review line for readability (position is irrelevant to the
// derivation — deriveStatusEnum ignores indented lines; hasOpenCrSubstep scans anywhere), else appended.
function insertOpenCrSubstep(checklist: string): string {
  if (new RegExp(`^\\s+-\\s*\\[[ xX]\\]\\s*${PROCESSING_CR_SUBSTEP}\\b`, 'im').test(checklist)) return checklist;
  const sub = `  - [ ] ${PROCESSING_CR_SUBSTEP}`;
  const lines = checklist.split('\n');
  const qaIdx = lines.findIndex((l) => /^-\s*\[[ xX]\]\s*QA Review\b/i.test(l));
  if (qaIdx >= 0) { lines.splice(qaIdx + 1, 0, sub); return lines.join('\n'); }
  return `${checklist.replace(/\s*$/, '')}\n${sub}`;
}

// R40.18 sub-step primitive (found by USING the design — the agent-status skill needs it; without it agents are forced
// into the hand-edits the mutation-seam lint now outlaws). The In-Progress sub-steps: informational progress markers UNDER
// the 'In Progress' state. deriveStatusEnum reads ONLY the 4 top-level state boxes, so ticking a sub-step KEEPS the state.
const IN_PROGRESS_SUBSTEPS = ['refinement', 'creating test cases', 'implementing', 'testing'];
const escRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Tick an INDENTED sub-step box (  - [ ] implementing →   - [x] implementing). Throws if the named box is absent. */
function tickSubStep(checklist: string, sub: string): string {
  const re = new RegExp(`^(\\s+- \\[) \\](\\s*${escRe(sub)}\\b.*)$`, 'm'); // \\s+ = the indent that distinguishes a sub-step from a top-level state box
  if (re.test(checklist)) return checklist.replace(re, '$1x]$2');
  throw new Error(`TaskPolicy: sub-step '${sub}' box not found in the checklist (cannot tick an absent sub-step)`);
}

export const TaskPolicy: UnitPolicy = {
  // [impl:uuid:ff247010-40ce-44be-99f4-a776c20257b2] TaskPolicy.validate — step-legality (re-expressed task-fsm TRANSITIONS/guardTransition) +
  // evidenceForStep precondition (5021456d). Refuses illegal skips AND advancing past a step whose chain-edge is absent.
  validate(idx: ScenarioIndex, unit: ScenarioUnit, intent: UnitIntent): void {
    if (intent.makeCurrent) { // R40.49 (Tron: "reviewing IS working" — the QA-Review restriction was OUR invented policy
      // T37.26/v0.8.105, never his directive; architect R40.44-REVERSAL 5c330e44d): the explicit tap DESIGNATES this task
      // as current for ANY status — NO status gate (the throw removed). Validity (through QA-Review, expiring at Done /
      // re-designation) is enforced at READ time in getThreeSlots + observed at the Done transition (StaleSteerLog,
      // BITE-6b). The reopen / subStep / evidence-gate / Done-requires-approvedBy validations below STAY (genuine invariants).
      return;
    }
    if (intent.reopen) { // (5a) decline → send a QA-Review/Done task BACK to In Progress via a CHECKLIST EDIT (untick), status stays DERIVED
      const cur = currentState(unit);
      if (cur !== 'QA Review' && cur !== 'Done') throw new Error(`TaskPolicy: cannot reopen a '${cur}' task — only a QA-Review or Done task can be sent back to In Progress.`);
      return;
    }
    if (intent.subStep !== undefined) { // R40.18: a sub-step tick is NOT a state advance — validate the named box, no legalNext/evidence gate (the evidence gate applies at the In Progress→QA Review state advance)
      const sub = String(intent.subStep);
      // R40.1 CR-RESOLVE (#86): the band's 'processing change requests' sub-step is resolved on a QA-Review-with-open-CR
      // (BAND) task, NOT In-Progress — a human ticking it (CRs done) → hasOpenCrSubstep goes false → deriveStatusEnum
      // recomputes to clean 'QA Review' → approvable. Reuses the SAME generic tickSubStep seam (apply below); the only
      // difference is the eligible state. NEVER auto-ticked (this validate fires only on an explicit owner resolve-cr).
      if (sub === PROCESSING_CR_SUBSTEP) {
        if (currentState(unit) !== 'QA-Review-with-open-CR') throw new Error(`TaskPolicy: '${PROCESSING_CR_SUBSTEP}' can only be resolved on a QA-Review-with-open-CR (band) task (current: ${currentState(unit)})`);
        return;
      }
      if (!IN_PROGRESS_SUBSTEPS.includes(sub)) throw new Error(`TaskPolicy: unknown sub-step '${sub}' (valid: ${IN_PROGRESS_SUBSTEPS.join(', ')})`);
      if (currentState(unit) !== 'In Progress') throw new Error(`TaskPolicy: sub-step '${sub}' requires state 'In Progress' (current: ${currentState(unit)})`);
      return;
    }
    const cur = currentState(unit);
    const to = legalNext(cur, intent.target as TaskStatusEnum | undefined);
    const need = EVIDENCE_GATE[to];
    if (need && !StepEvidence.evidenceForStep(resolver(idx), { ior: unit.ior, m: unit.model as Record<string, unknown> }, need))
      throw new Error(`TaskPolicy: REFUSED ${cur}→${to} — '${need}' evidence absent (no two-keyed passing Test on the chain). A box ticked without evidence corrupts Tron's QA signal.`);
    if (to === 'Done' && !(intent.approvedBy || (unit.model as Record<string, unknown>).approvedBy)) // R40.45 AC-2 ATOMIC: accept the verdict from the SAME intent (no pre-persist); a refused Done throws here → nothing written
      throw new Error(`TaskPolicy: REFUSED ${cur}→Done — no approvedBy verdict (Done requires the owner's QA sign-off; R40.10 approve delegates it as evidence).`);
  },
  // [impl:uuid:1e789400-8e25-4957-b0d6-f9429f174184] TaskPolicy.apply — TICKS the next checklist box, then model.status = deriveStatusEnum (the SOLE
  // 4-state writer). NEVER writes a flat 7-state or a literal status string (MvcBoundaryGuard enforces this structurally).
  apply(idx: ScenarioIndex, unit: ScenarioUnit, intent: UnitIntent): void {
    const m = unit.model as Record<string, unknown>;
    if (intent.makeCurrent) { // R40.49 (architect R40.44-REVERSAL 5c330e44d, PO (c)): the explicit tap DESIGNATES ONLY — it
      // does NOT auto-advance status (a Planned tapped-current STAYS Planned; a QA-Review tapped-current STAYS QA-Review —
      // "reviewing IS working"). Coupling designate+start = the two-mechanism drift we killed (R40.50 / sprint-dirs). The
      // designation itself (singleton.currentTaskUuid, written by the make-current handler) makes it current via getThreeSlots
      // EXPLICIT-WINS. Stamp recency only (no status change) so the derived fallback still ranks it after the designation expires.
      m.lastAdvancedAt = new Date().toISOString();
      m.lastAdvancedAtSource = 'seam';
      return;
    }
    if (intent.reopen) { // (5a→R40.59 BAND→fe495e32d) decline: KEEP QA Review [x], layer the OPEN processing-CR sub-step so
      // deriveStatusEnum derives the BAND 'QA-Review-with-open-CR'. ★ FIX (architect fe495e32d, Tron AC "QA Review stays [x]"):
      // a decline NEVER unticks QA Review. The earlier untick MASKED the regression — the band read right while the AUTHORED
      // QA-Review box had regressed to [ ] (weaker-property substitution: we asserted the DERIVED band, not the authored state
      // it derives from). Now: untick ONLY Done (a declined Done returns to the band, not stays Done); ENSURE QA Review [x];
      // then insert the open sub-step so the band layers on TOP of a ticked QA Review — the SOLE writer, NO direct m.status.
      let cl = String(m.statusChecklist ?? '');
      cl = untickBox(cl, 'Done');      // a declined Done returns to the band; QA Review is NEVER unticked
      cl = tickBox(cl, 'QA Review');    // ★ QA Review STAYS [x] (Tron AC) — idempotent ensure (was: untickBox = the masked regress)
      cl = insertOpenCrSubstep(cl);    // the open sub-step lifts the QA-Review [x] checklist into the 'QA-Review-with-open-CR' band
      m.statusChecklist = cl;
      m.status = deriveStatusEnum(cl); // sole status writer — derives the band from the edited checklist (single-source)
      if (intent.addChangeRequest) { // ride the decline's CR-link in the SAME seam transaction (get() re-reads disk, so a separate push would be lost)
        const arr = Array.isArray(m.changeRequests) ? (m.changeRequests as string[]) : [];
        arr.push(String(intent.addChangeRequest)); m.changeRequests = arr;
      }
      return;
    }
    if (intent.subStep !== undefined) { // R40.18: tick the NAMED In-Progress sub-step, KEEP the state, stamp + emit (seam)
      let cl = tickSubStep(String(m.statusChecklist ?? ''), String(intent.subStep));
      // R40.1 CR-RESOLVE (#86): resolving the processing-CR sub-step returns the task to CLEAN 'QA Review' (approvable) —
      // ticking the sub-step clears hasOpenCrSubstep → deriveStatusEnum recomputes to 'QA Review'. Since fe495e32d the decline
      // KEEPS QA Review [x] (never unticks), so this re-tick is now an IDEMPOTENT belt-and-braces ENSURE (QA Review is already
      // [x]); it also stays robust if any other path left it unticked. (An In-Progress sub-step tick keeps its state → no re-tick.)
      if (String(intent.subStep) === PROCESSING_CR_SUBSTEP) cl = tickBox(cl, 'QA Review');
      m.statusChecklist = cl;
      m.status = deriveStatusEnum(cl); // SOLE writer — recompute from the edited checklist (no status literal)
      m.lastAdvancedAt = new Date().toISOString();
      m.lastAdvancedAtSource = 'seam';
      return;
    }
    const to = legalNext(currentState(unit), intent.target as TaskStatusEnum | undefined);
    // R40.45 AC-2 ATOMIC VERDICT: fold the owner's QA verdict INTO this same transaction. validate() already gated above
    // (a refused advance threw before here → NOTHING is written or persisted); apply writes the verdict WITH the advance,
    // and UnitController persists ONCE. So a refused Done never leaves approvedBy on disk (the old persist-then-throw leak).
    if (intent.approvedBy) {
      m.approvedBy = intent.approvedBy;
      if (intent.approvedByName != null) m.approvedByName = intent.approvedByName;
      m.approvedAt = intent.approvedAt ?? new Date().toISOString();
      if (intent.approvedIntegrity != null) m.approvedIntegrity = intent.approvedIntegrity;
    }
    m.statusChecklist = tickBox(String(m.statusChecklist ?? ''), to);
    m.status = deriveStatusEnum(String(m.statusChecklist)); // the ONE sanctioned 4-state writer
    // R40.18: STAMP the advance time as a CONSEQUENCE of the advance — SEAM-WRITTEN, never a caller intent (apply reads
    // only intent.target; a caller CANNOT express lastAdvancedAt). Omission-proof by the binding mutation-seam lint: a Task
    // cannot advance except through this policy, which always stamps. This is RECENCY metadata for the pin predicate
    // (current = the In-Progress task with the MAX lastAdvancedAt) — NOT status: deriveStatusEnum stays the SOLE status
    // source and NEVER reads this field (guarded by check-recency-not-status). Source='seam' distinguishes a live stamp
    // from a git-backfilled one (honesty metadata, read by humans/audits, never by the ranking).
    m.lastAdvancedAt = new Date().toISOString();
    m.lastAdvancedAtSource = 'seam';
  },
};

// [impl:uuid:47227ad1-f00a-4337-bc0d-8e63a34b1b26] TaskPolicy.statusNext — the THIN Task façade over the generic UnitController.apply (NOT a 2nd entry).
export function statusNext(idx: ScenarioIndex, taskUuid: string, opts: { actor?: string; target?: TaskStatusEnum; subStep?: string; publish?: PublishFn } = {}): ScenarioUnit {
  return UnitController.apply(idx, TASK_IOR, taskUuid, { target: opts.target, subStep: opts.subStep }, { actor: opts.actor, publish: opts.publish });
}

registerPolicy(TASK_IOR, TaskPolicy);

// C4.1 (T37.4.1) self-heal on READ — Task = healer #1. Recompute the DERIVED status from the checklist (the single
// source, deriveStatusEnum) so a READ never returns a stored `status` that has drifted from the checklist (C2/C6:
// status 'Planned' while the chain had shipped). deriveStatusEnum never throws → Task always self-CORRECTS (fresh, no
// refuse). A new class inherits self-heal-on-read by registering its own healer here — zero edits to the mechanism.
// Task self-heal-on-read registration (recompute status from checklist). The C4.1 [impl] marker lives on
// the selfHealOnRead declaration in self-heal.ts (the mechanism), not here on the per-class registration.
registerSelfHeal(TASK_IOR, (unit) => {
  const m = unit.model as Record<string, unknown>;
  m.status = deriveStatusEnum(String(m.statusChecklist ?? ''));
});
