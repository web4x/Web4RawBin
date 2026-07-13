<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.3: Sprint selection populates the detail drawer

[task:uuid:db8c2753-37c7-4dbf-94b3-6263da8310b9]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [ ] creating test cases
  - [x] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Traceability

  - up
    - [Sprint 30 Planning](./planning.md)
    - Requirement R30.3 `[requirement:uuid:6cd770df-0034-406e-b20c-bb8bddaadbf7]`
  - down
    - [UC](./planning.md) `[uc:uuid:9095cd05-5528-4450-a830-f9b858129ad2]`

## Task Description

Wire tree sprint-selection → detail drawer: when a sprint node is selected in the traceability tree, populate the detail drawer with that sprint's detail (goal + req/task summary) by routing the tree-selection event to the drawer render path.

## Context

Covers R30.3 (6cd770df). Part of the S30 traceability-tree track (ties T30.1 CurrentSprint tree).

## Intention

S30 Traceability Improvement — keep the traceability tree scaling + navigable. Stood up scenario-first on req's R30.2/R30.3 mint.

## Acceptance Criteria

- [ ] (drawer) Selecting a Sprint node populates the detail drawer with that sprint's detail (name/goal/slots).
- [ ] (drawer) The drawer is never empty/stale on sprint selection — renderDetailForRef handles the sprint case.

## Implementation

CODE DEPLOYED (per PO signal — R30.3 built+deployed, prod). status In Progress: implementing[x]; testing[ ] pending tester gate; ACs [ ] pending verification. Awaiting PO's next hop-signal (tester GREEN -> testing[x] -> QA Review).

## Subtasks

None (atomic task).
