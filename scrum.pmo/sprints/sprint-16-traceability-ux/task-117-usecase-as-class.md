[Back to Sprint 16 Planning](./planning.md)

# T117: UseCase as class instances in PUML

[task:uuid:11179033-e47b-4f68-c915-8a7fd3046c27]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement (architect)
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Traceability

`[task:uuid:11179033-e47b-4f68-c915-8a7fd3046c27]`

- up
  - [Sprint 16 Planning](./planning.md)
  - [compound-requirement-source.md](./compound-requirement-source.md) → **R16.10** (UseCase as class instances in PUML)
  - [traceability-standard.md](../../standards/traceability-standard.md)
- down
  - None (atomic task)
- chain (req → usecase → puml → class/method)
  - Establishes the **use case** link as a first-class node so T116's chain is complete

## Task Description
Track use cases in **PUML as dedicated instances of a `UseCase` class** (first-class
objects, not just labels/notes). This makes each use case an addressable node that
methods and requirements link to, enabling T116's method→UC→requirement chain.

## Context
Tron 2026-05-27: "this implies tracking the usecases in puml as dedicated instances of
a UseCase class."

## Acceptance Criteria
- [ ] AC1 — A `UseCase` class is defined in PUML; each use case is an instance of it
- [ ] AC2 — Use case instances carry an id linking up to a requirement and down to classes/methods
- [ ] AC3 — Existing use-case references migrate to the first-class instance form (no orphan labels)
- [ ] AC4 — Generated SVG renders; /trace can surface UseCase nodes
- [ ] `npm run build` succeeds; no regression

## Dependencies
- **Requires:** None (architect-led modeling task)
- **Enables:** T116 (chain review uses first-class UseCase instances)

## Definition of Done
- [ ] All AC met; chain links resolve
- [ ] Tests pass, build clean
- [ ] Tron QA approved

## QA Audit & User Feedback
- 2026-05-27: Planned from compound source R16.10. Awaiting architect design, then Tron QA.

## Subtasks
None (atomic task).

---

*Sprint 16 — Traceability UX & DetailViews*
*Owner: robbin-architect (design), robbin-expert (implement), robbin-tester (verify)*
*Priority: 7 (Phase 3 — enables chain review)*
