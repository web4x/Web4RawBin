[Back to Sprint 15 Planning](./planning.md)

# T107: Task DetailViews + Planning Overview (always consistent)

[task:uuid:107a6172-8394-45a6-897d-a07070707107]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement (architect)
  - [ ] creating test cases
  - [ ] implementing (expert)
  - [ ] testing (tester)
- [ ] QA Review
- [ ] Done

## Traceability
- up
  - [requirement:uuid:65f6a7b8-c9d0-4e15-9bc6-4a5b6c7d8e06](./requirements.md) — R15.6 DetailViews + Overview
  - [Sprint 15 Planning](./planning.md)
  - Tron directive 2026-05-26
- down
  - None (atomic task)
- chain
  - **requirement:** R15.6 in [requirements.md](./requirements.md)
  - **use case:** task.detail / planning.overview — diagrams/object-verb-usecases.puml
  - **puml:** [diagrams/object-verb-usecases.puml](./diagrams/object-verb-usecases.puml)
  - **class/method:** rb-detail-view, rb-overview components

## Task Description
Build a `DetailView` per task object (`rb-detail-view`) and an `Overview` rendering of
planning (`rb-overview`) that stays consistent with the underlying objects via live MVC.
The planning overview must always reflect the current typed object graph, never a stale
snapshot.

## Acceptance Criteria
- [ ] AC1: `rb-detail-view` renders a single task object's full detail (status, traceability, AC) from the T101 object
- [ ] AC2: `rb-overview` renders planning across task objects (e.g. sprint/status rollup)
- [ ] AC3: Both views subscribe to the T103 MVC live-update path — an object change updates the view without reload (always consistent)
- [ ] AC4: The Overview is derived from the typed objects, never a hand-maintained duplicate (no drift possible)
- [ ] AC5: Tests cover detail render, overview render, and live consistency on object change
- [ ] `npm run build` + version bump

## Dependencies
- **Requires:** T103
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
*Priority: 3 (view components)*
