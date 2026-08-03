<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 34.1: Universal orange «Scenario»+«Edit» default actions on ALL scenario-instance detail views (client) [R-A]

[task:uuid:175271d6-b8d7-4e02-b648-681bfe9dcfe7]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [x] Done

## Remaining Issues

DONE: R-A A1 built (universal «Scenario»+«Edit» default pair solved ONCE via actionsForContext/DEFAULT_ACTIONS, orange, no fork; built INTO the shared drawer = unified with R-E) + chain-complete-to-Test (Impl 005dbd3e onUniversalAction tests[]=[d8be524e], DISTINCT handler decl not a ride on R-E, markerPending=false 3194a16d5, req mint 7211d6c7d, two-key both-dir) + REAL-WEBKIT @390 GREEN DET-3x (A1 gate 8a2a6e8be / b89097eb8, served 0.8.44; HEAD 0.8.45; Safari 605.1.15 = Tron iPhone engine). Team-gated at Tron real engine -> Done. S34 7/7 COMPLETE.

## Traceability

  - up
    - [Sprint 34 Planning](./planning.md)
    - Requirement R34.1 `[requirement:uuid:793760f2-1c58-4dfa-ae8c-96f8ec4c8027]`
  - down
    - None (atomic task)

## Task Description

R-A (client half). Every scenario-instance detail view MUST render an orange «◆ Scenario» + «✎ Edit» DEFAULT action pair — generic, solved once for every scenario instance — reusing actionsForContext/DEFAULT_ACTIONS (model.ts); type-specific verbs append AFTER. Client-only (ride R33.6.5/R33.9 action-bar, no fork).

## Acceptance Criteria

- [x] (functional) Every scenario-instance detail view renders the «◆ Scenario» + «✎ Edit» default pair via actionsForContext/DEFAULT_ACTIONS, independent of and BEFORE any type-specific verbs.
- [x] (functional) «Scenario» dispatches to the instance's scenario-view (/scenario?ior=<ref>).
- [x] (functional) «Edit» opens the edit flow for that instance.
- [x] (functional) The default pair renders ORANGE (a .da-btn variant class), visually distinct from type-specific verbs.
- [x] (gate) GATE @390 real-WebKit: open ANY item detail -> the orange Scenario+Edit pair is present + functional; type-specific verbs append after.

## Subtasks

None (atomic task).
