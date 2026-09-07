<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.24: Realtime-MVC live-update slice — a routed write appears live in item + detail + pin @390

[task:uuid:5acdcc4c-3f6c-4aea-95ad-3ab19b14ff40]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [ ] Done

## Task Description

The realtime-MVC live-update slice Tron is tracking ('the pixel gate at 390 passes'): route unit mutations through the ONE controller (UnitController.apply) so a change through ANY routed write path is reflected LIVE in the item view, the detail view, and the current/next pin — no reload. Slice-1 = the seam foundation (committed: 3c15eabd0/075273c97/b5c0e35d8/2617f22ab, decided routing list cd797ff27); the routing pass over the ~15 bypass sites is next on the fresh expert.

## Context

R37.11 ONE CONTROLLER (cfe02f4b) via UC mvc.applyMutation (3ee364a5) + Impl e3729f51 (UnitController.apply route-all-writes-through-seam). Seam already exists at unit-controller.ts:41; ~15 sites bypass it (server.ts idx.put x10 / EmailIndex.ts:68,71 / agent-message.ts:68,77,103 / skills.ts:59) so emit never fires + views go stale.

## Intention

Prove Tron's realtime-MVC ask on-device: a write is visible everywhere at once, @390, with no reload.

## Acceptance Criteria

- [ ] **(functional)** unitController.apply(idx,ior,uuid,intent,{actor,evidenceRef?}) is the SOLE mutation entry for ANY unit: validate via registered policy -> apply -> persist via ScenarioIndex.put (deliberate-opt, subsumes statusNext's opt-in) -> emit. statusNext is a THIN Task facade over apply, NOT a second entry.
- [ ] **(functional)** Task FSM registers as POLICY #1 (registerPolicy(ior,policy)); adding a new class policy is REGISTRATION ONLY — zero edits to the controller (DRY acceptance test: a throwaway policy works + a controller edit for policy N+1 -> RED).
- [ ] **(functional)** The controller REFUSES to advance past a checklist step whose evidence is absent, using the ONE shared evidenceForStep predicate (the SAME definition checklist-chain-audit consumes — no second copy that could disagree).
- [ ] **(functional)** unitController.apply's Task-Done step (via TaskPolicy) OWNS the Done transition; R40.10 approveByOwner DELEGATES (records approvedBy/approvedAt as evidence, then calls apply's Done step) and does NOT set Done itself; the statusNext facade + tronApprove fold in. ONE Done-writer by construction.
- [ ] **(gate)** The R40.10 delegation edit needs POSITIVE-CONTROL bites (approve STILL records approvedBy + reaches Done end-to-end; decline STILL mints a reachable CR; non-owner STILL 403); tester RE-RUNS r4010 after the delegation edit. Positive controls + the negative no-2nd-writer bite together = delegation without regression.
- [ ] **(gate)** A LINT proves unitController.apply is the UNIQUE DOMINATOR of every unit mutation: no model.status= / no checklist-tick outside unitController.apply; no Done except via apply's Task-Done step (R40.10 must delegate); no hand-authored owned-view write. Two-bite: plant a bypass -> RED; weaken the lint -> RED. The dominance property is this req's invariant, not a separate want.
- [ ] **(gate)** statusNext NEVER writes the flat 4-state status strings that approveByOwner reads (e.g. it must not emit 'QAReview'/'Refining' status writes) — it TICKS the nested checklist and lets deriveStatusEnum derive the 4-state. REMOVED HAZARD (carry as AC, not tidying): the retired flat vocabulary said 'QAReview' while approve's live gate reads 'QA Review' — had a status-write been wired live, Tron's approve would have broken SILENTLY (a button that flips nothing, found by him not us). ONE representation (nested checklist) + ONE legality set; task-fsm.ts reduces to TaskPolicy's internal legality module. BITE: a statusNext path that writes a 4-state string -> RED.
- [ ] **(gate)** deriveStatusEnum is the SOLE writer of the 4-state model.status strings (family: status-string-writer) — a literal 'QA Review'/'Done'/'In Progress'/'Planned' status-set ANYWHERE else -> RED. This folds into mvcBoundary.assertControllerDominates as a 2nd FACET (architect ruling: one property, one home — NOT a separate unit). Proven non-vacuous by a STUB-MUST-FAIL bite (plant a literal status-set -> RED; weaken the lint -> RED).
- [ ] **(gate)** TEST EXERCISES AC-one-entry+AC-evidence-precondition+AC-dominance (distinct-intent): a mutation bypassing apply -> RED; advancing past an evidence-absent step -> refused fail-loud; a second Done-writer -> RED. Verify Impl.tests[] on disk before flip.
- [ ] **(gate)** mvc.applyMutation = route ALL writes through the EXISTING UnitController.apply seam (unit-controller.ts:41; it already mutates+collects+emits). The measured defect: ~15 sites BYPASS it (server.ts idx.put x10 / EmailIndex.ts:68,71 / agent-message.ts:68,77,103 / skills.ts:59) so emit never fires + views go stale. A change through ANY write path must be visible in item+detail views with NO reload. GATE (binding lint, STUB-MUST-FAIL): a graph-write/idx.put OUTSIDE the seam -> RED.
- [ ] **(missing-core-primitive)** The controller seam handles SUB-STEP checklist ticks (intent.subStep -> tick the named In-Progress sub-step via tickBox, KEEP the derived state, stamp lastAdvancedAt source=seam, emit) — NOT ONLY 4-state transitions. MISSING CORE PRIMITIVE discovered by USING the design (Tron defect-3 'no visible progress'): legalNext/apply tick only STATE boxes, so an agent progressing a sub-step (e.g. implementing done, Impl shipped) would be forced to HAND-EDIT = exactly the bypass check-mutation-seam --strict forbids. The Tron agent-status-SKILL is UNBUILDABLE without this. Part of slice-1 (UnitIntent is already open {[k]:unknown}; extend TaskPolicy.apply). GATE: a sub-step tick outside the seam -> RED; statusNext({subStep}) ticks the named sub-step + stamps + emits, state unchanged.

## Implementation

ior:instance:e3729f51-3df6-4f6d-96e3-924c37e3c3c9

## Subtasks
