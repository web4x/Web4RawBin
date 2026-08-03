<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 34.6: Element unit-actions appear on class-select in the tree (wire detail-shown) — RESIDUAL, rides R33.9/R33.7.4 [R-D2]

[task:uuid:f71fac7d-8be9-406f-b00f-fccf5e279820]

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

DONE: R-D2 built v0.8.40 (86fdde41d, class-select fires detail-shown so unit-actions appear; rides R33.9/R33.7.4) + chain-complete-to-Test (Impl a1a5be99 tests[]=[70ce56e9,070d8d75], markerPending=false, req mint 836ff1193, two-key both-dir) + REAL-WEBKIT @390 GREEN DET-3x (S34 4-gate sweep 5744070b7, served==HEAD 0.8.42, Safari 605.1.15 = Tron iPhone engine). Team-gated at Tron real engine -> Done.

## Traceability

  - up
    - [Sprint 34 Planning](./planning.md)
    - Requirement R34.6 `[requirement:uuid:ba3fe02e-b1e5-4013-b7e0-2b99c1f9b33a]`
  - down
    - None (atomic task)

## Task Description

R-D2 (residual). Modelelement unit actions already EXIST via R33.9 actionsForContext. RESIDUAL: ensure a class-select IN THE TREE dispatches rb-drawer-detail-shown{type:'modelelement',ref} (so setActions fires) + sets active-diagram (R34.4) when applicable. Folds into the R-B/R-C action-bar wiring. NO new verb — ride R33.9/R33.7.4.

## Acceptance Criteria

- [x] (functional) A class-select IN THE TREE dispatches rb-drawer-detail-shown{type:'modelelement',ref} so setActions fires.
- [x] (functional) Modelelement unit verbs (+ membership if a diagram is active, R34.4) appear in the action bar on class-select.
- [x] (functional) Rides R33.9 actionsForContext + R33.7.4 (ride-existing; NO new verb/Method).
- [x] (gate) GATE @390 real-WebKit: select a class in the tree -> its unit verbs (+ membership if a diagram is active) appear in the bar.

## Subtasks

None (atomic task).
