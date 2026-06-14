# Strict-Champagne Defect Catalog: 21 Unreachable Tests
[task:uuid:abc78991-a98b-4221-8ab6-d2b8fa280502]

## Status

- [x] Planned
- [x] In Progress
  - [x] refinement (architect — root-cause analysis 2026-06-07)
  - [ ] creating test cases
  - [ ] implementing (expert — quick fix or proper fix per architect's recommendation)
  - [ ] testing (tester — re-run strict audit, expect 44/44 reachable)
- [ ] QA Review
- [ ] Done

> QA Review + Done = TRON's gate.

## Traceability

- up
  - [Sprint 18 Planning](./planning.md)
  - Champagne metric directive (R-G/R-J test-reachability follow-on; S17 R-batch)
- related
  - T111 (S16 Specialized DetailViews — the funnel-point Task with no Requirement parent)
  - impl-bridge units created by expert for shared-class fan-out (the root-cause structural issue)
- down
  - None (atomic defect-catalog task — fix is a single Requirement-link or impl-bridge cleanup)

---

## QA Audit & User Feedback

- 2026-06-07: Architect filed defect catalog — all 21 strict-audit-unreachable tests funnel through T111→Sprint 16 (no Requirement). Two fix paths offered (quick: Requirement.tasks[] entry for T111; proper: impl-bridge restructuring).
- Pending: expert chooses quick vs proper fix → implements → tester re-runs `trace-audit.ts --strict`, expects 44/44.

## Subtasks

None (atomic — single coordinated fix: either T111 Requirement-link OR impl-bridge restructuring per architect's recommendation).
