# T112: Tree-item — speaky name (generate if absent) + word-wrap description
[task:uuid:6d2225b7-d96b-4452-8719-b3667b344816]

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
- [🔗 objectItem.renderNameDesc](../sprints.md/usecase/objectitem-rendernamedesc.md)
- [🔗 objectItem.generateName](../sprints.md/usecase/objectitem-generatename.md)


## Traceability

`[task:uuid:6d2225b7-d96b-4452-8719-b3667b344816]`

- up
  - [Sprint 16 Planning](./planning.md)
  - [compound-requirement-source.md](./compound-requirement-source.md) → **R16.3** (speaky name) + **R16.4** (word-wrap description)
- down
  - None (atomic task)
- chain (req → usecase → puml → class/method)
  - **requirement:** R16.3 + R16.4
  - **use case:** objectItem.renderNameDesc [uc:uuid:16a01121-d121-4a01-b121-000000112001], objectItem.generateName [uc:uuid:16a01122-d122-4a02-b122-000000112002]
  - **puml:** [diagrams/s16-usecases.puml](./diagrams/s16-usecases.puml) (Phase 2 package)
  - **class/method:** `rb-object-item.ts` → `RbObjectItem.render()`, `generateName()`

## Task Description

Redesign the traceability tree-item to carry a **`name`** attribute = a human-readable
short name for the requirement/task; if none exists, **generate** a short name from
the requirement text. Below the name, render a **word-wrapping** smaller-text paragraph
with the current requirement text.

## Context

Tron 2026-05-27: "the tree items should have a name attribute that is a speaky name …
if it does not have a short one create a short name from the requirement text. the item
shall have below the name a word wrapping smaller text paragraph with the current
requirement text."

## Acceptance Criteria

- [ ] AC1 — Tree-item shows a speaky `name` when one exists
- [ ] AC2 — When absent, a short name is generated from the requirement text
- [ ] AC3 — A smaller-text description paragraph renders below the name and word-wraps (no overflow/clipping)
- [ ] `npm run build` succeeds; version + sw.js bumped; no regression

## QA Audit & User Feedback

- 2026-05-27: Planned from compound source R16.3+R16.4. Awaiting req split + architect design, then Tron QA.

## Subtasks

None (atomic task).

---

*Sprint 16 — Traceability UX & DetailViews*
*Owner: robbin-expert (implement), robbin-tester (verify)*
*Priority: 3 (Phase 2 — tree-item content)*
