[Back to Sprint 17 Planning](./planning.md)

# T187: Trace narrowing — single-thread chain in /trace, full fan-out in /scenario

[task:uuid:b7f187c1-d2e3-4f45-a6b7-8c9d0e1f2a87]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [x] testing (scenarios pre-authored by tester)
- [ ] QA Review
- [ ] Done

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

## QA Audit & User Feedback
- 2026-06-05: Tester pre-authored 10 test scenarios from PO's AC description. Ready to execute the instant expert deploys.
