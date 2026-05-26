[Back to Sprint 11 Planning](./planning.md)

# T86: Traceability Index — Map All 89 Tasks to Chain Coverage

[task:uuid:b2e5d0a3-9c41-4f78-8d26-4e9f3a8b1c52]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
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
- [x] traceability-matrix.md lists all Sprint 1-9 tasks (86) with per-link coverage — published at `scrum.pmo/traceability-matrix.md`
- [x] Missing-artifact list per sprint (requirements.md absent in Sprints 1-7; puml ~absent everywhere)
- [x] Batch order recommendation for T87-T89

## Findings (planner, 2026-05-26 — written into matrix)
Scope corrected to Sprints 1-9 = **86 tasks** (S10-13 excluded; S10 handled live).
- **task:uuid 86/86** ✓ — no remediation.
- **requirement 20/86, usecase 19/86** — adopted only from mid-Sprint-8; Sprints 1-7 are 0/0.
- **requirements.md missing in 7/9 sprints** (1-7) → T89 must author them (biggest lift).
- **puml 5/86** — near-absent; architect use-case .puml needed across all batches.
- **method 27/86** — partial; strongest in S1-3.
Batch order (refines plan): **T87** = S8,9 (lightest, req+uc done — add puml/method/uc:uuid); **T88** = S5,6,7 (author requirements.md+UC); **T89** = S1-4 (heaviest, author from scratch + Sprint-1 dup reconcile).

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
