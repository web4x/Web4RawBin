<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.6.3: Per-hunk take-over

[task:uuid:ec368634-9acf-4104-bec8-8a46b3c47144]

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
    - Requirement R30.6.3 `[requirement:uuid:1d0cf9b9-b0c2-4881-b53b-65d187654f68]`
  - down
    - [UC](./planning.md) `[uc:uuid:73d0fd09-ad4b-4a19-8eda-09eabd261700]`

## Task Description

Implement per-hunk take-over: the user accepts/rejects individual diff hunks (take ours or theirs per hunk) to build the merged result.

## Context

Covers R30.6.3 (1d0cf9b9). Class DiffMergeEditor. Part of R30.6 umbrella (12922d5d).

## Intention

S30 R30.6 3-way diff/merge editor (decomposed). Sub-task covering R30.6.3.

## Acceptance Criteria

- [ ] (per-hunk) Per-hunk buttons: left->center and right->center (+ the reverse center->side) to take over a diff hunk.
- [ ] (merged-build) Applying take-overs incrementally BUILDS the center merged file from the chosen hunks.

## Implementation

STOOD UP (planning) — status Planned; chain-build awaits architect design.

## Subtasks

None (atomic task).
