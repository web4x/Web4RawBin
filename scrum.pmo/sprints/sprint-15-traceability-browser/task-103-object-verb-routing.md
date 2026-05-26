[Back to Sprint 15 Planning](./planning.md)

# T103: Object.verb Routing + Flat-JSON Serialization + MVC Live Views

[task:uuid:103c2d3e-4f50-4162-8839-c03030303103]

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
  - [requirement:uuid:25b2c3d4-e5f6-4a71-9b82-0c1d2e3f4a02](./requirements.md) — R15.2 Object.verb model
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

## Acceptance Criteria
- [ ] AC1: A `verb` (method) is addressable as a route — method anchor plus query params resolve to a class instance method invocation
- [ ] AC2: Object attributes map to web-component attributes (set/get round-trips through the component)
- [ ] AC3: Objects register views and emit MVC live-updates; a state change pushes to all registered views without a full reload
- [ ] AC4: `serialize()` produces flat JSON of object state, with references to other objects as route-like strings (no protocol/transport coupling)
- [ ] AC5: `deserialize()` reconstructs the object graph from flat JSON, resolving route-like references back to typed objects
- [ ] AC6: Tests cover route resolution, attribute round-trip, MVC update propagation, and serialize/deserialize fidelity
- [ ] `npm run build` + version bump

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
