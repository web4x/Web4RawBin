<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# T103: Object.verb Routing + Flat-JSON Serialization + MVC Live Views

[task:uuid:103c2d3e-4f50-4162-8839-c03030303103]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement (architect)
  - [x] creating test cases
  - [x] implementing (expert)
  - [x] testing (tester — run trace-routing.test.ts, jsdom) — trace-routing 11/11 PASS, 1d9d4fd
- [ ] QA Review
- [ ] Done

## Traceability

- up
  - [requirement:uuid:38f80708-d191-47bd-ada4-a710c5f1e6ed](./requirements.md) — R15.2 Object.verb model
  - [Sprint 15 Planning](./planning.md)
  - Tron directive 2026-05-26
- down
  - None (atomic task)
- chain
  - **requirement:** R15.2 in [requirements.md](./requirements.md)
  - **use case:** object.verb routing — diagrams/object-verb-usecases.puml
  - **puml:** [diagrams/object-verb-usecases.puml](./diagrams/object-verb-usecases.puml)
  - **class/method:** Object.verb router; flat-JSON serializer; MVC view registry

## Task Description

Treat methods as routes (method anchor + query params, OOSH-CLI-like) and attributes as
web-component attributes. Objects push MVC live-updates to their registered views.
Object state serializes as flat JSON with route-like references to other objects (no
protocols), so the typed object graph is navigable and renderable.

## Dependencies

- **Requires:** T101
- **Enables:** T105, T106, T107, T108

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
*Owner: robbin-architect (design), robbin-expert (implement)*
*Priority: 2 (object.verb core)*
