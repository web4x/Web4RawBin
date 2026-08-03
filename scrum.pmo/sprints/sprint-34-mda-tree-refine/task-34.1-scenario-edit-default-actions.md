<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 34.1: Universal orange «Scenario»+«Edit» default actions on ALL scenario-instance detail views (client) [R-A]

[task:uuid:175271d6-b8d7-4e02-b648-681bfe9dcfe7]

## Status
- [x] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

Planned — cluster R-A client half (build LAST). Generic default-action pair solved ONCE via actionsForContext/DEFAULT_ACTIONS (no fork). Gate real-WebKit @390 on ship.

## Traceability

  - up
    - [Sprint 34 Planning](./planning.md)
    - Requirement R34.1 `[requirement:uuid:793760f2-1c58-4dfa-ae8c-96f8ec4c8027]`
  - down
    - None (atomic task)

## Task Description

R-A (client half). Every scenario-instance detail view MUST render an orange «◆ Scenario» + «✎ Edit» DEFAULT action pair — generic, solved once for every scenario instance — reusing actionsForContext/DEFAULT_ACTIONS (model.ts); type-specific verbs append AFTER. Client-only (ride R33.6.5/R33.9 action-bar, no fork).

## Acceptance Criteria

- [ ] (functional) Every scenario-instance detail view renders the «◆ Scenario» + «✎ Edit» default pair via actionsForContext/DEFAULT_ACTIONS, independent of and BEFORE any type-specific verbs.
- [ ] (functional) «Scenario» dispatches to the instance's scenario-view (/scenario?ior=<ref>).
- [ ] (functional) «Edit» opens the edit flow for that instance.
- [ ] (functional) The default pair renders ORANGE (a .da-btn variant class), visually distinct from type-specific verbs.
- [ ] (gate) GATE @390 real-WebKit: open ANY item detail -> the orange Scenario+Edit pair is present + functional; type-specific verbs append after.

## Subtasks

None (atomic task).
