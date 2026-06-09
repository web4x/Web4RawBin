<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# T113: Tree-item — square SVG type icon (free icon library)

[task:uuid:09dd41a7-8712-4012-ba05-1d34f6d94e07]

## Status
- [ ] Planned
- [x] In Progress
  - [x] refinement (architect — icon-library choice)
  - [ ] creating test cases
  - [x] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Traceability

`[task:uuid:09dd41a7-8712-4012-ba05-1d34f6d94e07]`

- up
  - [Sprint 16 Planning](./planning.md)
  - [compound-requirement-source.md](./compound-requirement-source.md) → **R16.5** (square SVG type icon)
- down
  - None (atomic task)
- chain (req → usecase → puml → class/method)
  - **requirement:** R16.5
  - **use case:** objectItem.setIcon [uc:uuid:16a01131-d131-4a01-b131-000000113001]
  - **puml:** [diagrams/s16-usecases.puml](./diagrams/s16-usecases.puml) (Phase 2 package)
  - **class/method:** `rb-object-item.ts` → `RbObjectItem` icon rendering + `trace/icons.ts` (Lucide vendored SVGs)

## Task Description

On the **left side** of each tree-item, render a catchy **quadratic (square) SVG** icon
per type (requirement vs task). Architect chooses a good **free** icon library (e.g.
Lucide / Tabler / Feather — square, MIT/ISC) and records the choice + license here.

## Context

Tron 2026-05-27: "on the left side they should gave a catchy icon for requirement or
task. quadratic svgs… choose a good free library."

## Acceptance Criteria

- [ ] AC1 — Each tree-item shows a square SVG icon on its left, distinct per type (requirement/task)
- [ ] AC2 — Icons come from a free, appropriately-licensed library (choice + license documented here)
- [ ] AC3 — Icons render crisply at the tree-item size (and the collapsed icon-only size, see T115)
- [ ] `npm run build` succeeds; version + sw.js bumped; no regression

## Dependencies

- **Requires:** architect icon-library decision — **DONE (Lucide, ISC)**
- **Enables:** T115 (collapsed item = just this square icon)

## Definition of Done

- [ ] All AC met; traceability chain complete + links resolve
- [ ] Tests pass, build clean
- [ ] Tron QA approved

## QA Audit & User Feedback

- 2026-05-27: Planned from compound source R16.5. Awaiting architect icon-library choice, then Tron QA.

## Subtasks

None (atomic task).

---

*Sprint 16 — Traceability UX & DetailViews*
*Owner: robbin-expert (implement), robbin-tester (verify)*
*Priority: 4 (Phase 2 — tree-item icon)*
