<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.4.3: CONTROLLER is the UNIQUE DOMINATOR of any unit mutation; single-source Done delegation — R40.10 approve DELEGATES, tronApprove folds in (no second writer)

[task:uuid:1b8ebc9a-7b94-468c-a0a9-f40f648e4cad]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [ ] Done

## Remaining Issues

QA-Review (planner flip 2026-08-12, chain-complete-to-Test VERIFIED both-dir on origin): Test 3b8f21c6 'MvcBoundaryGuard.assertControllerDominates' status=pass <-> Impl a5c570c9 (dominance / single-Done-writer facet, markerPending=false), both-dir. ★ VERIFY-OWNER-FIRST CLEAN = T37.4.3's OWN distinct-intent Test on its OWN facet, NOT the shared a7f3c1e8 (T37.4.2's apply pipeline). This is the RIPE-SHARED case my own guard flags, resolved honestly (own Test, no sibling-credit). Awaiting Tron QA verdict. --- PRIOR:Planned - C4.3 CONTROLLER single-source Done (subtask of T-C4 79fd2164; kills the two-writer Done risk C4 exposed). Pairs with R40.10 (approve-control) — that req's Done-write DELEGATES here. Chain at req-mint (architect confirms before expert wires). useCases[] pending architect design-step. Gate = second-Done-writer -> lint RED. Verify Impl.tests[] on disk before any flip. 0 Done; no unevidenced ticks.

## Traceability

  - up
    - [Sprint 37 Planning](./planning.md)
    - Parent [Task 37.4](./task-37.4-objects-self-heal.md) `[task:uuid:79fd2164-3f1a-4a60-b91f-87fbaa5f8a2d]`
    - Requirement R37.11 `[requirement:uuid:cfe02f4b-f07d-41ec-8aca-c462c22306f9]`
  - down
    - None (leaf subtask)

## Task Description

C4.3 (subtask of T-C4/T37.4, MVC/view-pipeline shape; RE-ISSUED generic DRY, architect 55a5e2897). RISK C4 exposed: TWO writers for one transition — the FSM tronApprove AND R40.10's approve endpoint (approvedBy/approvedAt) can both set Done = the two-sources disease (two sources for one fact). GENERIC fold: unitController.apply is the UNIQUE DOMINATOR of EVERY unit mutation — nothing bypasses it. Single-source Done lives WITHIN the Task policy: R40.10 approveByOwner (server.ts) DELEGATES to apply's Done step — it records approvedBy/approvedAt as the Tron-verdict EVIDENCE, then reaches Done through apply, and does NOT set Done itself; FSM tronApprove FOLDS IN as the Done applier, not a parallel writer. ONE Done-writer by construction. A dominance LINT proves it (two-bite: plant a 2nd Done-writer OR a mutation outside apply -> RED), not vigilance. Family: under-recorded-progress / silent-drift (two-sources variant — same class as the pin/board double-source).

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

## Subtasks

None (leaf subtask).
