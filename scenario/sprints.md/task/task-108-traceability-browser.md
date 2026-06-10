# T108: Traceability Browser — tree-navigable graph in Documentation
[task:uuid:108b7283-94a5-46b7-898e-b08080808108]

## Status

- [x] Planned
- [x] In Progress
  - [x] refinement (architect)
  - [x] creating test cases
  - [x] implementing (expert)
  - [ ] testing (tester — rb-trace-tree.test.ts + e2e)
- [ ] QA Review
- [ ] Done

## Traceability

**UseCases:**
- [🔗 traceTree.expandChain](../usecase/tracetree-expandchain.md)

**Methods:**
- [🔗 RbTraceTree.nodeEl](../method/rbtracetree-nodeel.md)
- [🔗 RbTraceTree.renderSeed](../method/rbtracetree-renderseed.md)

**Tests:**
- [🔗 R15.7](../test/r15-7.md)


## Traceability

- up
  - [requirement:uuid:75a7b8c9-d0e1-4f26-8cd7-5b6c7d8e9f07](./requirements.md) — R15.7 traceability browser
  - [Sprint 15 Planning](./planning.md)
  - Tron directive 2026-05-26
- down
  - None (atomic task)
- chain
  - **requirement:** R15.7 in [requirements.md](./requirements.md)
  - **use case:** traceability.browse (tree) — diagrams/object-verb-usecases.puml
  - **puml:** [diagrams/object-verb-usecases.puml](./diagrams/object-verb-usecases.puml)
  - **class/method:** /docs traceability browser + tree graph (integrates item/list/detail/overview)

## Task Description

Add a traceability browser NEXT TO the file browser in the Documentation, letting users
navigate the traceability graph as a TREE. It integrates the
`defaultItemView`/`ListOverview`/`DetailView`/`Overview` components into a single
browsing experience over the typed object graph. This is the sprint capstone.

## Acceptance Criteria

- [ ] AC1: A `<rb-trace-tree>` traceability browser renders NEXT TO the existing `<rb-file-tree>` file browser in the `/edit` Documentation UI (sibling panel or toggle)
- [ ] AC2: The graph is navigable as a TREE — expand/collapse `requirement→task→useCase→class→method→test` chain nodes; node rows reuse T105 `<rb-object-item>`; expand state persisted
- [ ] AC3: Integrates T105 defaultItemView (node rows), T106 ListOverview (search/flat toggle), T107 DetailView + Overview (detail/planning panes)
- [ ] AC4: Selecting a node calls `TraceRouter.navigate(type,'show',{uuid})` → opens its DetailView; tree highlight + detail stay consistent via T103 ViewBus
- [ ] AC5: Tree built from the T102 consistency-validated graph (`GET /api/trace` = scanRepo→`graph.toJSON()`); broken/dangling nodes shown WITH a warning marker (not silently dropped)
- [ ] AC6: Tests cover tree render, expand/collapse navigation, node-select→detail, and integration of the four view components
- [ ] `npm run build` + version bump

## QA Audit & User Feedback

- 2026-05-26: Tron directive (Sprint 15 R1-R4). Quote in requirements.tron-literal.md.

## Subtasks

None (atomic task).

---
*Sprint 15 — Traceability Browser & Object Model*
*Owner: robbin-expert (implement), robbin-tester (verify)*
*Priority: 4 (capstone)*
