<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.2: Eager child-count badges

[task:uuid:fc744c38-1c7f-4855-a8fe-b48a5545285f]

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
    - Requirement R30.2 `[requirement:uuid:850a339d-c7e5-4308-b2c7-65536bd5271e]`
  - down
    - [UC](./planning.md) `[uc:uuid:80cb8336-c758-49f6-80d9-dafe068ad71f]`

## Task Description

Render an EAGER child-count badge on each collapsed sprint node in the traceability tree — show the number of tasks/children as a badge WITHOUT expanding (loading) the node, so counts are visible at a glance while the payload stays lazy (structure-eager/count-eager, task-payload-lazy).

## Context

Covers R30.2 (850a339d). Part of the S30 traceability-tree track (ties T30.1 CurrentSprint tree).

## Intention

S30 Traceability Improvement — keep the traceability tree scaling + navigable. Stood up scenario-first on req's R30.2/R30.3 mint.

## Acceptance Criteria

- [ ] (tree) A collapsed node's badge shows its real childCount from server metadata BEFORE children load.
- [ ] (scaling) Counts are eager (from structure metadata); child PAYLOADS stay lazy until expand.
- [ ] (tree) CurrentSprint node + each Sprint node carry a correct child-count badge without expanding.

## Implementation

CODE DEPLOYED (per PO signal — R30.2 built+deployed, prod). status In Progress: implementing[x]; testing[ ] pending tester gate; ACs [ ] pending verification. Awaiting PO's next hop-signal (tester GREEN -> testing[x] -> QA Review).

## Subtasks

None (atomic task).
