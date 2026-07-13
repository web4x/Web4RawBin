<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.6.5: Swap sides

[task:uuid:bf6da13d-c9da-4eba-afcd-b5134bbb35bd]

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
    - Requirement R30.6.5 `[requirement:uuid:d32e29cd-5d94-49fb-93b2-4302aae6f11e]`
  - down
    - [UC](./planning.md) `[uc:uuid:56281453-5398-446b-8845-5e74f746f6f3]`

## Task Description

Add a swap control to swap the ours/theirs (left/right) sides of the 3-way merge view.

## Context

Covers R30.6.5 (d32e29cd). Class RbDiffEditor (code rb-diff-editor, RbFileTree/RbTraceTree convention). Part of R30.6 umbrella (12922d5d).

## Intention

S30 R30.6 3-way diff/merge editor (decomposed). Sub-task covering R30.6.5.

## Acceptance Criteria

- [x] (swap) A SWAP button swaps the LEFT and RIGHT panes (their files, selections, and diffs).

## Implementation

DONE-DELIVERED 2026-07-13: R30.6 3-way diff-editor core GATED GREEN 6/6 DET-3x (tester c16aad856), 70/338, all diff-editor (RbDiffEditor) methods GREEN. Chain-complete. (R30.6 umbrella stays open pending T30.6.6 entry-point + T30.6.7 OOSH-repo-targeting usability tasks.)

## Subtasks

None (atomic task).
