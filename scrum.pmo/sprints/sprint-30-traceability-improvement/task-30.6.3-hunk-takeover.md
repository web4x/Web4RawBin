<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.6.3: Per-hunk take-over

[task:uuid:ec368634-9acf-4104-bec8-8a46b3c47144]

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
    - Requirement R30.6.3 `[requirement:uuid:1d0cf9b9-b0c2-4881-b53b-65d187654f68]`
  - down
    - [UC](./planning.md) `[uc:uuid:73d0fd09-ad4b-4a19-8eda-09eabd261700]`

## Task Description

Implement per-hunk take-over: the user accepts/rejects individual diff hunks (take ours or theirs per hunk) to build the merged result.

## Context

Covers R30.6.3 (1d0cf9b9). Class RbDiffEditor (code rb-diff-editor, RbFileTree/RbTraceTree convention). Part of R30.6 umbrella (12922d5d).

## Intention

S30 R30.6 3-way diff/merge editor (decomposed). Sub-task covering R30.6.3.

## Acceptance Criteria

- [x] (per-hunk) Per-hunk buttons: left->center and right->center (+ the reverse center->side) to take over a diff hunk.
- [x] (merged-build) Applying take-overs incrementally BUILDS the center merged file from the chosen hunks.

## Implementation

DONE-DELIVERED 2026-07-13: R30.6 3-way diff-editor core GATED GREEN 6/6 DET-3x (tester c16aad856), 70/338, all diff-editor (RbDiffEditor) methods GREEN. Chain-complete. (R30.6 umbrella stays open pending T30.6.6 entry-point + T30.6.7 OOSH-repo-targeting usability tasks.)

## Subtasks

None (atomic task).
