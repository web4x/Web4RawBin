<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task C6: sprints.overview.md is a GENERATED view (with preserved-narrative region) [R-C6]

[task:uuid:32061171-e236-4ed4-8f7f-8db42e0b395b]

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

In Progress 2/4 (planner reconcile 2026-08-11, MEASURED per-box, Tron directive, same disease+method as C2; checklist was ALL-unticked=derived-Planned = UNRECORDED PROGRESS; status DERIVED from checklist R-C5, never hand-set). EVIDENCED [x]: refinement = Req 9339cc3b + UC 833d3525 (overview.generatePreserved) + Class c85603ca (SprintOverviewGenerator) + Method 8b238215 (generateOverview) all on disk+wired. implementing = Impl 1f38e07e (generateOverview: preserved-region + pin/rollup index + frozen-legacy visible) markerPending=false, shipped expert cf850d26e, planner owner-APPROVED this session. NOT EVIDENCED [ ]: creating test cases + testing = R-C6 has NO Test — Impl 1f38e07e.tests[]=EMPTY; the only R-C6-mentioning Test (57829ccc) is R-C7's narrative-loss BITE two-keyed to proveComplete 21e38b44 NOT 1f38e07e, naming R-C6 only as a FUTURE phase-b dependency (verify-owner-first: MENTION != WIRE, no cross-wire). >> test-cases NEEDS: author the R-C6 gate (regenerate overview -> sprint-table reflects Sprint units + preserved-narrative byte-untouched + injected table-drift FAILS --check, per AC-gate) wired to 1f38e07e. testing NEEDS: that gate GREEN two-keyed. NOT rounded up to QA-Review (Tron steers QA from status).

## Traceability

  - up
    - [Sprint 37 Planning](./planning.md)
    - Requirement R-C6 `[requirement:uuid:9339cc3b-8035-403b-8bef-8c08df15edc2]`
  - down
    - None (atomic task)

## Task Description

R-C6 (architect-surfaced during R-C2 design). sprints.overview.md is currently a HAND-MAINTAINED narrative (WIP=1, CURRENT-SPRINT block) — the remaining un-generated board seam. R-C6 makes it a GENERATED view: the sprint table (number/name/status/goal) is generated from the Sprint units, with a PRESERVED-narrative OWNED-region (the WIP/CURRENT-SPRINT human block survives regeneration, mirroring the header guard), + a new --check folded into ci:gates so it cannot drift.

## Acceptance Criteria

- [ ] (functional) The sprints.overview.md sprint-table (number/name/status/goal per sprint) is GENERATED from the Sprint units, not hand-maintained.
- [ ] (functional) A PRESERVED-narrative OWNED-region (the WIP / CURRENT-SPRINT human block) survives regeneration untouched (mirror the GENERATED-header/OWNED-output guard) - the generator writes the table region, preserves the narrative region.
- [ ] (functional) A new --check for sprints.overview.md is folded into ci:gates (fails on drift like the other boards) - the overview joins the pin==board==files guard (R-C3).
- [ ] (gate) TEST EXERCISES AC-generated+AC-preserved-narrative: regenerate sprints.overview.md -> the sprint-table reflects the Sprint units AND the preserved-narrative region is byte-untouched; injecting table-drift -> --check FAILS. Verify Impl.tests[] on disk before flip.

## Subtasks

None (atomic task).
