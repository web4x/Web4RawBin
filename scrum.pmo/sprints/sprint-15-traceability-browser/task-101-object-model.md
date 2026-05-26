[Back to Sprint 15 Planning](./planning.md)

# T101: Typed Object Model — Requirement/Test/Implementation classes + UUIDs

[task:uuid:101a0b1c-2d3e-4f50-8617-a01010101101]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement (architect)
  - [x] creating test cases
  - [x] implementing (expert)
  - [ ] testing (tester — run trace-model.test.ts)
- [ ] QA Review
- [ ] Done

## Implementation (robbin-expert, 2026-05-26, v0.5.8)
`src/ts/shared/TraceModel.ts` (shared — usable by server matrix-build + client browser views):
- **7 typed classes** (AC1): `Requirement`, `Task`, `UseCase`, `TraceClass` (`class` reserved → class named TraceClass, `type='class'`), `Method`, `Implementation`, `Test`. Each extends `TraceObject` with a readonly v4 `uuid` + `type` discriminator.
- **UUID validation (AC4):** `isUuidV4()` (strict v4 regex) enforced in the base constructor → throws on non-v4. `TraceGraph.register()` rejects duplicate UUIDs (constructor self-registers).
- **Typed links / navigable graph (AC2/AC3):** bidirectional via `TraceGraph.link(a,relation,b,inverse)`. Each subclass exposes TYPED add-methods + getters (e.g. `Requirement.addTask(Task)` / `get tasks(): Task[]`) — NO `any` at the API surface; getters resolve refs through the graph filtered by type. Full chain wired: req↔task↔useCase↔class↔method↔impl/test (both directions). Links are de-duplicated (Set-backed).
- **Object.verb / flat-JSON (Tron R1):** references stored route-like `${type}:${uuid}` (`toRef`/`refUuid`). `obj.toJSON()` → `{type,uuid,title,links:{relation:[ref...]}}`; `graph.toJSON()` → flat array; `TraceGraph.fromJSON()` rebuilds typed instances + relinks. No protocol — pure serialized state with references, as specified. `makeObject()` factory backs fromJSON.
- **Tests (AC5):** `test/vitest/trace-model.test.ts` — construction, v4 validation, non-v4 + duplicate rejection, full-chain bidirectional traversal, type-filtered + de-duped getters, flat-JSON round-trip. Authored by expert; **execution is robbin-tester's** (per role split). tsc + build clean.
- Foundation only — Object.verb ROUTING (T103) + MVC view binding (webcomponents) are downstream; architect designs T103. v0.5.8, sw.js cache rawbin-v0.5.8.

## Traceability
- up
  - [requirement:uuid:15a1b2c3-d4e5-4f60-8a71-9b0c1d2e3f01](./requirements.md) — R15.1 typed object model
  - [Sprint 15 Planning](./planning.md)
  - Tron directive 2026-05-26
- down
  - None (atomic task)
- chain
  - **requirement:** R15.1 in [requirements.md](./requirements.md)
  - **use case:** object model (Object=noun) — diagrams/object-verb-usecases.puml
  - **puml:** [diagrams/object-verb-usecases.puml](./diagrams/object-verb-usecases.puml)
  - **class/method:** Requirement / Test / Implementation / Task / UseCase / Class / Method (uuid-carrying)

## Task Description
Define TypeScript classes `Requirement`, `Test`, and `Implementation` (plus `Task`,
`UseCase`, and `Class`/`Method`), each carrying a UUID per the traceability standard.
This typed object graph is the authoritative source from which the traceability matrix
is built and against which consistency is validated.

## Acceptance Criteria
- [ ] AC1: `Requirement`, `Test`, `Implementation`, `Task`, `UseCase`, `Class`, `Method` TS classes exist, each exposing a stable `uuid` field per the traceability standard
- [ ] AC2: Each class carries the typed links needed to form the req→uc→puml→method→test chain (no untyped `any` references between objects)
- [ ] AC3: Objects construct a navigable typed object graph (a Requirement can resolve its Tasks/Tests/Implementations and vice-versa)
- [ ] AC4: UUIDs are v4-format and validated on construction; duplicate UUIDs are rejected
- [ ] AC5: Unit tests cover construction, UUID validation, and graph traversal for each class
- [ ] `npm run build` + version bump

## Dependencies
- **Requires:** None
- **Enables:** T102, T103, T105, T106, T107, T108

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
*Priority: 1 (foundation)*
