[Back to Planning](./planning.md)

# Sprint 15 — Traceability Browser & Object Model — Requirements

Formalized from [requirements.tron-literal.md](./requirements.tron-literal.md)
(Tron verbatim R1-R4). Per [traceability standard](../../standards/traceability-standard.md):
each requirement carries a `[requirement:uuid]` + forward link to its task(s).

> **req-eng:** authoring authority — formalize/refine the prose from the literal
> source. KEEP the UUIDs + forward links stable so task chain up-links don't break.
> **architect:** Object.verb design + use-case diagrams. **planner:** sprint structure.

## Requirements

- [ ] R15.1 — Typed Object model: `Requirement`, `Test`, `Implementation` (+ `Task`,
  `UseCase`, `Class`/`Method`) TS classes carrying UUIDs per the traceability
  standard; a TS engine that enforces traceability-matrix CONSISTENCY and FIXES drift.
  [requirement:uuid:05284ac5-131a-4e10-a2f7-7215e026e438]
  > R1 (literal): typed classes for Requirement/Test/Implementation with UUIDs; "tracabilytimatrix consistency and fix".
  → [T101](./task-101-object-model.md), [T102](./task-102-matrix-consistency-engine.md)

- [ ] R15.2 — Object.verb model: Object=noun/class; verb=method ≈ OOSH CLI command
  ≈ route to a class instance (method anchor + query params); attributes ≈ web-component
  attributes; web components = Views; Objects do MVC live-updates to registered
  views; serialization = flat JSON of object state with references to other objects
  (route-like), no protocols.
  [requirement:uuid:38f80708-d191-47bd-ada4-a710c5f1e6ed]
  > R1 (literal): Object.verb; methods as routes w/ method anchor + query params; flat-JSON state w/ references; MVC view updates; no protocols.
  → [T103](./task-103-object-verb-routing.md)

- [ ] R15.3 — Object.verb use-case diagrams (Object=noun, verb=method).
  [requirement:uuid:35c3d4e5-f6a7-4b82-9c93-1d2e3f4a5b03]
  > R1 (literal): "Object.verb usecase diagramms."
  → [T104](./task-104-object-verb-diagrams.md)

- [ ] R15.4 — `defaultItemView` per object for lists — like the lobby room entry,
  with draggable native-OS support.
  [requirement:uuid:45d4e5f6-a7b8-4c93-9da4-2e3f4a5b6c04]
  > R3 (literal): defaultItemView for lists, similar to lobby room entry, draggable native-os support.
  → [T105](./task-105-default-item-view.md)

- [ ] R15.5 — `ListOverview` with search over listed objects, extensible to remoteSearch.
  [requirement:uuid:55e5f6a7-b8c9-4d04-8ab5-3f4a5b6c7d05]
  > R4 (literal): ListOverview with search → extensible to remoteSearch.
  → [T106](./task-106-list-overview-search.md)

- [ ] R15.6 — Task DetailViews + planning Overview that is ALWAYS consistent.
  [requirement:uuid:65f6a7b8-c9d0-4e15-9bc6-4a5b6c7d8e06]
  > R2 (literal): browser includes traceability to tasks as DetailViews and planning as Overview, always consistent.
  → [T107](./task-107-detail-overview-views.md)

- [ ] R15.7 — Traceability BROWSER next to the file browser in Documentation —
  tree-navigable traceability graph; integrates the Object views.
  [requirement:uuid:75a7b8c9-d0e1-4f26-8cd7-5b6c7d8e9f07]
  > R1+R2 (literal): navigable tree graph; add a traceability browser next to the file browser in the Documentation.
  → [T108](./task-108-traceability-browser.md)

## Forward Traceability
| Req | Task(s) | Use case | PUML | Class/method |
|-----|---------|----------|------|--------------|
| R15.1 | T101, T102 | Object model + matrix.fix | diagrams/object-verb-usecases.puml | Requirement/Test/Implementation/Task classes; MatrixConsistency engine |
| R15.2 | T103 | Object.verb routing | (same) | Object.verb router; flat-JSON serializer |
| R15.3 | T104 | (the diagrams themselves) | diagrams/object-verb-usecases.puml | N/A |
| R15.4 | T105 | object.itemView | (same) | rb-object-item web component |
| R15.5 | T106 | list.search / list.remoteSearch | (same) | rb-list-overview component |
| R15.6 | T107 | task.detail / planning.overview | (same) | rb-detail-view, rb-overview components |
| R15.7 | T108 | traceability.browse (tree) | (same) | /docs traceability browser + tree graph |

---
**Sprint:** Sprint 15 — Traceability Browser & Object Model
**Created:** 2026-05-26
**Standard:** [traceability-standard.md](../../standards/traceability-standard.md)
**Literal source:** [requirements.tron-literal.md](./requirements.tron-literal.md)
