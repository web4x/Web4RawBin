# T85: Adopt Web4Articles Task Template + Traceability Conventions
[task:uuid:a1f4c9d2-8b30-4e67-9c15-3d8e2f7a0b41]

## Status

- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Traceability

- up
  - [Sprint 11 Planning](./planning.md)
  - Tron directive 2026-05-25 (adopt Web4Articles planning standard)
- down
  - None (atomic task — foundation for T86-T90)

## Task Description

Upgrade RawBin's task template to the Web4Articles standard and document the
forward-traceability convention so all FUTURE tasks comply immediately.

- `scrum.pmo/templates/task-template.md` — upgraded 2026-05-25 (hierarchical Status,
  `task:uuid` anchor, forward chain req→usecase→puml→class/method, Intention,
  Dependencies, Definition of Done, Tron-gate note).
- Write `scrum.pmo/traceability-standard.md`: defines the chain, UUID anchoring,
  how req↔usecase↔puml↔class/method link, and the up/down/chain/changes sections.

## Context

Tron: adopt the Web4Articles planning standard. Reference:
`/Users/Shared/Workspaces/2cuGitHub/Web4Articles/scrum.pmo/sprints/`.

## Acceptance Criteria

- [x] task-template.md reflects Web4Articles structure (VERIFIED 2026-05-26)
- [x] traceability-standard.md published — at `scrum.pmo/standards/traceability-standard.md` (robbin-req, committed 33de99f)
- [x] Future tasks created from the template pass `sprint audit` (S10 T81-83, S12 T84, S13 T91-94 all authored to standard, audit 0 issues)

## QA Audit & User Feedback

- 2026-05-25: Tron directive to adopt Web4Articles standard. Template upgraded; standard doc pending.

## Subtasks

None (atomic task).

---
*Sprint 11 — Traceability Standardization*
*Owner: robbin-planner + robbin-req*
*Priority: 1 (CRITICAL — foundation)*
