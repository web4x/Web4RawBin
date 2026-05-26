[Back to Sprint 15 Planning](./planning.md)

# T104: Object.verb Use-Case Diagrams

[task:uuid:104d3e4f-5061-4273-894a-d04040404104]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement (architect)
  - [ ] creating test cases
  - [x] implementing (architect — diagram authored + rendered)
  - [ ] testing (tester — verify renders + uc:uuid anchors resolve)
- [ ] QA Review
- [ ] Done

## Delivered (robbin-architect, 2026-05-26)
Authored `diagrams/object-verb-usecases.puml` (+ rendered `object-verb-usecases.svg`, 31KB, renders clean).
- **Object=noun, verb=method** (AC1): 7 objects as rectangles (Requirement, Task, UseCase, Class/Method, Implementation/Test, TraceGraph) with verb use cases (`requirement.show`, `task.list`, `requirement.link`, `graph.serialize/deserialize/validate+fix`, etc.) + a Router/Views surface (`router.navigate`, `view.render`, `view.liveUpdate`).
- **uc:uuid on every use case** (AC2): 16 v4 `[uc:uuid:…]` tags, one per use case — these are the anchors T101-T108 chain links resolve to.
- **Covers the T101-T108 surface** (AC3): object model (the 7 objects), routing (router.navigate = T103), defaultItemView/Detail/Overview (view.render = T105-T107), browser capstone (T108 consumes navigate+render+liveUpdate), consistency (graph.validate+fix = T102).
- **Routing legend** ties Object.verb to `#<type>.<verb>?<params>` ≈ OOSH CLI — coherent with the T103 design in this sprint.
- AC4/AC5: SVG checked in beside source; renders without syntax errors.
- NOTE: PlantUML names the SVG from the @startuml title; renamed to canonical `object-verb-usecases.svg`. Chain links across S15 tasks point at this file — stable.

## Traceability
- up
  - [requirement:uuid:35c3d4e5-f6a7-4b82-9c93-1d2e3f4a5b03](./requirements.md) — R15.3 Object.verb use-case diagrams
  - [Sprint 15 Planning](./planning.md)
  - Tron directive 2026-05-26
- down
  - None (atomic task)
- chain
  - **requirement:** R15.3 in [requirements.md](./requirements.md)
  - **use case:** the diagrams themselves (Object=noun, verb=method) — diagrams/object-verb-usecases.puml
  - **puml:** [diagrams/object-verb-usecases.puml](./diagrams/object-verb-usecases.puml)
  - **class/method:** N/A (authoring artifact — provides uc:uuid anchors for T101-T108)

## Task Description
Author Object.verb-style use-case PUML (Object=noun, verb=method) in
`diagrams/object-verb-usecases.puml` and render the corresponding SVG. Each use case
carries a `uc:uuid` tag so the chain links for T101-T108 resolve to a concrete diagram
element.

## Acceptance Criteria
- [ ] AC1: `diagrams/object-verb-usecases.puml` exists with Object=noun actors and verb=method use cases
- [ ] AC2: Every use case carries a `uc:uuid` tag (v4) referenced by at least one task chain
- [ ] AC3: Use cases cover the object.verb surface needed by T101-T108 (object model, routing, item view, list, detail/overview, browser)
- [ ] AC4: An SVG render of the PUML is produced and checked in alongside the source
- [ ] AC5: PlantUML source renders without syntax errors
- [ ] `npm run build` + version bump

## Dependencies
- **Requires:** T101 (object/verb names)
- **Enables:** chain links for T101-T108

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
*Owner: robbin-architect*
*Priority: 2 (diagram authoring)*
