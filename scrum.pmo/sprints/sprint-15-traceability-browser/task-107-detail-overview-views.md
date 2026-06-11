<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# T107: Task DetailViews + Planning Overview (always consistent)

[task:uuid:7c8b7c8e-a94c-458e-932a-cda72ec6bc5c]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement (architect)
  - [x] creating test cases
  - [x] implementing (expert)
  - [ ] testing (tester — run rb-detail-overview.test.ts, jsdom)
- [ ] QA Review
- [ ] Done

## Traceability

- up
  - [requirement:uuid:e412e965-bcdf-4d33-97df-65c00d14e9c2](./requirements.md) — R15.6 DetailViews + Overview
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

- [ ] AC1: `<rb-detail-view ref=…>` renders a single object's full detail (title/type/uuid/status) + its typed links as clickable rows that `TraceRouter.navigate` to the linked object (chain-navigable both directions)
- [ ] AC2: `<rb-overview>` renders planning across Task objects — grouped by sprint with per-status rollup + a row per task (reusing T105 `<rb-object-item>`)
- [ ] AC3: Both subscribe to the T103 ViewBus — object/link change updates the view without reload (always consistent)
- [ ] AC4: The Overview is COMPUTED from the live typed graph every render (no hand-maintained duplicate, no cached snapshot) — drift structurally impossible
- [ ] AC5: `rb-detail-view` is the registered `show` verb handler; `rb-overview` the `planning.overview`/`task.list` handler (T103 VerbRegistry)
- [ ] AC6: Tests cover detail render + link-row navigation, overview rollup correctness, and live consistency on object/status change
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
