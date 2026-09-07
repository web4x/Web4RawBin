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
