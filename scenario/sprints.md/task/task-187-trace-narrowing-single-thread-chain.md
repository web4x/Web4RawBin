# T187: Trace narrowing — single-thread chain in /trace, full fan-out in /scenario
[task:uuid:292d8931-efff-45ab-b66e-772fac16c6ea]

## Status

- [x] Planned
- [x] In Progress
  - [x] refinement (architect — chain narrowing design)
  - [x] creating test cases
  - [x] implementing (expert — chain walker selects ONE method per UC)
  - [x] testing (tester — 10/10 TS GREEN on real WebKit engine; architect corrected UC→Class→Method narrowing expectations; R18.34.B verified)
- [ ] QA Review
- [ ] Done

## Traceability

- up
  - [Sprint 18 Planning](./planning.md)
  - Sprint unit: `ior:instance:5b950725-a6f6-4d45-b802-4784ee6ef962`
  - Atomic requirements (covered): R18.1 + R18.2 + R18.8 — req-eng `22f43f31`
- follows
  - T168 (closed; chain semantics preserved; R18.8 nav-root rework appended as note)
  - T186 (closed; lazy-LOAD; this task adds chain-narrowing on top)
- down
  - None (atomic task — Test scenarios listed below are TS not subtasks)

## Task Description

/trace shows a NARROWED single-thread chain starting at UC→Method:
UC.method (ONE singular) → Method.implementation (singular) → tests.
/scenario shows FULL fan-out: UC.classes[]→Class.methods[] (ALL).
NAV layer (Sprint→Tasks→coveredReqs→UCs) is IDENTICAL in both modes — all children, 1:N OK.
Sprint is a root-level nav-root. /api/trace/sprints endpoint.

## QA Audit & User Feedback

- 2026-06-05: Tester pre-authored 10 test scenarios from PO's AC description. Ready to execute the instant expert deploys.

## Subtasks

None (atomic task — 11 TS above are test scenarios for execution, not subtasks).
