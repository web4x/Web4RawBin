[Back to README](../../README.md)

# Sprint 15 Planning — Traceability Browser & Object Model

## Sprint Goal
Build a typed Object model (Requirement/Test/Implementation + chain) with UUIDs
that keeps the traceability matrix consistent, expose Objects via the Object.verb
pattern (methods-as-routes, flat-JSON state, MVC live views), and surface a
tree-navigable **traceability browser next to the file browser** in Documentation —
with per-object item views, list+search, task DetailViews, and an always-consistent
planning Overview.

## Why This Sprint (Tron directive 2026-05-26)
Tron: "the planner shall plan a FULLY TRACEABLE sprint … complying to the Sprint 1
Task 1.x template standards." Verbatim requirements captured in
[requirements.tron-literal.md](./requirements.tron-literal.md); formalized in
[requirements.md](./requirements.md) (R15.1-R15.7). All tasks follow the
[traceability standard](../../standards/traceability-standard.md).

## Object.verb model (Tron, summarized)
Object = noun/class; verb = method ≈ OOSH CLI command ≈ route to a class instance
(method anchor + query params); attributes ≈ web-component attributes; web
components = Views; Objects do MVC live-updates to registered views; serialization =
flat JSON of object state with route-like references to other objects (no protocols).

## Inputs
- **Requirements:** [requirements.md](./requirements.md) (req-eng — R15.1-R15.7 + literal source)
- **Diagrams:** [diagrams/](./diagrams/) (architect — Object.verb use-case .puml/.svg)

## Task List

### Phase 1 — Object model + consistency (backend)
- [ ] [T101: Typed Object Model — Requirement/Test/Implementation classes + UUIDs](./task-101-object-model.md)
  **R15.1** · architect+expert · foundation · impl + testing DONE (v0.5.8; trace-model.test 8/8, 47ee53f) — Tron QA pending
- [ ] [T102: Traceability Matrix Consistency + Fix Engine](./task-102-matrix-consistency-engine.md)
  **R15.1** · expert+tester · requires T101 · impl-done (74b33ad v0.5.11) — testing pending (trace-consistency.test + npm run trace:check)
- [ ] [T103: Object.verb Routing + Flat-JSON Serialization + MVC Live Views](./task-103-object-verb-routing.md)
  **R15.2** · architect+expert · requires T101 · impl-done (fca4540 v0.5.13 — Router/VerbRegistry/ViewBus/rb-trace-view) — testing pending

### Phase 2 — Diagrams
- [ ] [T104: Object.verb Use-Case Diagrams](./task-104-object-verb-diagrams.md)
  **R15.3** · architect · requires T101 · impl-done (object-verb-usecases.puml/svg authored) — testing pending (renders + uc:uuid anchors)

### Phase 3 — Views (web components)
- [ ] [T105: defaultItemView Web Component (draggable, native-OS)](./task-105-default-item-view.md)
  **R15.4** · expert+tester · requires T103 · impl-done (950add4 v0.5.15 — rb-object-item) — testing pending
- [ ] [T106: ListOverview Component + Search → remoteSearch](./task-106-list-overview-search.md)
  **R15.5** · expert+tester · requires T105 · impl-done (e0df213 v0.5.16 — rb-list-overview + SearchProvider local→remote) — testing pending
- [ ] [T107: Task DetailViews + Planning Overview (always consistent)](./task-107-detail-overview-views.md)
  **R15.6** · expert+tester · requires T103 · impl-done (ce15c08 v0.5.17 — rb-detail-view + rb-overview computed-from-graph) — testing pending

### Phase 4 — Browser (capstone)
- [ ] [T108: Traceability Browser — tree-navigable graph in Documentation](./task-108-traceability-browser.md)
  **R15.7** · expert+tester · requires T102, T105, T106, T107 · impl-done (b2a1104 v0.5.18 — rb-trace-tree + GET /api/trace) — testing pending

## Dependency Graph
```
T101 (object model) ─┬─→ T102 (matrix consistency/fix) ─┐
                     ├─→ T103 (Object.verb routing/MVC) ─┤
                     └─→ T104 (use-case diagrams)         │
T103 ─┬→ T105 (defaultItemView) → T106 (ListOverview+search) ┤
      └→ T107 (DetailView + Overview) ───────────────────────┤
                                                              ▼
                                   T108 (traceability browser — tree, capstone)
```

## Sprint Totals
| Metric | Value |
|--------|-------|
| Tasks | 8 (T101-T108) |
| Tron QA-approved (Done) | 0/8 |
| Tested, awaiting Tron QA | 5 (T101, T102, T103, T105, T106) |
| Impl-done, testing pending | 3 (T104 diagram, T107 detail/overview, T108 browser capstone v0.5.18) |
| Note | All 8 S15 tasks now impl-complete; T104/107/108 awaiting tester verify |
| Requirements | R15.1-R15.7 (from Tron literal R1-R4) |
| Use case diagrams | 1 (Object.verb, architect) |

## Definition of Done
- [ ] Typed Object classes (Requirement/Test/Implementation + chain) with UUIDs
- [ ] Matrix consistency/fix engine keeps traceability-matrix.md true
- [ ] Object.verb routing + flat-JSON serialization + MVC live views
- [ ] Object.verb use-case diagrams published
- [ ] defaultItemView (draggable), ListOverview+search→remoteSearch, DetailView+Overview
- [ ] Traceability browser navigable as a tree, next to the file browser in Documentation
- [ ] Full chain per task (req→uc→puml→method→test); no regression
- [ ] Tron QA approved

## Coordination
- **req-eng:** formalize requirements.md from the literal source (UUIDs stable)
- **architect:** Object.verb design + use-case diagrams
- **expert/tester:** implement + verify per task
- **planner:** structure, planning↔task consistency, README + sprints.overview indexing
- Parallel sprints: S10-S14 (see overview). Next new task after this sprint = T109.

---
**Product Owner:** robbin-po (robbinTeam:0.0)
**Planner:** robbin-planner (robbinTeam:1.0)
**Req-eng:** robbin-req (robbinTeam:1.1)
**Tron:** research (iphone:0.0)
**Created:** 2026-05-26
**Sprint:** Sprint 15 — Traceability Browser & Object Model
