<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.6.2: File selectors (reuse RbFileTree)

[task:uuid:9753220e-f681-44b4-a21e-8c11018ba614]

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
    - Requirement R30.6.2 `[requirement:uuid:e4c9ffbf-d368-4ac3-8cbc-93859e5a2fce]`
  - down
    - [UC](./planning.md) `[uc:uuid:959b0922-743b-47c2-96df-c8edaab6ef91]`

## Task Description

Add file selectors to the 3-way merge editor by REUSING the existing RbFileTree component (not a new selector) to pick the files/versions to compare.

## Context

Covers R30.6.2 (e4c9ffbf). Class RbDiffEditor (code rb-diff-editor, RbFileTree/RbTraceTree convention). Part of R30.6 umbrella (12922d5d).

## Intention

S30 R30.6 3-way diff/merge editor (decomposed). Sub-task covering R30.6.2.

## Acceptance Criteria

- [x] (path-selectors) A full-path selector above left + right, and a merged-path selector in the center pane.
- [x] (chooser) Each selector has an 'open file chooser' button that browses the project tree, REUSING RbFileTree (R30.5) for the tree browse.

## Implementation

DONE-DELIVERED 2026-07-13: R30.6 3-way diff-editor core GATED GREEN 6/6 DET-3x (tester c16aad856), 70/338, all diff-editor (RbDiffEditor) methods GREEN. Chain-complete. (R30.6 umbrella stays open pending T30.6.6 entry-point + T30.6.7 OOSH-repo-targeting usability tasks.)

## Subtasks

None (atomic task).
