# T175: Tree base + Traceability layer + typed chain resolution (R-N1/N2/N3)
[task:uuid:20e89691-a5dc-4576-85dd-e1eec19b0f10]

## Status

- [x] Planned
- [x] In Progress
  - [x] refinement (architect design — this document)
  - [ ] creating test cases
  - [x] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Traceability

- up
  - [Sprint 17 Planning](./planning.md)
  - **R-N1** `[requirement:uuid:2681ad2a-c2ad-4429-9754-4e0db808ba5f]` — tree items never overflow panel width (item width overflow)
  - **R-N2** `[requirement:uuid:cf759d95-ae5e-41db-9caa-55f9648d15cf]` — /scenario tree expand/collapse state persists (per seed IOR)
  - **R-N3** `[requirement:uuid:b323f3b9-25ca-40eb-8cbb-eedb0f888f3c]` — Tree base class; **Traceability EXTENDS Tree** (PO correction captured by architect); typed classes extend Traceability with chainPosition; parent/children getters derive from LOCKED chain
- follows
  - T168 (7-step LOCKED chain — Traceability + canonical walk), T172 (forward-ref population — feeds the Tree children resolver), T174 (drawer UX + /scenario surface)
- down
  - None (atomic task)

## QA Audit & User Feedback

- 2026-06-03: PO directs T175 stand-up covering R-N1/R-N2/R-N3 — "single consolidated task; R-N3 architectural core; 4-role planner-first; architect designs Tree class hierarchy."
- 2026-06-03: Architect `fe6d2289` ships design ahead of planner scaffold — Tree base + Traceability layer + typed chain resolution; **PO correction captured: Traceability EXTENDS Tree** (not the reverse from PO's initial seed hint).
- 2026-06-03: Planner reconciled per learning #20 — my `task-175-scenario-tree-base-class.md` scaffold removed; architect's `task-175-tree-base-traceability-typed-classes.md` adopted as authoritative; fake-suffix uuid `e1f2a3b4-…-175000000001` replaced with planner v4 `20e89691-a5dc-4576-85dd-e1eec19b0f10` (learning #17); Subtasks + QA Audit + Requirement UUIDs sections added for audit compliance; R-N1/N2/N3 requirement uuid links wired into Traceability.
- Pending: expert impl (rule-pair (a)+(b); (c) STATIC_SHELL exempt per architect — no new route), tester verifies R-N1/N2/N3 ACs, then Tron QA.

---

**Architect:** robbin-architect @ web4team:0.1
**Sprint:** Sprint 17 — Scenario Units
**Phase:** 31 — R-N (Tree base class + /scenario tree UX)
**Owners (CMM4):** robbin-req (verbatim capture R-N1/N2/N3) → robbin-architect `fe6d2289` (design — Traceability EXTENDS Tree; typed chain resolution) → robbin-expert (impl; rule-pair (a)+(b)) → robbin-tester (verify R-N1/N2/N3 ACs; /trace regression check)
**R-N1 + R-N2 + R-N3:** consolidated — Tree class hierarchy is the foundation that R-N1/N2 UX builds on; one PO-directed task

## Subtasks

None (atomic task — PO-directed single consolidated effort; architect designs Tree hierarchy + UX as one coherent piece).
