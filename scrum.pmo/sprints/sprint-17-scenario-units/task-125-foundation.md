<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# T125: Scenario-unit primitives + class system + storage

[task:uuid:20cca741-0a93-4d93-8a51-9c72bdb77d92]

## Status
- [ ] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Traceability

`[task:uuid:20cca741-0a93-4d93-8a51-9c72bdb77d92]`

- up
  - [Sprint 17 Planning](./planning.md)
  - **requirements:** R17.1 scenario-unit · R17.2 IOR · R17.3 class-based instances · R17.4 UUID-prefix index · R17.5 sprints.json/ symlink tree · R17.6 sprints.md/ generated tree
  - **requirement:uuids** — formalized in T124.4 requirements.md
- down
  - T125.1 — `Unit` base + `IOR` primitive (load/resolve/serialize)
  - T125.2 — class system (Requirement/Task/UseCase/Class/Method/Test/Sprint over `{ior, model, ownerIor}`)
  - T125.3 — storage layout (scenario/index UUID-prefix + sprints.json/ symlink tree)
  - T125.4 — view template engine (per-class HTML+MD templates, live-update)
- chain (req → usecase → puml → class/method)
  - **requirement:** R17.1-R17.6 (T124.4)
  - **use case:** unit.load, ior.resolve, index.put, tree.symlink, template.register, view.render (T124.6 PUML)
  - **puml:** [diagrams/s17-usecases.puml](./diagrams/s17-usecases.puml)
  - **class/method:** new TypeScript module `src/ts/scenario/` — `Unit`, `IOR`, `Requirement`, `Task`, `UseCase`, `Class`, `Method`, `Test`, `Sprint`, `Index`, `TemplateRegistry`
- requires
  - T124 architecture + standards (refinement must be done)
- enables
  - T126 generated views, T127 navigation, T128 migration

## Task Description

Implement the scenario-unit primitives, the 7-class system over the uniform
`{ior, model, ownerIor}` wrapper, the storage layout, and the view template
engine. Architect's design (T124) is authoritative — this task converts it
into running code.

**Per the architecture (T124.1-T124.3):**
- T125.1 ships `Unit` and `IOR` primitives with load/resolve/serialize.
- T125.2 ships the 7 classes — each a thin wrapper extending `Unit` with class-specific `model` typings + relationship IOR fields.
- T125.3 ships the storage layer: writes `scenario/index/<5char>/<uuid>.scenario.json`; maintains the `scenarios/sprints.json/` symlink tree with speaking names.
- T125.4 ships the view template engine: registers per-class HTML + MD renderers; emits views from flat JSON (no class methods in the template path — purely functional rendering); wires live-update on JSON change.

## Dependencies

- **Requires:** T124 (architecture + standards)
- **Enables:** T126 views, T127 nav, T128 migration, T129 verify

## Definition of Done

- [ ] All AC met; sub-tasks T125.1-T125.4 committed
- [ ] Tests pass, build clean; rule-pair #15/#16 verified
- [ ] Tron QA approved

## QA Audit & User Feedback

- 2026-05-30: Planned — awaiting T124 refinement, then expert implementation per architect design.

## Subtasks

T125.1, T125.2, T125.3, T125.4 — files created by expert during refinement.

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views · Phase 2*
*Owner: robbin-expert (impl), robbin-tester (verify)*
*Priority: 2 (foundation implementation — gates Phase 3+)*
