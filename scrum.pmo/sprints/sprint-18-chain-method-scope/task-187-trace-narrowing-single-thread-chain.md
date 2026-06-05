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
/trace shows a NARROWED single-thread chain: a Requirement with N tasks shows
only 1 in /trace; a UC shows one method→impl→test thread. /scenario still fans
out the full tree. Sprint and Task are nav-roots. /api/trace/sprints endpoint.

## Test Scenarios (tester pre-authored — run on deploy)

| TS | Action | Expected | Method |
|----|--------|----------|--------|
| TS1 | GET /api/trace/roots | Returns Requirement roots (not Sprint/Task); count matches known req count | curl |
| TS2 | Pick a Requirement with N>1 tasks in scenario index. GET /api/trace/children/<req-uuid> | Returns EXACTLY 1 task child (narrowed), not N | curl + node |
| TS3 | Walk Req→Task→UC in /api/trace/children | UC shows exactly 1 class child (narrowed single thread) | curl chain |
| TS4 | Continue UC→Class→Method→Impl→Test | Single thread all the way to Test leaf | curl chain |
| TS5 | Same Requirement on /scenario?ior=<uuid> — expand tree | Shows ALL N tasks (full fan-out, not narrowed) | Playwright |
| TS6 | GET /api/trace/sprints (new endpoint) | Returns Sprint objects as nav-roots | curl |
| TS7 | Sprint and Task appear as nav-roots in /trace tree | Sprint/Task items visible at root level of tree | Playwright |
| TS8 | /trace narrowed chain vs /scenario full tree — same Req | /trace: 1 task child; /scenario: N task children. Counts differ. | curl + Playwright |
| TS9 | Regression: 44/44 7-hop still reachable | walkUp from all Tests reaches Req root | node index walk |
| TS10 | Regression: 836/836 vitest | Full suite green | vitest |

## Pre-authored verification script (run on deploy)

```bash
# TS1: roots
curl -sk https://localhost:4444/api/trace/roots | node -e "..."

# TS2: narrowed — Req with N tasks shows 1
# Find a Req with >1 task in index, then check /api/trace/children returns 1

# TS5: /scenario full fan-out
# Playwright: goto /scenario?ior=<same-req>, expand, count task children > 1

# TS6: /api/trace/sprints
curl -sk https://localhost:4444/api/trace/sprints
```

## Subtasks
None (atomic task — 10 TS above are test scenarios for execution, not subtasks).

## QA Audit & User Feedback
- 2026-06-05: Tester pre-authored 10 test scenarios from PO's AC description. Ready to execute the instant expert deploys.
