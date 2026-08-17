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
import { deriveStatusEnum, type TaskStatusEnum } from './task-status.js';
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
    if (intent.subStep !== undefined) { // R40.18: a sub-step tick is NOT a state advance — validate the named box, no legalNext/evidence gate (the evidence gate applies at the In Progress→QA Review state advance)
      const sub = String(intent.subStep);
      if (!IN_PROGRESS_SUBSTEPS.includes(sub)) throw new Error(`TaskPolicy: unknown sub-step '${sub}' (valid: ${IN_PROGRESS_SUBSTEPS.join(', ')})`);
      if (currentState(unit) !== 'In Progress') throw new Error(`TaskPolicy: sub-step '${sub}' requires state 'In Progress' (current: ${currentState(unit)})`);
      return;
    }
    const cur = currentState(unit);
    const to = legalNext(cur, intent.target as TaskStatusEnum | undefined);
    const need = EVIDENCE_GATE[to];
    if (need && !StepEvidence.evidenceForStep(resolver(idx), { ior: unit.ior, m: unit.model as Record<string, unknown> }, need))
      throw new Error(`TaskPolicy: REFUSED ${cur}→${to} — '${need}' evidence absent (no two-keyed passing Test on the chain). A box ticked without evidence corrupts Tron's QA signal.`);
    if (to === 'Done' && !(unit.model as Record<string, unknown>).approvedBy)
      throw new Error(`TaskPolicy: REFUSED ${cur}→Done — no approvedBy verdict (Done requires the owner's QA sign-off; R40.10 approve delegates it as evidence).`);
  },
  // [impl:uuid:1e789400-8e25-4957-b0d6-f9429f174184] TaskPolicy.apply — TICKS the next checklist box, then model.status = deriveStatusEnum (the SOLE
  // 4-state writer). NEVER writes a flat 7-state or a literal status string (MvcBoundaryGuard enforces this structurally).
  apply(idx: ScenarioIndex, unit: ScenarioUnit, intent: UnitIntent): void {
    const m = unit.model as Record<string, unknown>;
    if (intent.subStep !== undefined) { // R40.18: tick the NAMED In-Progress sub-step, KEEP the state, stamp + emit (seam)
      m.statusChecklist = tickSubStep(String(m.statusChecklist ?? ''), String(intent.subStep));
      m.status = deriveStatusEnum(String(m.statusChecklist)); // unchanged (sub-step doesn't move the state) — recompute for the SOLE-writer invariant
      m.lastAdvancedAt = new Date().toISOString();
      m.lastAdvancedAtSource = 'seam';
      return;
    }
    const to = legalNext(currentState(unit), intent.target as TaskStatusEnum | undefined);
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
