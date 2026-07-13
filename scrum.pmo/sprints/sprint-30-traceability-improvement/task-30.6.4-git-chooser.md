<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.6.4: Git ref chooser

[task:uuid:c7b46b72-b0a2-4556-b03d-2f298a738c47]

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
    - Requirement R30.6.4 `[requirement:uuid:7eb81522-7098-483f-9554-325b0c6017cd]`
  - down
    - [UC](./planning.md) `[uc:uuid:23070341-d340-49b9-afa6-ee4a152b521f]`

## Task Description

Add a git chooser to select the refs/commits/branches to 3-way-merge (base + two sides) from the repo.

## Context

Covers R30.6.4 (7eb81522). Class RbDiffEditor (code rb-diff-editor, RbFileTree/RbTraceTree convention). Part of R30.6 umbrella (12922d5d).

## Intention

S30 R30.6 3-way diff/merge editor (decomposed). Sub-task covering R30.6.4.

## Acceptance Criteria

- [x] (branch-commit) A chooser to pick a file from a specific git branch or commit, feeding it into the left OR right pane.

## Implementation

DONE-DELIVERED 2026-07-13: R30.6 3-way diff-editor core GATED GREEN 6/6 DET-3x (tester c16aad856), 70/338, all diff-editor (RbDiffEditor) methods GREEN. Chain-complete. (R30.6 umbrella stays open pending T30.6.6 entry-point + T30.6.7 OOSH-repo-targeting usability tasks.)

## Subtasks

None (atomic task).
