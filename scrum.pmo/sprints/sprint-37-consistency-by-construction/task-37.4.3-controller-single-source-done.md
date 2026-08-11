<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.4.3: CONTROLLER is the UNIQUE DOMINATOR of any unit mutation; single-source Done delegation — R40.10 approve DELEGATES, tronApprove folds in (no second writer)

[task:uuid:1b8ebc9a-7b94-468c-a0a9-f40f648e4cad]

## Status
- [x] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

Planned - C4.3 CONTROLLER single-source Done (subtask of T-C4 79fd2164; kills the two-writer Done risk C4 exposed). Pairs with R40.10 (approve-control) — that req's Done-write DELEGATES here. Chain at req-mint (architect confirms before expert wires). useCases[] pending architect design-step. Gate = second-Done-writer -> lint RED. Verify Impl.tests[] on disk before any flip. 0 Done; no unevidenced ticks.

## Traceability

  - up
    - [Sprint 37 Planning](./planning.md)
    - Parent [Task 37.4](./task-37.4-objects-self-heal.md) `[task:uuid:79fd2164-3f1a-4a60-b91f-87fbaa5f8a2d]`
    - Requirement R37.4 `[requirement:uuid:c8615e9f-df2e-4ebf-b916-cbdd346ad1a1]`
  - down
    - None (leaf subtask)

## Task Description

C4.3 (subtask of T-C4/T37.4, MVC/view-pipeline shape; RE-ISSUED generic DRY, architect 55a5e2897). RISK C4 exposed: TWO writers for one transition — the FSM tronApprove AND R40.10's approve endpoint (approvedBy/approvedAt) can both set Done = the two-sources disease (two sources for one fact). GENERIC fold: unitController.apply is the UNIQUE DOMINATOR of EVERY unit mutation — nothing bypasses it. Single-source Done lives WITHIN the Task policy: R40.10 approveByOwner (server.ts) DELEGATES to apply's Done step — it records approvedBy/approvedAt as the Tron-verdict EVIDENCE, then reaches Done through apply, and does NOT set Done itself; FSM tronApprove FOLDS IN as the Done applier, not a parallel writer. ONE Done-writer by construction. A dominance LINT proves it (two-bite: plant a 2nd Done-writer OR a mutation outside apply -> RED), not vigilance. Family: under-recorded-progress / silent-drift (two-sources variant — same class as the pin/board double-source).

## Acceptance Criteria

- [ ] (functional) unitController.apply is the UNIQUE DOMINATOR of ANY unit mutation — NO path mutates a unit's status/checklist/Done outside apply (grep-provable single writer, dominance property, INV-C4-8).
- [ ] (functional) Single-source Done delegation: R40.10 approveByOwner DELEGATES to apply's Done step — records approvedBy/approvedAt as the Tron-verdict EVIDENCE, does NOT set Done independently; FSM tronApprove FOLDS IN as the Done applier. Exactly ONE Done-writer by construction.
- [ ] (functional) The delegation must NOT break ITEM ZERO (R40.10 is LIVE, Tron's verdicts run through it) — positive controls: approve STILL records approvedBy/approvedAt AND reaches Done end-to-end; decline STILL mints a reachable CR; non-owner STILL 403 (tester RE-RUNS r4010 after the delegation edit, hardening D).
- [ ] (DRY-AC / gate) STUB-MUST-FAIL dominance lint: plant a 2nd independent Done-writer (or make R40.10 set Done directly) -> lint RED; a bypass path that mutates a unit outside apply -> RED. The negative no-2nd-writer bite + the (D) positive controls together = delegation without regression. FAMILY: under-recorded-progress / silent-drift.

## Subtasks

None (leaf subtask).
