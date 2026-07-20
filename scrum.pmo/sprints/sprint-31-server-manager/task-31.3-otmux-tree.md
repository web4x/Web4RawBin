<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 31.3: otmux session/pane tree in Server Manager (live, refreshable, selectable pane nodes)

[task:uuid:d5199875-0e47-4ce8-a756-ef3d29afc6eb]

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
    - [Sprint 31 Planning](./planning.md)
    - Requirement `[requirement:uuid:168e6d2b-439f-4c90-ab0c-47b2a10ccae0]`
  - down
    - [UC](./planning.md) `[uc:uuid:742aa04d-4dd8-46a6-bee1-f1b8ab9fa552]`

## Task Description

The Server Manager main view is a live tree of sessions -> windows -> panes mirroring 'otmux tree', read SERVER-SIDE via otmux (behind the R31.2 owner-guard). Refreshable; each pane node selectable + shows title/target so the owner identifies the agent pane.

## Context

designRef: scrum.pmo/sprints/sprint-31-server-manager/design-server-manager.md (architect 9920f6832 + d4f7fee8c). Owner token 41ad88c4-4dee-49ac-afcb-8a2026657b2d (Marcel Donges). Sprint 31 Server Manager = owner-gated infra console (otmux tree + xterm.js terminal).

## Intention

R31.3 = read-only tree (lower risk; build after gate+section, before the terminal).

## Acceptance Criteria

- [ ] The view renders sessions -> windows -> panes hierarchically, matching the structure of 'otmux tree'.
- [ ] The tree is read SERVER-SIDE via otmux (behind the owner-guard R31.2), not from any client-side enumeration.
- [ ] The tree is refreshable and reflects the current live session/pane state on refresh.
- [ ] Each pane node is selectable and displays its title/target (e.g. robbinTeam2:0.4 = robbin-req@...) so the owner can identify the agent pane.

## Subtasks

None (atomic task).
