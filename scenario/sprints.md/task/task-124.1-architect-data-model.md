# T124.1: Architect — Scenario-Unit + IOR Data Model
[task:uuid:e83d47a1-6cf2-4b19-ae53-8f7d2c014b61]

## Status

- [x] Planned
- [x] In Progress
  - [x] refinement (architect — Tron-refined)
  - [ ] creating test cases
  - [ ] implementing
  - [x] testing (design task: architect self-review via Tron-iteration 1316b7e + 1d80807 + 0fc5b90 — PO 2026-05-31)
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Traceability

`[task:uuid:e83d47a1-6cf2-4b19-ae53-8f7d2c014b61]`

- up
  - [T124: Scenario-unit + IOR + class-based view architecture](./task-124-architecture.md)
  - [compound-requirement-source.md](./compound-requirement-source.md) → **R17.1** (scenario JSON unit), **R17.2** (IOR), **R17.3** (class-based instances)
- down
  - None (atomic sub-task)
- chain (req → usecase → puml → class/method)
  - **requirement:** R17.1 + R17.2 + R17.3
  - **use case:** unit.load [uc:uuid:17a00101-0001-4a01-a001-000017010001], ior.resolveClass [uc:uuid:17a00102-0002-4a02-a002-000017010002], ior.resolveInstance [uc:uuid:17a00103-0003-4a03-a003-000017010003]
  - **puml:** [diagrams/s17-usecases.puml](./diagrams/s17-usecases.puml) (Phase 1 package)
  - **class/method:** ScenarioUnit, IORResolver, ClassRegistry (design — impl in T125)

## Task Description

Design the scenario-unit JSON shape, IOR format, class registry, and loading protocol. Refined per Tron clarification: the outer `ior` is the CLASS LOADER IOR, not the instance UUID.

## Context

Tron 2026-05-30 (verbatim in compound-requirement-source.md): "the json has { ior, model, ownerIor } model contains all attributes and ior relationships to other instances."
Tron clarification: "the outer ior is the IOR to the CLASS LOADER (e.g. task.class) that loads the right class to process this scenario."

## Acceptance Criteria

- [x] AC1 — Scenario unit JSON shape `{ior, model, ownerIor}` defined with `ior` = class loader
- [x] AC2 — IOR format defined: `ior:class:<Name>`, `ior:instance:<uuid>`, `ior:file:<path>`
- [x] AC3 — Loading protocol defined: read ior → resolve class → instantiate → populate model+ownerIor
- [x] AC4 — All 7 class models defined (Sprint, Task, Requirement, UseCase, Class, Method, Test)
- [x] AC5 — Compatibility with existing TraceModel documented
- [ ] AC6 — PO + Tron reviewed

## QA Audit & User Feedback

- 2026-05-30: Design authored, refined per Tron clarification (ior = class loader). Awaiting PO + Tron review.
- 2026-05-30: Planner audit flag — missing template sections. Fixed.

## Subtasks

None (atomic sub-task).
