<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 34.6: Element unit-actions appear on class-select in the tree (wire detail-shown) — RESIDUAL, rides R33.9/R33.7.4 [R-D2]

[task:uuid:f71fac7d-8be9-406f-b00f-fccf5e279820]

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

Planned — cluster R-D2 (residual, rides R33.9/R33.7.4; folds into R-B/R-C action-bar wiring). RESIDUAL=class-select detail-shown dispatch, no new verb. Gate real-WebKit @390 on ship.

## Traceability

  - up
    - [Sprint 34 Planning](./planning.md)
    - Requirement R34.6 `[requirement:uuid:ba3fe02e-b1e5-4013-b7e0-2b99c1f9b33a]`
  - down
    - None (atomic task)

## Task Description

R-D2 (residual). Modelelement unit actions already EXIST via R33.9 actionsForContext. RESIDUAL: ensure a class-select IN THE TREE dispatches rb-drawer-detail-shown{type:'modelelement',ref} (so setActions fires) + sets active-diagram (R34.4) when applicable. Folds into the R-B/R-C action-bar wiring. NO new verb — ride R33.9/R33.7.4.

## Acceptance Criteria

- [ ] (functional) A class-select IN THE TREE dispatches rb-drawer-detail-shown{type:'modelelement',ref} so setActions fires.
- [ ] (functional) Modelelement unit verbs (+ membership if a diagram is active, R34.4) appear in the action bar on class-select.
- [ ] (functional) Rides R33.9 actionsForContext + R33.7.4 (ride-existing; NO new verb/Method).
- [ ] (gate) GATE @390 real-WebKit: select a class in the tree -> its unit verbs (+ membership if a diagram is active) appear in the bar.

## Subtasks

None (atomic task).
