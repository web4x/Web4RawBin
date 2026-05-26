[Back to Sprint 15 Planning](./planning.md)

# T105: defaultItemView Web Component (draggable, native-OS)

[task:uuid:105e4f50-6172-4384-895b-e05050505105]

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
  - [requirement:uuid:45d4e5f6-a7b8-4c93-9da4-2e3f4a5b6c04](./requirements.md) — R15.4 defaultItemView
  - [Sprint 15 Planning](./planning.md)
  - Tron directive 2026-05-26
- down
  - None (atomic task)
- chain
  - **requirement:** R15.4 in [requirements.md](./requirements.md)
  - **use case:** object.itemView — diagrams/object-verb-usecases.puml
  - **puml:** [diagrams/object-verb-usecases.puml](./diagrams/object-verb-usecases.puml)
  - **class/method:** rb-object-item web component (defaultItemView)

## Task Description
Build a per-object default list item view (`rb-object-item`), visually like the lobby
room entry, with native-OS draggable support (HTML5 drag plus file/dnd integration). It
renders any typed object's summary and serves as the building block for ListOverview.

## Acceptance Criteria
- [ ] AC1: `rb-object-item` web component renders a typed object's default summary (label/title/status) for any object type from T101
- [ ] AC2: The item view is visually consistent with the existing lobby room entry
- [ ] AC3: HTML5 `draggable` is enabled and the item exposes its object reference via drag dataTransfer (native-OS drag)
- [ ] AC4: File/dnd integration works — dragging produces an OS-recognizable payload (e.g. text/uri-list or file) per native-OS drag
- [ ] AC5: Component is driven by the T103 MVC live-update path (object change re-renders the item)
- [ ] AC6: Tests cover render, draggable attribute, drag dataTransfer payload, and live re-render
- [ ] `npm run build` + version bump

## Dependencies
- **Requires:** T103
- **Enables:** T106, T108

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
*Owner: robbin-expert (implement), robbin-tester (verify)*
*Priority: 3 (view components)*
