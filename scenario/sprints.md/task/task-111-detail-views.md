# T111: Specialized DetailViews (TaskDetailView, RequirementDetailView)
[task:uuid:471b9c4a-378f-4e56-a990-28f82a998b80]

## Status

- [ ] Planned
- [x] In Progress
  - [x] refinement (req + architect)
  - [ ] creating test cases
  - [x] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Traceability

**UseCases:**
- [🔗 taskDetail.render](../sprints.md/usecase/taskdetail-render.md)
- [🔗 requirementDetail.render](../sprints.md/usecase/requirementdetail-render.md)
- [🔗 usecaseDetail.render](../sprints.md/usecase/usecasedetail-render.md)


## Traceability

`[task:uuid:471b9c4a-378f-4e56-a990-28f82a998b80]`

- up
  - [Sprint 16 Planning](./planning.md)
  - [compound-requirement-source.md](./compound-requirement-source.md) → **R16.2** (specialized DetailViews)
- down
  - None (atomic task)
- chain (req → usecase → puml → class/method)
  - **requirement:** R16.2
  - **use case:** taskDetail.render [uc:uuid:16a01101-d101-4a01-b101-000000111001], requirementDetail.render [uc:uuid:16a01102-d102-4a02-b102-000000111002], usecaseDetail.render [uc:uuid:16a01103-d103-4a03-b103-000000111003]
  - **puml:** [diagrams/s16-usecases.puml](./diagrams/s16-usecases.puml) (Phase 1 package)
  - **class/method:** `rb-task-detail.ts` → `RbTaskDetail.render()`, `rb-requirement-detail.ts` → `RbRequirementDetail.render()`, `rb-usecase-detail.ts` → `RbUseCaseDetail.render()`

## Task Description

Implement typed DetailViews rendered inside the DetailViewContainer (T110):
**TaskDetailView** and **RequirementDetailView**, extensible per object type. Each
renders the details of the selected tree item by type.

## Context

Tron 2026-05-27: "specialized DetailViews like eg TaskDetailView or
RequirementDetailView inside it and then show the details there when i click on the
items on the traceability tree."

## Acceptance Criteria

- [ ] AC1 — TaskDetailView renders a task's details inside the container
- [ ] AC2 — RequirementDetailView renders a requirement's details
- [ ] AC3 — View selection is by object type; adding a new type is a small, documented extension
- [ ] `npm run build` succeeds; version + sw.js bumped; no regression

## QA Audit & User Feedback

- 2026-05-27: Planned from compound source R16.2. Awaiting req split + architect design, then Tron QA.

## Subtasks

None (atomic task).

---

*Sprint 16 — Traceability UX & DetailViews*
*Owner: robbin-expert (implement), robbin-tester (verify)*
*Priority: 2 (Phase 1 — typed views)*
