# T102: Traceability Matrix Consistency + Fix Engine
[task:uuid:102b1c2d-3e4f-4051-9728-b02020202102]

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

**Tests:**
- [🔗 AC2/AC3/AC4/AC6](../test/ac2-ac3-ac4-ac6.md)


## Traceability

- up
  - [requirement:uuid:15a1b2c3-d4e5-4f60-8a71-9b0c1d2e3f01](./requirements.md) — R15.1 matrix consistency + fix
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

## Acceptance Criteria

- [ ] AC1: Engine loads the T101 typed object graph + scans the repo to build the live req→uc→puml→method→test chain
- [ ] AC2: Validation reports every broken/missing chain link with the offending UUID and a human-readable reason
- [ ] AC3: `fix` mode repairs drift (regenerates/updates `scrum.pmo/traceability-matrix.md`) without losing manually-authored content outside generated regions
- [ ] AC4: Engine is idempotent — running `fix` twice produces no further changes when the matrix is already consistent
- [ ] AC5: A `--check`/report-only mode exits non-zero on inconsistency (CI-usable) and zero when consistent
- [ ] AC6: Tests cover validate (clean + drifted fixtures) and fix (drift → consistent → idempotent)
- [ ] `npm run build` + version bump

## QA Audit & User Feedback

- 2026-05-26: Tron directive (Sprint 15 R1-R4). Quote in requirements.tron-literal.md.

## Subtasks

None (atomic task).

---
*Sprint 15 — Traceability Browser & Object Model*
*Owner: robbin-expert (implement), robbin-tester (verify)*
*Priority: 2 (consistency engine)*
