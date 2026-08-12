<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.3: FAIL-LOUD guard asserts pin==board==files (ci:gates, drift-injection BITE) [R37.3]

[task:uuid:364785b1-6d6a-4b08-8c18-a282a32fbf9d]

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

HELD-FROM-BATCH (PO 2026-08-12, NOT Tron-signable): tester-diagnosed = GATE STALE/UNVERIFIABLE (status:pass over a currently-RED gate DET-3x, hollow-row class), FEATURE NOT IMPLICATED (no broken feature). Status stays QA-Review (not downgraded); do NOT approve until the gate is re-verified GREEN. --- QA-Review (units-win over stale Planned board): chain-complete-to-Test — Impl ee424581 refuseIfVacuous markerPending=false + Impl.tests[]=[caf74333] pass, BITE gate GREEN (rc3-consistency-guard-metabite, real drift-injection). All 4 In-Progress sub-steps [x]. Done-gate [ ] = Tron's act. Board re-derived from units (PO campaign-sync 2026-08-09).

## Traceability

  - up
    - [Sprint 37 Planning](./planning.md)
    - Requirement R37.3 `[requirement:uuid:1530c79c-39a6-40b7-8d2b-044d5583aa59]`
  - down
    - None (atomic task)

## Task Description

R37.3 (build 3rd). A FAIL-LOUD guard folded into ci:gates FAILS the build when the pointers/board/files disagree: (a) sprint-pin != computed-current; (a2) current-TASK-pointer != computed-active-task; (b) ANY sprint's planning.md/task-md/requirements.md != regenerated (round-trip byte-match — extend check:sprint-md to FAIL on drift); (c) a task-status in a unit != its board checkbox. BOTH pointers (sprint + task) == board == files. The fail-loud is PROVEN by a real drift-injection BITE, NOT asserted.

## Acceptance Criteria

- [ ] (functional) The guard FAILS the build if (a) sprint-pin != computed-current-sprint-from-files, OR (a2) current-task-pointer != computed-active-task-from-files, OR (b) ANY sprint's planning.md/task-md/requirements.md != regenerated (round-trip byte-match), OR (c) a task-status in a unit != its board checkbox. BOTH pointers (sprint + task) == board == files.
- [ ] (functional) The guard is folded into ci:gates - check:sprint-md is EXTENDED to FAIL on any drift (not merely report); a drifted state cannot pass CI ('no silent broken state').
- [ ] (gate) The fail-loud is PROVEN by a REAL drift-injection BITE, not asserted: planting sprint-pin!=files OR task-pointer!=files MUST make the guard exit non-zero with a clear message; planting board!=units MUST fail-loud; planting status!=checkbox MUST fail. A by-construction claim is false if only asserted (correct-by-construction-needs-gate-verification).
- [ ] (gate) TEST EXERCISES AC-BITE directly: inject each drift kind (sprint-pin-drift, TASK-pointer-drift, board-drift, status-drift) -> assert guard exits non-zero + clear message each; remove all drift -> assert guard passes (GREEN). The Test IS the BITE. Verify Impl.tests[] on disk before flip.

## Subtasks

None (atomic task).
