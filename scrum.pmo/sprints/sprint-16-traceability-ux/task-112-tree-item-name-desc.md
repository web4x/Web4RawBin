[Back to Sprint 16 Planning](./planning.md)

# T112: Tree-item — speaky name (generate if absent) + word-wrap description

[task:uuid:c1124b8e-9f26-4a13-d4c0-3b2a8e5f1d72]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement (req + architect)
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Traceability

`[task:uuid:c1124b8e-9f26-4a13-d4c0-3b2a8e5f1d72]`

- up
  - [Sprint 16 Planning](./planning.md)
  - [compound-requirement-source.md](./compound-requirement-source.md) → **R16.3** (speaky name) + **R16.4** (word-wrap description)
- down
  - None (atomic task)
- chain (req → usecase → puml → class/method) — to be completed by req + architect
  - **requirement:** R16.3 + R16.4 (req-eng to formalize)
  - **use case / puml / method:** TBD (architect)

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

## Dependencies
- **Requires:** None (tree-item redesign foundation for Phase 2)
- **Enables:** T115 (collapse/expand shows name+desc); T111 (DetailView consumes name/desc)

## Definition of Done
- [ ] All AC met; traceability chain complete + links resolve
- [ ] Tests pass, build clean
- [ ] Tron QA approved

## QA Audit & User Feedback
- 2026-05-27: Planned from compound source R16.3+R16.4. Awaiting req split + architect design, then Tron QA.

## Subtasks
None (atomic task).

---

*Sprint 16 — Traceability UX & DetailViews*
*Owner: robbin-expert (implement), robbin-tester (verify)*
*Priority: 3 (Phase 2 — tree-item content)*
