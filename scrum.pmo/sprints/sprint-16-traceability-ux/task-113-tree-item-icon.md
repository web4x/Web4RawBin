[Back to Sprint 16 Planning](./planning.md)

# T113: Tree-item — square SVG type icon (free icon library)

[task:uuid:d1135c9f-a037-4b24-e5d1-4c3b9f602e83]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement (architect — icon-library choice)
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Traceability

`[task:uuid:d1135c9f-a037-4b24-e5d1-4c3b9f602e83]`

- up
  - [Sprint 16 Planning](./planning.md)
  - [compound-requirement-source.md](./compound-requirement-source.md) → **R16.5** (square SVG type icon)
- down
  - None (atomic task)
- chain (req → usecase → puml → class/method) — to be completed by req + architect
  - **requirement:** R16.5 (req-eng to formalize)
  - **use case / puml / method:** TBD (architect)

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
- **Requires:** architect icon-library decision
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
