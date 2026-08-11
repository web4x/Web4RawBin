<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.2: Board is a GENERATED view + one-time reconcile-all [R37.2]

[task:uuid:4bc1b3d5-bab5-4d05-ba2c-e9a545734ff9]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [ ] creating test cases
  - [x] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

In Progress 2/4 (planner reconcile 2026-08-11, MEASURED per-box, Tron directive; checklist was ALL-unticked=derived-Planned = UNRECORDED PROGRESS, not a display bug; status DERIVED from checklist R37.5, never hand-set). EVIDENCED [x]: refinement = Req eec7ebb7 + UC bf1cf902 (sprintBoard.reconcileAll) + Class 93f9afc7 (SprintViewGenerator, R24.4) + Method eddf2836 (generateAll) all on disk+wired. implementing = Impl b31ae393 (generateAll --all write-extraction) markerPending=false STRICT-AST @generate-sprint-md.ts:248 (9b1c2ab18); shipped RUN 5b2630552 (regen 144 md, owned-output guard 0 puml/design). NOT EVIDENCED [ ]: creating test cases + testing = R37.2 has NO Test — Impl b31ae393.tests[]=EMPTY; no Test unit references reconcile-all/generateAll. The cited T24.4 gate (Test 82ca355c, r245-s24-tooling-gate.mjs) is GREEN (status=pass) BUT two-keyed to generateSprint Impl 41c86206 NOT b31ae393, and exercises the --check CHECKER not the reconcile-all WRITE = CROSS-CREDIT, not R37.2's gate (verify-owner-first). PLUS reconcile-all BLOCKED ~9/37 by OWNED-OUTPUT guard skipping 20 legacy req.md + 10 planning.md (no GENERATED_HEADER, R37.7-pending). >> test-cases NEEDS: author a reconcile-all gate (run --all WRITE on drifted set -> --check --all byte-match on IN-SCOPE boards per re-scoped AC-post-clean ~20/20 NOT 37/37) wired to b31ae393. testing NEEDS: that gate GREEN two-keyed + in-scope scope settled OR R37.7 legacy migration to unblock. NOT rounded up to QA-Review (Tron steers QA from status). ★ PO SCOPE RULING (2026-08-11, do-not-re-litigate): C2 is NOT FAILING — its scope is IN-SCOPE byte-match ~20/20 (generator-owned boards) + HONESTLY DECLARES the out-of-scope count, never a fake 37/37. The ~20 legacy req.md + 10 planning.md the owned-output guard SKIPS (no GENERATED_HEADER) are R37.7's scope (legacy hand-authored boards migrated with units-completeness proof), NOT C2's — overriding the header-guard blindly risks hand-authored loss. C2's scope ENDS where the guard correctly protects unmarked files. So the In-Progress landing = test-cases+testing genuinely uncovered (no reconcile-all gate wired to b31ae393), NOT because C2 is blocked by the legacy files.

## Traceability

  - up
    - [Sprint 37 Planning](./planning.md)
    - Requirement R37.2 `[requirement:uuid:eec7ebb7-5dd3-431f-9700-a50429c3de03]`
  - down
    - None (atomic task)

## Task Description

R37.2 (BUILD FIRST per order R37.2->R37.1->R37.3->R37.4). planning.md + task-mds + requirements.md are GENERATED from scenario units (existing generate-sprint-md) — never hand-maintained. A ONE-TIME reconcile-all regenerates EVERY sprint's views from its units in ONE pass, clearing the 29-sprint historical drift (24 requirements.md + a few planning/task-md) — not hand-fixed per file.

## Acceptance Criteria

- [ ] (functional) planning.md + task-mds + requirements.md are GENERATED from the sprint's scenario units (generate-sprint-md); the header marks them generated, no hand-maintenance.
- [ ] (functional) A one-time reconcile-all regenerates every GENERATOR-OWNED board (files carrying the GENERATED_HEADER) from its units in ONE pass, clearing the drift in the boards the generator owns - NOT hand-fixed per file. It does NOT clobber legacy hand-authored boards (no header) - the OWNED-OUTPUT data-loss invariant; those are migrated under R37.7.
- [ ] (functional) After reconcile-all, ALL GENERATOR-OWNED boards byte-match generate-sprint-md --check (green CI on what IS generated) - the HONEST scope, NOT a fake 37/37. The ~20 legacy hand-authored requirements.md + ~10 planning.md that the OWNED-OUTPUT guard correctly SKIPS are NOT counted clean here; they are explicitly TRACKED for migration under R37.7 (no-silent-caps).
- [ ] (gate) TEST EXERCISES AC-reconcile-all+AC-post-clean: on the drifted set (the 29 sprints), run reconcile-all -> --check --all reports GREEN/byte-match for every sprint. Verify Impl.tests[] on disk before flip.

## Subtasks

None (atomic task).
