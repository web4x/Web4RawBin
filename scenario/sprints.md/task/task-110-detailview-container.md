# T110: DetailViewContainer — Google-Maps-style detail drawer
[task:uuid:a1102f6c-7d04-4e91-b2a8-1f0e6c3d9b50]

## Status

- [x] Planned
- [x] In Progress
  - [x] refinement (req + architect)
  - [x] creating test cases
  - [x] implementing
  - [ ] testing (tester — independent verification pending)
- [ ] QA Review
- [ ] Done

> Sync per PO 2026-05-28: T110 shipped by expert (rb-detail-drawer + drawer
> integration, build clean, 791 tests pass). Testing handed to robbin-tester.
> QA Review + Done remain TRON's gate.

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Traceability

**UseCases:**
- [🔗 detailDrawer.open](../sprints.md/usecase/detaildrawer-open.md)
- [🔗 detailDrawer.close](../sprints.md/usecase/detaildrawer-close.md)
- [🔗 detailDrawer.swipeDismiss](../sprints.md/usecase/detaildrawer-swipedismiss.md)


## Traceability

`[task:uuid:a1102f6c-7d04-4e91-b2a8-1f0e6c3d9b50]`

- up
  - [Sprint 16 Planning](./planning.md)
  - [compound-requirement-source.md](./compound-requirement-source.md) → **R16.1** (DetailViewContainer)
- down
  - None (atomic task)
- chain (req → usecase → puml → class/method)
  - **requirement:** R16.1
  - **use case:** detailDrawer.open [uc:uuid:16a01001-d001-4a01-b001-000000110001], detailDrawer.close [uc:uuid:16a01002-d002-4a02-b002-000000110002], detailDrawer.swipeDismiss [uc:uuid:16a01003-d003-4a03-b003-000000110003]
  - **puml:** [diagrams/s16-usecases.puml](./diagrams/s16-usecases.puml) (Phase 1 package)
  - **class/method:** `src/public/ts/trace/rb-detail-drawer.ts` → `RbDetailDrawer.open()`, `close()`, `swipeDismiss()`

## Task Description

Create a dedicated **DetailViewContainer** — a drawer-like detail area (like the
room chat's drawer / Google-Maps detail drawer) on /trace. It holds specialized
DetailViews (see T111). Clicking a tree item shows that item's details inside the
container. (Exact files/lines pending architect design.)

## Context

Tron 2026-05-27 (verbatim in compound-requirement-source.md): "the chat in the room
has a drawer like detail area like in google maps. create a dedicated
DetailViewContainer that can contain specialized DetailViews … show the details
there when i click on the items on the traceability tree."

## Acceptance Criteria

- [ ] AC1 — A drawer-style container exists on /trace, modeled on the room chat drawer
- [ ] AC2 — Clicking a traceability tree item shows its details in the container
- [ ] AC3 — Container hosts pluggable DetailViews (integration point for T111)
- [ ] `npm run build` succeeds; version + sw.js bumped; no regression

## QA Audit & User Feedback

- 2026-05-27: Planned from compound source R16.1. Awaiting req split + architect design, then Tron QA.

## Subtasks

None (atomic task).

---

*Sprint 16 — Traceability UX & DetailViews*
*Owner: robbin-expert (implement), robbin-tester (verify)*
*Priority: 1 (Phase 1 — drawer foundation)*
