<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 27.1: Task detail renders the status checklist visually

[task:uuid:dbd7e30d-263c-4d01-81eb-b687854ca961]

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
    - [Sprint 27 Planning](./planning.md)
    - Requirement R27.1 `[requirement:uuid:90b82d00-7af1-40e9-992c-c55ca177c542]`
  - crossRef
    - R22.1 (renders alongside the taskMdHref MD-file link)
  - down
    - [UC27.1: taskDetail.renderStatusChecklist](./planning.md#uc27-1) `[uc:uuid:050c5b9a-e5f4-46da-843f-44eb2b70994e]`

## Task Description

The Task detail view reads the task unit's model.statusChecklist (markdown) and renders it as a VISUAL checklist showing Planned / In Progress / QA Review / Done, with nested In-Progress sub-items (refinement, creating test cases, implementing, testing) indented. It appears alongside the MD-file link (R22.1).

## Context

Chain: R27.1 -> UC 050c5b9a taskDetail.renderStatusChecklist -> Class RbTaskDetail 4df19279 -> Method renderStatusChecklist bfd21995 -> Impl 31f420b0 (architect UC-refined 165874700). crossRef R22.1 (renders alongside the taskMdHref MD-file link).

## Intention

Tron: the task detail view should render the status checklist visually (not raw markdown) so progress is readable at a glance.

## Acceptance Criteria

- [x] (read) The status checklist is read from the task unit's model.statusChecklist field (markdown)
- [x] (render) The detail view renders it as a VISUAL checklist showing Planned / In Progress / QA Review / Done
- [x] (nested) Nested sub-items under 'In Progress' render indented: refinement, creating test cases, implementing, testing
- [x] (alongside) The status checklist appears in the Task detail view alongside the MD-file link (R22.1)
- [x] (verify) Verified live (headless): a task carrying a statusChecklist renders the visual checklist

## Implementation

SHIPPED v0.7.6 (renderStatusChecklist); expert tagged marker [impl:uuid:31f420b0] at renderStatusChecklist:94. Chain whole: R27.1 -> UC 050c5b9a -> Class RbTaskDetail 4df19279 -> Method renderStatusChecklist bfd21995 -> Impl 31f420b0. testing OPEN — flip testing[x] on a committed tester GREEN (#102). NOTE: RbTaskDetail is 1 of 23 dup classes -> canonicalized in the R27.2 migration (4df19279 = keep). ✓ DONE 2026-07-02: tester closed Test hop (dc94cff0 test:R27.1 renderStatusChecklist gate <- r264-v076-task-detail-gate.mjs, GREEN DET-3x), Impl 31f420b0.tests=[dc94cff0], 6 hops credit, 55/317. PO sign-off.

## Subtasks

None (atomic task).
