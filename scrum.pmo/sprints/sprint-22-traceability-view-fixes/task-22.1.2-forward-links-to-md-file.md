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

- [ ] **(chain-dedup)** The Task detail view shows only ONE Traceability Chain section.
- [ ] **(chain-dedup)** The empty/false 'Traceability Chain: No chain' section that rendered ABOVE the real chain is gone (removed or merged).
- [ ] **(chain-dedup)** The remaining single chain section still renders the real chain correctly (no regression).
- [ ] **(forward-links-md)** The Forward Links section links to the MD task documentation file (the sprint task .md file path), not the raw useCases IOR reference.
- [ ] **(forward-links-md)** The link resolves/opens the task's .md file in the sprint directory.
- [ ] **(verify)** Verified live (headless) against the running app: the Task detail view matches the corrected layout.

## Implementation

 ✓ TRON-ACCEPTED 2026-07-01 (Tron QA review pass) -> DONE (full-AC).

## Subtasks

None (atomic task).
