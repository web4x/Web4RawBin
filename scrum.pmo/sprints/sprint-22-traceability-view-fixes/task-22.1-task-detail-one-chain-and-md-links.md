<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 22.1: Task detail — one chain section + Forward Links to MD task file

[task:uuid:270107db-88a7-425e-9950-a03846e41d8e]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [ ] QA Review
- [ ] Done

## Traceability

  - up
    - [Sprint 22 Planning](./planning.md)
    - Requirement R22.1 `[requirement:uuid:661836fd-2db8-4863-8556-0d698c897cd5]`
  - down
    - [UC-VF.1: taskDetail.renderSingleChainAndMdLink](./planning.md#uc-vf1) `[uc:uuid:4d0e454a-124a-43f7-8487-28aa61c12fbf]`
    - [Task 22.1.1: Dedupe chain section](./task-22.1.1-dedupe-chain-section.md)
    - [Task 22.1.2: Forward Links to MD task file](./task-22.1.2-forward-links-to-md-file.md)

## Task Description

The Task detail view must render exactly ONE Traceability Chain section — removing the false-duplicate empty "Traceability Chain: No chain" section that currently appears above the correctly-rendered chain — and its Forward Links section must show a link to the MD task documentation file (the sprint task file path) instead of the raw useCases IOR reference. Bundles two atomic behaviours (req-eng R-I flag); split into subtasks T22.1.1 (dedupe chain) + T22.1.2 (Forward Links → MD).

## Context

Traceability browser → Task detail view. The real chain renders correctly; an empty "No chain" section was rendering above it (false duplicate). Forward Links exposed the raw useCases reference instead of the navigable task doc.

## Intention

Tron screenshot directive (2026-06-29): one chain section only, and Forward Links must point at the human-readable MD task file, not the raw IOR.

## Acceptance Criteria

- [x] (issue 1 — dedupe chain) The Task detail view shows only ONE Traceability Chain section
- [x] The empty/false "Traceability Chain: No chain" section that rendered ABOVE the real chain is gone (removed or merged)
- [x] The remaining single chain section still renders the real chain correctly (no regression)
- [x] (issue 2 — Forward Links → MD) The Forward Links section links to the MD task documentation file, not the raw `useCases` IOR reference
- [x] The link resolves/opens the task's `.md` file in the sprint directory
- [x] Verified live (headless) — tester GREEN DET-3x v0.6.75 (commit c6560f97f); impl v0.6.75 (61b21fbf6, architect 35bec7d)

## Subtasks

- [Task 22.1.1: Dedupe chain section](./task-22.1.1-dedupe-chain-section.md) — remove the false-duplicate empty "No chain" section
- [Task 22.1.2: Forward Links to MD task file](./task-22.1.2-forward-links-to-md-file.md) — repoint Forward Links to the sprint task `.md` path
