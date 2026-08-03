<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 34.4: Element remove-from-diagram appears in the bar (wire active-diagram context) — RESIDUAL, rides R33.9 [R-C]

[task:uuid:0bd2fa1a-15f9-4bad-80cd-569259f1ab57]

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

Planned — cluster R-C (residual, rides R33.9; build after R-D1). RESIDUAL=active-diagram context wiring only, no new verb. Gate real-WebKit @390 on ship.

## Traceability

  - up
    - [Sprint 34 Planning](./planning.md)
    - Requirement R34.4 `[requirement:uuid:21d3df6c-bd67-46db-af28-f161069d789e]`
  - down
    - None (atomic task)

## Task Description

R-C (residual). The R33.9 remove-from-diagram verb (model.ts:75, removeFromDiagram handler) already EXISTS but shows only when a diagram is active. RESIDUAL: ensure rb-active-diagram{uuid} fires when a diagram is viewed AND an element is selected from THAT diagram, so membership verbs (incl remove-from-diagram) appear. NO new verb — ride R33.9.

## Acceptance Criteria

- [ ] (functional) When a diagram is being viewed AND an element is selected from THAT diagram, rb-active-diagram{uuid} fires so membership verbs (incl remove-from-diagram) appear in the bar.
- [ ] (functional) The EXISTING R33.9 remove-from-diagram verb removes the element FROM the diagram - no new verb fabricated.
- [ ] (functional) Rides R33.9 actionsForContext + removeFromDiagram (ride-existing; NO new Method/Impl - the chain reuses the built R33.9 nodes).
- [ ] (gate) GATE @390 real-WebKit: select an element that IS in the open diagram -> remove-from-diagram shows + works.

## Subtasks

None (atomic task).
