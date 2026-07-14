<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.11: Scoreboard measures the walked chain

[task:uuid:76fa9794-0dcd-41e5-a71f-fbe8ef6b9b32]

## Status
- [x] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Traceability

  - up
    - [Sprint 30 Planning](./planning.md)
    - Requirement R30.11 `[requirement:uuid:651442ca-bc0d-4422-b324-fb1715f84c61]`
  - down
    - [UC](./planning.md) `[uc:uuid:5ae6ac40-1ce3-415c-82bf-622b53c242bd]`

## Task Description

Make the scoreboard/audit measure the actually-WALKED chain (traversed edges) instead of raw counts, so credit reflects real chain-to-Test coverage.

## Context

Covers R30.11 (651442ca). Class RbDiffEditor.

## Intention

S30 diff/merge editor completion (R30.11). Minted for #126 traceability (was requirement-only).

## Acceptance Criteria

- [ ] (walk-not-denorm) A Requirement's test/impl coverage is computed by WALKING Req->UC->Class->Method->Impl to Impl.tests[]/[impl] markers, NOT the denormalized Req.tests[] — fixing the R22.3-style false 'no-Test' (R22.3 IS tested via Impl bd8e5d6f -> Test 91d0edca).
- [ ] (honor-superseded) Impls (and their Methods/Tests) annotated supersededBy are EXCLUDED from open/uncovered counts, fixing the R30.6.1/6.3 false 'open' (the tester's -2).
- [ ] (cleanup) The 19 dangling Test->Impl (Tests of the R30.6.1/6.3 impls retired by R30.9) are repointed to R30.9's replacement Impls OR retired-with-superseded; dry-run + count FIRST; 0 such dangling after.
- [ ] (cleanup) The 7 other dangling (4 Req->UC / 2 Req->Test / 1 Task->UC) are triaged (repoint or retire) each with a reason; never silently drop a real edge.
- [ ] (by-construction) After the fix, a tested-but-denormalized-empty Requirement or a superseded Impl cannot produce a false gap/open in the scoreboard (it measures the walked chain, not stale fields).
- [ ] (verify) Re-run scoreboard: R22.3 scores TESTED, R30.6.1/6.3 score superseded-not-open, 0 dangling repo-wide (planner dry-run + count evidence).

## Implementation

BACKLOG (not built) — status Planned per PO.

## Subtasks

None (atomic task).
