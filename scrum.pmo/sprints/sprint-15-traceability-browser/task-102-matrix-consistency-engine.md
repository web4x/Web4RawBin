<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# T102: Traceability Matrix Consistency + Fix Engine

[task:uuid:e06994e0-9ef1-4cf2-b24e-2d9bc70fa9c5]

## Status
- [x] Planned
- [x] In Progress
  - [ ] refinement (architect — implemented ahead of refinement per PO; architect to review scan heuristics)
  - [x] creating test cases
  - [x] implementing (expert)
  - [x] testing (tester — run trace-consistency.test.ts + `npm run trace:check`) — trace-consistency 10/10 PASS, 1d9d4fd; trace:check engine flags 14 repo gaps = working as intended
- [ ] QA Review
- [ ] Done

## Traceability

- up
  - [requirement:uuid:05284ac5-131a-4e10-a2f7-7215e026e438](./requirements.md) — R15.1 matrix consistency + fix
  - [Sprint 15 Planning](./planning.md)
  - Tron directive 2026-05-26
- down
  - None (atomic task)
- chain
  - **requirement:** R15.1 in [requirements.md](./requirements.md)
  - **use case:** matrix.fix (validate + repair drift) — diagrams/object-verb-usecases.puml
  - **puml:** [diagrams/object-verb-usecases.puml](./diagrams/object-verb-usecases.puml)
  - **class/method:** MatrixConsistency engine — validate() / report() / fix()

## Task Description

A TypeScript engine that reads the typed objects (T101) plus the repository, validates
the full req→uc→puml→method→test chain, and reports any inconsistencies. It also FIXES
detected drift, keeping `scrum.pmo/traceability-matrix.md` consistent with the typed
object graph.

## Dependencies

- **Requires:** T101
- **Enables:** T108

## Definition of Done

- [ ] All AC met; chain links resolve
- [ ] Tests pass, build clean
- [ ] Tron QA approved

## QA Audit & User Feedback

- 2026-05-26: Tron directive (Sprint 15 R1-R4). Quote in requirements.tron-literal.md.

## Subtasks

None (atomic task).

---
*Sprint 15 — Traceability Browser & Object Model*
*Owner: robbin-expert (implement), robbin-tester (verify)*
*Priority: 2 (consistency engine)*
