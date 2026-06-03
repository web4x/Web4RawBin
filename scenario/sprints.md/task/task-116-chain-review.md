# T116: Traceability-chain review — every method traces to its requirement
[task:uuid:01168fc2-d36a-4e57-b804-7f6ec2935b16]

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

`[task:uuid:01168fc2-d36a-4e57-b804-7f6ec2935b16]`

- up
  - [Sprint 16 Planning](./planning.md)
  - [compound-requirement-source.md](./compound-requirement-source.md) → **R16.9** (chain review)
  - [traceability-standard.md](../../standards/traceability-standard.md)
- down
  - None (atomic task)
- chain (req → usecase → puml → class/method)
  - **requirement:** R16.9
  - **use case:** traceChain.auditOrphans [uc:uuid:16a01161-d161-4a01-b161-000000116001]
  - **puml:** [diagrams/s16-usecases.puml](./diagrams/s16-usecases.puml) (Phase 3 package)
  - **class/method:** `TraceConsistency.ts` → `auditOrphans()` (scanner extension)
  - This task IS the chain-integrity audit: requirement → task → use case → class (noun) → method (verb)

## Task Description

Review the full traceability chain — **requirement → task → use cases → classes
(objects/nouns) → methods (verbs)** — and ensure **EVERY method (verb) traces back to
its originating requirement**. Produce/refresh the chain index (matrix) and flag any
method with no requirement ancestor. Depends on UseCases being first-class (T117).

## Context

Tron 2026-05-27: "review the traceability chain: requirement-> task, use casees,
classes (objects nouns), methods (verbs) and make sure i can trace back each method
(verbs) to its original requirement."

## Acceptance Criteria

- [ ] AC1 — Chain documented req → task → use case → class → method end-to-end
- [ ] AC2 — Every method maps to ≥1 requirement; orphans (method with no requirement) are reported
- [ ] AC3 — The /trace browser reflects the complete chain (method nodes reachable from requirement roots)
- [ ] AC4 — Matrix `scrum.pmo/traceability-matrix.md` updated; standard satisfied
- [ ] `npm run build` succeeds; no regression

## QA Audit & User Feedback

- 2026-05-27: Planned from compound source R16.9. Awaiting architect design (after T117), then Tron QA.

## Subtasks

None (atomic task).

---

*Sprint 16 — Traceability UX & DetailViews*
*Owner: robbin-expert (implement), robbin-tester (verify)*
*Priority: 7 (Phase 3 — chain integrity)*
