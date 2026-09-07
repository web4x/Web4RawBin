<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.2: Board is a GENERATED view + one-time reconcile-all [R37.2]

[task:uuid:4bc1b3d5-bab5-4d05-ba2c-e9a545734ff9]

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

QA-Review (planner flip 2026-08-11, chain-complete-to-Test VERIFIED both-dir on disk — the test-cases+testing gap my prior reconcile documented is now CLOSED). refinement[x]=Req eec7ebb7 + UC bf1cf902 (sprintBoard.reconcileAll) + Class 93f9afc7 (SprintViewGenerator) + Method eddf2836 (generateAll). implementing[x]=Impl b31ae393 (generateAll --all) markerPending=false STRICT-AST 9b1c2ab18, shipped 5b2630552. creating-test-cases[x]+testing[x]=req minted the REAL reconcile-all WRITE gate Test 8d1c4f60 (rc2-reconcile-all-write-gate.mjs: generateAll b31ae393 regenerates every in-scope sprint board in one --all pass, drift 6->0, 4 orphans pruned, stub-must-fail proven, header-less legacy correctly out-of-scope per R-C7) wired both-dir to b31ae393 (b31ae393.tests[]=[8d1c4f60] <-> 8d1c4f60.implementations[]=[b31ae393]), status=pass, tester GREEN re-verified 663fb9f1 (chain-complete 9ec30587f). This is R37.2's OWN gate (generateAll WRITE), NOT the prior T24.4 cross-credit (82ca355c was two-keyed to generateSprint 41c86206, --check CHECKER not reconcile WRITE) — verify-owner-first satisfied. All 4 In-Progress sub-steps evidenced -> QA-Review. Awaiting Tron QA verdict (0 Done till Tron). PO scope-ruling HOLDS: in-scope byte-match ~20/20 generator-owned boards + honest out-of-scope declare; legacy req.md/planning.md = R37.7 scope not C2.

## Traceability

  - up
    - [Sprint 37 Planning](./planning.md)
    - Requirement R37.2 `[requirement:uuid:eec7ebb7-5dd3-431f-9700-a50429c3de03]`
  - down
    - None (atomic task)

## Task Description

R37.2 (BUILD FIRST per order R37.2->R37.1->R37.3->R37.4). planning.md + task-mds + requirements.md are GENERATED from scenario units (existing generate-sprint-md) — never hand-maintained. A ONE-TIME reconcile-all regenerates EVERY sprint's views from its units in ONE pass, clearing the 29-sprint historical drift (24 requirements.md + a few planning/task-md) — not hand-fixed per file.

## Acceptance Criteria

- [ ] **(functional)** planning.md + task-mds + requirements.md are GENERATED from the sprint's scenario units (generate-sprint-md); the header marks them generated, no hand-maintenance.
- [ ] **(functional)** A one-time reconcile-all regenerates every GENERATOR-OWNED board (files carrying the GENERATED_HEADER) from its units in ONE pass, clearing the drift in the boards the generator owns — NOT hand-fixed per file. It does NOT clobber legacy hand-authored boards (no header) — the OWNED-OUTPUT data-loss invariant; those are migrated under R37.7.
- [ ] **(functional)** After reconcile-all + the R37.7 S21-29 backfills, ALL IN-SCOPE boards (S21-S29 post-backfill + the already-generated S19/S20/S23/S30-S37) byte-match generate-sprint-md --check — a REAL number (e.g. ~20/20 in-scope), NOT a fake 37/37. The 17 S01-S18 legacy hand-authored boards are EXPLICITLY FROZEN + LABELLED legacy and EXCLUDED from checkSprint scope (no-silent-caps, tracked under R37.7). check:sprint-md acceptance = in-scope + generated boards only.
- [ ] **(gate)** TEST EXERCISES AC-reconcile-all+AC-post-clean: on the drifted set (the 29 sprints), run reconcile-all -> --check --all reports GREEN/byte-match for every sprint. Verify Impl.tests[] on disk before flip.

## Subtasks

None (atomic task).
