<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 25.6: Scenario link on ALL detail views

[task:uuid:ee367cbd-913b-4153-8c3b-0cdd9a703e01]

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
    - [Sprint 25 Planning](./planning.md)
    - Requirement R25.6 `[requirement:uuid:24509e35-8627-402a-ba93-ed959fef3a5b]`
  - down
    - [UC-SL.1: detail.scenarioLink](./planning.md#uc-sl1) `[uc:uuid:dc468781-714b-429d-8dff-2ee243a81e51]`

## Task Description

Every detail-view component renders a 📄 Scenario link to its own underlying scenario unit, so any detail view (task, WebItem, member, file, requirement, etc.) exposes a one-click path to the unit that backs it — uniformly across ALL detail components.

## Context

Impl base: src/public/ts/trace/rb-*-detail.ts (the detail-view components: rb-task-detail, rb-webitem-detail, rb-detail-drawer, member/file detail) — add a uniform 📄 Scenario link to each. Scenario-first (RULE #126): unit exists before impl — no code yet. Dogfoods law #100/#103 (every view points back to its source unit).

## Intention

Tron: every detail view shall show a 📄 Scenario link to its underlying scenario unit (all detail components, uniformly).

## Acceptance Criteria

- [ ] (link) Every detail-view component renders a 📄 Scenario link
- [ ] (target) The link resolves to the underlying scenario unit (the /scenario or /md view of that unit's uuid)
- [ ] (universal) The link appears on ALL detail components uniformly (task, WebItem, member, file, requirement, drawer, ...), not just one
- [ ] (consistent) The 📄 Scenario affordance is placed/styled consistently across detail views

## Subtasks

None (atomic task).
