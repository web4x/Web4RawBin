<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.6: sprints.overview.md is a GENERATED view (with preserved-narrative region) [R37.6]

[task:uuid:32061171-e236-4ed4-8f7f-8db42e0b395b]

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

QA-Review (planner flip 2026-08-11, chain-complete-to-Test DURABLE ON ORIGIN — verified TWICE: my post-fetch origin measure + PO second-source; I REFUSED to flip on local-only state first, PO made origin-durability part of the chain-complete-to-Test definition). Test 7e4a1c9d 'test:R37.6/T37.6 overview-generator' (rc6-overview-generator-gate.mjs) status=pass, two-keyed BOTH-DIR to Impl 1f38e07e (generateOverview): FWD 1f38e07e.tests[]=[7e4a1c9d] + REV 7e4a1c9d.implementations[]=[1f38e07e]+ownerIor, on origin HEAD fa9131be7 (req mint 29e99d9b2 + tester two-key both on origin). Gate GREEN 4/4 (A check-passes / B regen-byte-stable / C narrative-preserved / D stub-must-fail), RED->GREEN after my overview regen a3bef80b9 (--write fixed the R-C1->R37.1 committed drift). verify-owner-first PASSED: Impl 1f38e07e distinct sharedByTasks=[32061171], Test is R37.6's OWN (clean first Test, 1f38e07e.tests[] was empty = NO cross-wire, NOT the 57829ccc R37.7 cross-credit). All 4 In-Progress sub-steps evidenced. Awaiting Tron QA verdict. 0 Done till Tron.

## Traceability

  - up
    - [Sprint 37 Planning](./planning.md)
    - Requirement R37.6 `[requirement:uuid:9339cc3b-8035-403b-8bef-8c08df15edc2]`
  - down
    - None (atomic task)

## Task Description

R37.6 (architect-surfaced during R37.2 design). sprints.overview.md is currently a HAND-MAINTAINED narrative (WIP=1, CURRENT-SPRINT block) — the remaining un-generated board seam. R37.6 makes it a GENERATED view: the sprint table (number/name/status/goal) is generated from the Sprint units, with a PRESERVED-narrative OWNED-region (the WIP/CURRENT-SPRINT human block survives regeneration, mirroring the header guard), + a new --check folded into ci:gates so it cannot drift.

## Acceptance Criteria

- [ ] (functional) The sprints.overview.md sprint-table (number/name/status/goal per sprint) is GENERATED from the Sprint units, not hand-maintained.
- [ ] (functional) A PRESERVED-narrative OWNED-region (the WIP / CURRENT-SPRINT human block) survives regeneration untouched (mirror the GENERATED-header/OWNED-output guard) - the generator writes the table region, preserves the narrative region.
- [ ] (functional) A new --check for sprints.overview.md is folded into ci:gates (fails on drift like the other boards) - the overview joins the pin==board==files guard (R37.3).
- [ ] (gate) TEST EXERCISES AC-generated+AC-preserved-narrative: regenerate sprints.overview.md -> the sprint-table reflects the Sprint units AND the preserved-narrative region is byte-untouched; injecting table-drift -> --check FAILS. Verify Impl.tests[] on disk before flip.

## Subtasks

None (atomic task).
