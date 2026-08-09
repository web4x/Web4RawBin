<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task C6: sprints.overview.md is a GENERATED view (with preserved-narrative region) [R-C6]

[task:uuid:32061171-e236-4ed4-8f7f-8db42e0b395b]

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

Planned - cluster R-C6 (sprints.overview.md GENERATED + preserved-narrative + --check in ci:gates). The last un-generated board seam; joins the R-C3 pin==board==files guard. Chain at build-go. Gate = Test EXERCISES regen -> table reflects Sprint units + narrative byte-untouched + injected drift FAILS --check. Verify Impl.tests[] on disk before flip.

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
