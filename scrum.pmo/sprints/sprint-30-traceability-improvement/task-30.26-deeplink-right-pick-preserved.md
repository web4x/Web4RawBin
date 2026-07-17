<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.26: Deep-link right-pick preserves the user's pick (BUG-1)

[task:uuid:9a6947db-0f48-4a79-bae9-e584bda9827e]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [x] Done

## Traceability

  - up
    - [Sprint 30 Planning](./planning.md)
    - Requirement R30.26 `[requirement:uuid:2fd1c9fb-b03c-438f-b760-115a1ddbefd3]`
  - crossRef
    - R30.25 (right-pick-preserves-left, sibling of R30.25-B) + R30.24 (deep-link open/share)
  - down
    - [UC diffEditor.deepLinkRightPickPreserved](./planning.md) `[uc:uuid:1cc5ed1c-726e-47a0-aba8-821c1d2e4829]`

## Task Description

Deep-link right-pick preservation: open a diff from a deep-link URL, then pick a RIGHT ref — the user's pick is preserved (RIGHT = the picked ref), NOT clobbered by the in-flight deep-link/right load. openFromParams guards against a user pick landing mid-load (R30.25.1); loadSide uses a _rightLoadSeq sequence token so a stale in-flight load returning after a newer pick is discarded — newest load wins (R30.25.2).

## Context

Covers R30.26 (2fd1c9fb) → UC diffEditor.deepLinkRightPickPreserved (1cc5ed1c) → Class RbDiffEditor 18165081. ⚠ #126 BACKFILL (my catch, PO+req approved 34c67a0bb): BUG-1 was CLOSED+GATED v0.7.39 with NO task unit — retroactive completion. IMPL-EDITS to EXISTING Impls openFromParams dc236c19 + loadSide c4da837c (markers STAY, no new Method/Class). Separate from R30.25 (left-empties/RIGHT-wins) + R30.24 (deep-link open/share).

## Intention

S30 diff/merge editor, R30.26 (BUG-1 = the RIGHT-corrupt half of R30.25-B; architect 'TWO bugs' split, set-right exonerated of left-write). Deep-link change-RIGHT must not corrupt the user's pick.

## Acceptance Criteria

- [x] (preserved) Open a diff from a deep-link URL, then pick a RIGHT ref: the user's pick is preserved (RIGHT = the picked ref), NOT clobbered by the in-flight deep-link/right load
- [x] (guard) openFromParams guards against overwriting a user pick that lands while the deep-link load is still in flight (R30.25.1)
- [x] (seq) loadSide uses a _rightLoadSeq sequence token: a stale in-flight load whose result returns AFTER a newer pick is discarded — the newest load wins (R30.25.2)
- [x] (no-regression) R30.24 deep-link open/restore + share round-trip still work; R30.25 right-pick-preserves-left still holds
- [x] (impl-edit) Impl-edits to EXISTING RbDiffEditor.openFromParams (Impl dc236c19) + RbDiffEditor.loadSide (Impl c4da837c) — markers STAY, no new Method/Class
- [x] (verify) DET-3x GREEN on v0.7.39 (Test 7d3e1a52 R30.25.1/.2 deep-link change-RIGHT, status pass, on both Impls)

## Implementation

DONE (retroactive #126 backfill, PO+req-approved). Gate: DET-3x GREEN on v0.7.39 (c88328914 'deep-link change-RIGHT BOTH windows GREEN, BUG-1 closed + two-key Test wired'; fixes R30.25.1 b19b492c1 openFromParams token/guard v0.7.38 + R30.25.2 466dd417d loadSide superseded-right-load-discards v0.7.39). CHAIN-TO-TEST CLOSED (verified before Done): Test 7d3e1a52 status=pass, wired BOTH-directions onto Impl openFromParams dc236c19 (tests[1f7c9a04,7d3e1a52]) + Impl loadSide c4da837c (tests[7d3e1a52]). SERVED==GATED: R30.27 not yet deployed, v0.7.39 is the served bundle. ⚠ Test 7d3e1a52 name says 'R30.25.1/.2' — cosmetic; tester realigns to R30.26 (req noted).

## Subtasks

None (atomic task).
