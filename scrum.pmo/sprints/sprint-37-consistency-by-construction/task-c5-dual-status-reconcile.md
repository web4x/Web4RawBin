<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task C5: Dual-status reconcile — one truth (status vs statusChecklist), no Done-ness flip [R-C5]

[task:uuid:97e8a6ad-46db-440f-a9be-cfb97ca64df4]

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

Planned - cluster R-C5 (dual-status reconcile, architect-surfaced during R-C2). Kept OUT of R-C2. Directly closes the [[task-dual-status-fields-can-disagree]] class (Task 95). Chain at build-go. Gate = Test EXERCISES disagreeing-unit -> ONE status, NO Done-ness flip, disagreement flagged. Verify Impl.tests[] on disk before flip.

## Traceability

  - up
    - [Sprint 37 Planning](./planning.md)
    - Requirement R-C5 `[requirement:uuid:03fd79ff-da54-4c91-b542-cbf330cd22aa]`
  - down
    - None (atomic task)

## Task Description

R-C5 (architect-surfaced during R-C2 design). A Task unit carries TWO independent status fields — model.status (-> planning checkbox) AND model.statusChecklist (free-text -> task-md '## Status') — which can DISAGREE WITHIN the source (e.g. Task 95: status='In Progress' but statusChecklist all-checked). R-C5 makes a task's status ONE truth WITHOUT flipping its displayed Done-ness (disagreements are surfaced for the honesty audit, never silently reconciled to Done = a status invention). Kept OUT of R-C2 (which regenerates from BOTH fields as-is, INV-C4).

## Acceptance Criteria

- [ ] (functional) A Task's status is ONE truth: model.status and model.statusChecklist are reconciled (or one derived from the other) so they CANNOT disagree within a unit.
- [ ] (functional) The reconcile MUST NOT flip a task's displayed Done-ness (a status='In Progress' + all-checked checklist is SURFACED for the honesty audit, NOT silently flipped to Done) - no status invention, honors R-C2 INV-C4.
- [ ] (functional) status/statusChecklist disagreements are surfaced to the planner honesty audit (the UNIT is the thing to fix, not the view); ties to the S33-36 honesty correction.
- [ ] (gate) TEST EXERCISES AC-one-status+AC-no-doneness-flip: a Task with disagreeing status/statusChecklist (e.g. Task 95) -> reconcile yields ONE consistent status WITHOUT changing displayed Done-ness + the disagreement is flagged (not silently resolved). Verify Impl.tests[] on disk before flip.

## Subtasks

None (atomic task).
