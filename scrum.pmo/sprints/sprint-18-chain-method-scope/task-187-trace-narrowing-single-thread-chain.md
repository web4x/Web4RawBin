[Back to Sprint 18 Planning](./planning.md)

# T187: Trace narrowing — single-thread chain in /trace, full fan-out in /scenario

[task:uuid:292d8931-efff-45ab-b66e-772fac16c6ea]

> Canonical source: `scenario/index/2/9/2/d/8/292d8931-efff-45ab-b66e-772fac16c6ea.scenario.json` (S18 dogfood — scenario.json first). This .md file holds tester's pre-authored Test Scenarios (TS) for execution; status is mirrored from the unit. uuid + sprint location reconciled by planner per learning #20 + #26 (was sprint-17 + fake-suffix uuid → moved to sprint-18 + real v4).

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement (architect 6c7ff26e + 35f111a6)
  - [x] creating test cases (tester 27ffe1b4 — 10 TS pre-authored)
  - [x] implementing (expert 02c99a7e v0.5.88)
  - [ ] testing (tester executes 10 TS — pending)
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

## Test Scenarios (tester re-authored `b56895b7` — corrected per architect 2026-06-05)

### NAV layer (identical in /trace and /scenario — ALL children, 1:N OK)

| TS | Action | Expected | Method |
|----|--------|----------|--------|
| TS1 | /api/trace/roots | Returns Sprint-level or Task-level nav-roots | curl |
| TS2 | Sprint in /trace tree at root level | Sprint items visible as expandable root nodes | Playwright |
| TS3 | Expand Sprint → children | Shows Tasks (all of them, 1:N) | Playwright |
| TS4 | Expand Task → children | Shows coveredReqs AND/OR UCs (all, 1:N) | Playwright |
| TS5 | /api/trace/sprints | Returns Sprint objects | curl |

### DIVERGENCE layer (UC→Method: narrowed in /trace, full in /scenario)

| TS | Action | Expected | Method |
|----|--------|----------|--------|
| TS6 | /trace: expand a UC with N>1 classes | UC shows ONE method child (narrowed singular UC.method) — NOT all classes→all methods | Playwright |
| TS7 | /trace: continue from that Method | Method shows ONE implementation (singular) → then tests | Playwright chain |
| TS8 | /scenario same UC (by IOR): expand | UC shows ALL classes[] → each Class shows ALL methods[] (full fan-out) | Playwright |
| TS9 | Compare /trace vs /scenario child count at UC level | /trace: 1 method child; /scenario: N class children with M methods each. Counts differ. | Playwright both |

### Regression

| TS | Action | Expected | Method |
|----|--------|----------|--------|
| TS10 | 44/44 7-hop reachable | walkUp from all Tests reaches Req root | node index walk |
| TS11 | 836/836 vitest | Full suite green | vitest |

## Subtasks
None (atomic task — 11 TS above are test scenarios for execution, not subtasks).

## QA Audit & User Feedback
- 2026-06-05: Tester pre-authored 10 test scenarios from PO's AC description. Ready to execute the instant expert deploys.
