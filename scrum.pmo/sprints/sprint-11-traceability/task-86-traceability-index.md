[Back to Sprint 11 Planning](./planning.md)

# T86: Traceability Index — Map All 89 Tasks to Chain Coverage

[task:uuid:b2e5d0a3-9c41-4f78-8d26-4e9f3a8b1c52]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Traceability
- up
  - [Sprint 11 Planning](./planning.md)
- down
  - None (atomic task)
- follows
  - [T85](./task-85-adopt-template.md) — uses the adopted standard's chain definition

## Task Description
Produce `scrum.pmo/traceability-matrix.md`: one row per task (all 89), columns for
presence of each chain link (requirement, use case, PUML, class/method) + the
task UUID. Baseline already measured (planning.md gap table); formalize it into a
living matrix that drives batch ordering for T87-T89.

## Context
Baseline: 89/89 have UUID; 20 link requirements, 19 use cases, 6 PUML, 15 code.
Sprints 1,3,4,5,6,10 lack requirements.md.

## Acceptance Criteria
- [ ] traceability-matrix.md lists all 89 tasks with per-link coverage
- [ ] Missing-artifact list per sprint (which need requirements.md / use cases / PUML)
- [ ] Batch order recommendation for T87-T89

## Dependencies
- **Requires:** T85 (chain definition)
- **Enables:** T87, T88, T89 (batches consume the matrix)

## Definition of Done
- [ ] Matrix published + batch order agreed
- [ ] Tron QA approved

## QA Audit & User Feedback
- Pending T85, then Tron QA.

## Subtasks
None (atomic task).

---
*Sprint 11 — Traceability Standardization*
*Owner: robbin-planner + robbin-req*
*Priority: 2 (HIGH — drives batches)*
