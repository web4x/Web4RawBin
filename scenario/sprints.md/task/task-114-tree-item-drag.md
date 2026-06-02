# T114: Tree-item — OS drag-and-drop
[task:uuid:a9341bae-656e-4e87-ab50-c9a17a7c9222]

## Status

- [ ] Planned
- [x] In Progress
  - [x] refinement (architect)
  - [ ] creating test cases
  - [x] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Traceability

**UseCases:**
- [🔗 objectItem.drag](../sprints.md/usecase/objectitem-drag.md)


## Traceability

`[task:uuid:a9341bae-656e-4e87-ab50-c9a17a7c9222]`

- up
  - [Sprint 16 Planning](./planning.md)
  - [compound-requirement-source.md](./compound-requirement-source.md) → **R16.6** (OS drag-and-drop)
- down
  - None (atomic task)
- chain (req → usecase → puml → class/method)
  - **requirement:** R16.6
  - **use case:** objectItem.drag [uc:uuid:16a01141-d141-4a01-b141-000000114001]
  - **puml:** [diagrams/s16-usecases.puml](./diagrams/s16-usecases.puml) (Phase 2 package)
  - **class/method:** `rb-object-item.ts` → `RbObjectItem.onDragStart()` (existing T105, verify after redesign)

## Task Description

Make the tree-item **draggable** so the user can perform **OS-specific** drag-and-drop
of the item (native HTML5 drag with appropriate dataTransfer payload; architect defines
the drop semantics/targets).

## Context

Tron 2026-05-27: "draggable so i could os specificly drag and drop the item."

## Acceptance Criteria

- [ ] AC1 — A tree-item can be dragged (native OS drag initiates)
- [ ] AC2 — Drag carries a meaningful payload (item identity / type) for OS drop targets
- [ ] AC3 — Drag does not break tap-collapse (T115) or children-expand (T115) interactions
- [ ] `npm run build` succeeds; version + sw.js bumped; no regression

## QA Audit & User Feedback

- 2026-05-27: Planned from compound source R16.6. Awaiting architect design, then Tron QA.

## Subtasks

None (atomic task).

---

*Sprint 16 — Traceability UX & DetailViews*
*Owner: robbin-expert (implement), robbin-tester (verify)*
*Priority: 5 (Phase 2 — tree-item drag)*
