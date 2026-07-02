<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 22.1.1: Dedupe chain section — remove false-duplicate "No chain"

[task:uuid:2fd8291f-c644-4861-ac2b-938066ab3edd]

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
    - [Task 22.1: Task detail — one chain + MD links](./task-22.1-task-detail-one-chain-and-md-links.md)
    - Requirement R22.1 `[requirement:uuid:661836fd-2db8-4863-8556-0d698c897cd5]`
  - down
    - [UC-VF.1: taskDetail.renderSingleChainAndMdLink](./planning.md#uc-vf1) `[uc:uuid:4d0e454a-124a-43f7-8487-28aa61c12fbf]`

## Task Description

Remove (or merge) the false-duplicate empty "Traceability Chain: No chain" section that renders ABOVE the correctly-rendered chain in the Task detail view, so exactly one Traceability Chain section remains.

## Intention

Issue 1 of R22.1: one chain section only.

## Acceptance Criteria

- [x] The Task detail view shows only ONE Traceability Chain section
- [x] The empty/false "Traceability Chain: No chain" section above the real chain is gone
- [x] The remaining single chain section renders the real chain correctly (no regression)
- [x] Verified live (headless) — tester GREEN DET-3x v0.6.75 (c6560f97f)

## Implementation

 ✓ TRON-ACCEPTED 2026-07-01 (Tron QA review pass) -> DONE (full-AC).

## Subtasks

None (atomic task).
