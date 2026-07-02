<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 22.1.2: Forward Links to MD task file (not raw useCases IOR)

[task:uuid:f8789b53-65f2-44ed-8c1d-60f80f243bae]

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

Repoint the Forward Links section of the Task detail view to link to the MD task documentation file (the sprint task `.md` path) instead of the raw `useCases` IOR reference, so the link is navigable to the human-readable task doc.

## Intention

Issue 2 of R22.1: Forward Links → MD task file.

## Acceptance Criteria

- [x] The Forward Links section links to the MD task documentation file (sprint task file path)
- [x] The link is no longer the raw `useCases` IOR reference
- [x] The link resolves/opens the task's `.md` file in the sprint directory
- [x] Verified live (headless) — tester GREEN DET-3x v0.6.75 (c6560f97f)

## Implementation

 ✓ TRON-ACCEPTED 2026-07-01 (Tron QA review pass) -> DONE (full-AC).

## Subtasks

None (atomic task).
