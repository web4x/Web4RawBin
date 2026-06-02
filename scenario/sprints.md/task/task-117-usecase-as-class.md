# T117: UseCase as class instances in PUML
[task:uuid:d1f826f8-f667-45cf-ac4a-a293e41679c4]

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
- [🔗 useCase.trackInPuml](../sprints.md/usecase/usecase-trackinpuml.md)


## Traceability

`[task:uuid:d1f826f8-f667-45cf-ac4a-a293e41679c4]`

- up
  - [Sprint 16 Planning](./planning.md)
  - [compound-requirement-source.md](./compound-requirement-source.md) → **R16.10** (UseCase as class instances in PUML)
  - [traceability-standard.md](../../standards/traceability-standard.md)
- down
  - None (atomic task)
- chain (req → usecase → puml → class/method)
  - **requirement:** R16.10
  - **use case:** useCase.trackInPuml [uc:uuid:16a01171-d171-4a01-b171-000000117001]
  - **puml:** [diagrams/s16-usecases.puml](./diagrams/s16-usecases.puml) (Phase 3 package) — AUTHORED
  - **class/method:** `TraceConsistency.ts` → `parseStereotype()` (<<UseCase>> PUML parsing)
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

## QA Audit & User Feedback

- 2026-05-27: Planned from compound source R16.10. Awaiting architect design, then Tron QA.

## Subtasks

None (atomic task).

---

*Sprint 16 — Traceability UX & DetailViews*
*Owner: robbin-architect (design), robbin-expert (implement), robbin-tester (verify)*
*Priority: 7 (Phase 3 — enables chain review)*
