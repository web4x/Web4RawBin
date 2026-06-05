[Back to Sprint 17 Planning](./planning.md)

# T187: Trace narrowing — single-thread chain at UC→Method, full fan-out in /scenario

[task:uuid:b7f187c1-d2e3-4f45-a6b7-8c9d0e1f2a87]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [x] testing (scenarios re-authored by tester 2026-06-05)
- [ ] QA Review
- [ ] Done

## Task Description
/trace shows a NARROWED single-thread chain starting at UC→Method:
UC.method (ONE singular) → Method.implementation (singular) → tests.
/scenario shows FULL fan-out: UC.classes[]→Class.methods[] (ALL).
NAV layer (Sprint→Tasks→coveredReqs→UCs) is IDENTICAL in both modes — all children, 1:N OK.
Sprint is a root-level nav-root. /api/trace/sprints endpoint.

## Test Scenarios (tester re-authored — corrected per architect 2026-06-05)

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

## QA Audit & User Feedback
- 2026-06-05: Tester pre-authored 10 TS (WRONG — targeted Req→Task which is NAV, not chain).
- 2026-06-05: Architect corrected — divergence is UC→Method, not Req→Task. Tester re-authored 11 TS with correct NAV vs DIVERGENCE layers. Ready to run on next deploy.
