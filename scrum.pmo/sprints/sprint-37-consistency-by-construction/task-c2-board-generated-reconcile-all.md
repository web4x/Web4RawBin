<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task C2: Board is a GENERATED view + one-time reconcile-all [R-C2]

[task:uuid:4bc1b3d5-bab5-4d05-ba2c-e9a545734ff9]

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

Planned - cluster R-C2, BUILD FIRST (order R-C2->R-C1->R-C3->R-C4). Clears 29-sprint historical drift in ONE reconcile-all pass. Chain at build-go (architect design, useCases pending). Gate = Test EXERCISES reconcile-all -> --check --all byte-match ALL sprints (CI/tooling, not @390). Verify Impl.tests[] on disk before flip.

## Traceability

  - up
    - [Sprint 37 Planning](./planning.md)
    - Requirement R-C2 `[requirement:uuid:eec7ebb7-5dd3-431f-9700-a50429c3de03]`
  - down
    - None (atomic task)

## Task Description

R-C2 (BUILD FIRST per order R-C2->R-C1->R-C3->R-C4). planning.md + task-mds + requirements.md are GENERATED from scenario units (existing generate-sprint-md) — never hand-maintained. A ONE-TIME reconcile-all regenerates EVERY sprint's views from its units in ONE pass, clearing the 29-sprint historical drift (24 requirements.md + a few planning/task-md) — not hand-fixed per file.

## Acceptance Criteria

- [ ] (functional) planning.md + task-mds + requirements.md are GENERATED from the sprint's scenario units (generate-sprint-md); the header marks them generated, no hand-maintenance.
- [ ] (functional) A one-time reconcile-all regenerates EVERY sprint's views from its units in ONE pass, clearing the 29-sprint historical drift - NOT hand-fixed per file.
- [ ] (functional) After reconcile-all, generate-sprint-md --check --all byte-matches for ALL sprints (0 drift remaining).
- [ ] (gate) TEST EXERCISES AC-reconcile-all+AC-post-clean: on the drifted set (the 29 sprints), run reconcile-all -> --check --all reports GREEN/byte-match for every sprint. Verify Impl.tests[] on disk before flip.

## Subtasks

None (atomic task).
