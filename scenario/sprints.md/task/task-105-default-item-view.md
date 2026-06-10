# T105: defaultItemView Web Component (draggable, native-OS)
[task:uuid:105e4f50-6172-4384-895b-e05050505105]

## Status

- [x] Planned
- [x] In Progress
  - [x] refinement (architect)
  - [x] creating test cases
  - [x] implementing (expert)
  - [x] testing (tester — run rb-object-item.test.ts, jsdom) — rb-object-item 5/5 PASS, 1d9d4fd
- [ ] QA Review
- [ ] Done

## Traceability

**UseCases:**
- [🔗 objectItem.render](../usecase/objectitem-render.md)

**Tests:**
- [🔗 R15.4](../test/r15-4.md)


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

- [ ] AC1: `<rb-object-item>` renders a typed object's default summary (title + `type:uuid` + optional status) for ALL 7 T101 types, attribute-driven (`ref`/`type`/`title`/`status`)
- [ ] AC2: Visually consistent with the lobby room entry — reuses the `.room-card` idiom (rounded translucent flex row; title + muted id sub-line + trailing status chip)
- [ ] AC3: `draggable="true"`; `dragstart` sets `text/plain`=`#<type>.show?uuid=…` and `application/rb-object-ref`=`type:uuid`
- [ ] AC4: `dataTransfer` also sets `text/uri-list`=absolute `${origin}/app#<type>.show?uuid=…` (OS-recognizable native drag)
- [ ] AC5: ViewBus subscribe-on-connect / unsubscribe-on-disconnect; `ViewBus.notify(ref)` re-renders (no reload) — T103 MVC path
- [ ] AC6: Click calls `TraceRouter.navigate(type,'show',{uuid})`
- [ ] AC7: Tests cover render-per-type, draggable + all three dataTransfer payloads, ViewBus live re-render, click→navigate
- [ ] `npm run build` + version bump

## QA Audit & User Feedback

- 2026-05-26: Tron directive (Sprint 15 R1-R4). Quote in requirements.tron-literal.md.

## Subtasks

None (atomic task).

---
*Sprint 15 — Traceability Browser & Object Model*
*Owner: robbin-expert (implement), robbin-tester (verify)*
*Priority: 3 (view components)*
