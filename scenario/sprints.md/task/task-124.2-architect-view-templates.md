# T124.2: Architect — View Template Architecture
[task:uuid:b72e58c4-91d3-4a07-b845-3c6f1d92e7a0]

## Status

- [x] Planned
- [x] In Progress
  - [x] refinement (architect)
  - [ ] creating test cases
  - [ ] implementing
  - [x] testing (design task: architect self-review via Tron-iteration 14b2821 + 44f9dce — PO 2026-05-31)
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Traceability

**UseCases:**
- [🔗 tree.generateMd](../usecase/tree-generatemd.md)
- [🔗 view.renderHtml](../usecase/view-renderhtml.md)
- [🔗 view.renderMd](../usecase/view-rendermd.md)


## Traceability

`[task:uuid:b72e58c4-91d3-4a07-b845-3c6f1d92e7a0]`

- up
  - [T124: Scenario-unit + IOR + class-based view architecture](./task-124-architecture.md)
  - [compound-requirement-source.md](./compound-requirement-source.md) → **R17.7** (HTML view templates per class), **R17.8** (views generated + live-updated), **R17.9** (planning.md = generated task overview), **R17.10** (sprint overview = list of sprint items)
- down
  - None (atomic sub-task)
- chain (req → usecase → puml → class/method)
  - **requirement:** R17.7 + R17.8 + R17.9 + R17.10
  - **use case:** view.renderHtml [uc:uuid:17a00301-0001-4a01-a001-000017030001], view.renderMd [uc:uuid:17a00302-0002-4a02-a002-000017030002], view.liveUpdate [uc:uuid:17a00303-0003-4a03-a003-000017030003], planning.generate [uc:uuid:17a00304-0004-4a04-a004-000017030004]
  - **puml:** [diagrams/s17-usecases.puml](./diagrams/s17-usecases.puml) (Phase 3 package)
  - **class/method:** ViewTemplateRegistry (design — impl in T126)

## Task Description

Design the view template architecture: per-class HTML + MD templates, registered against class IORs, pure-function rendering from scenario JSON, live-updated via ViewBus.

## Context

Tron 2026-05-30 (verbatim): "the templates should be like the html registered view for the classes Requirement, Task, UseCase … each Task and requirement shall have its own md, html view strictly from the view templates. views are purely generated and live updated from the flat json data."

## Acceptance Criteria

- [x] AC1 — Template registry design: class IOR → HTML template + MD template
- [x] AC2 — 7 class templates defined (Sprint, Task, Requirement, UseCase, Class, Method, Test)
- [x] AC3 — Pure-function rendering: template(scenario) → HTML string / MD string
- [x] AC4 — Live-update strategy via ViewBus documented
- [x] AC5 — planning.md + sprint overview as generated views documented
- [ ] AC6 — PO + Tron reviewed

## QA Audit & User Feedback

- 2026-05-30: Design authored. Awaiting PO + Tron review.

## Subtasks

None (atomic sub-task).

---
