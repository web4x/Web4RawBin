[Back to Sprint 17 Planning](./planning.md)

# T183: 7-hop CI gate — trace:audit:strict per-Test reachability

[task:uuid:a3f183b4-c5d6-4e7f-8a90-1b2c3d4e5f83]

## Status
- [x] Planned
- [ ] In Progress
  - [x] refinement (tester spec — this file)
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Assigned
**Owner:** robbin-expert (implement), robbin-tester (spec + verify)

## Traceability

`[task:uuid:a3f183b4-c5d6-4e7f-8a90-1b2c3d4e5f83]`

- up
  - [Sprint 17 Planning](./planning.md)
  - strict-verify-bar learning #27
- follows
  - [T178: 7-step chain data fill](./task-178-7-step-chain-data-fill-44-tests.md) — T183 locks T178's win
  - [T170: ci:gates](./task-170-ci-gates-trace-audit-vitest.md) — T183 extends the existing gate suite
- chain
  - **requirement:** R17.13 (every method traces to task AND requirement)
  - **class/method:** `src/ts/server/trace-cli.ts` → `auditStrict7Hop()` or extend existing `validate()`

## Task Description

Extend `trace:audit:strict` (or `trace-cli check`) with a **per-Test 7-hop
walkUp gate**: for EVERY Test scenario unit, walk UP through the LOCKED
canonical chain (Test→Implementation→Method→Class→UseCase→Task→Requirement)
and assert it reaches a Requirement root within 7 hops. If ANY test fails
to reach a Requirement root, the gate FAILS with exit code 1 (CI-blocking).

This gate is a **no-op pass once T178 fills Task→UC and closes 44/44**.
After that, it **guards regression forever** — any future Test added without
a complete chain will fail CI.

## Gate Specification (tester-authored)

### Input
- All scenario units in `scenario/index/` of type `ior:class:Test`
- The FORWARD_KEYS chain (already defined in server.ts:505-509):
  ```
  Requirement → [tasks] → Task → [subtasks, useCases, children] → UseCase → [classes] →
  Class → [methods] → Method → [implementations] → Implementation → [tests] → Test
  ```

### Algorithm: walkUp per Test
For each Test unit:
1. Build reverse parent map from FORWARD_KEYS (child→parent edges)
2. Starting from the Test's UUID, walk UP through parents
3. At each hop, check if the current unit is `ior:class:Requirement`
4. If Requirement reached within ≤7 hops → PASS for this test
5. If no Requirement reachable (exhausted all parent paths) → FAIL, record break hop

### Output (stdout)
```
7-hop strict audit: X/Y tests reachable from Requirement roots
```
Where X = reachable count, Y = total Test count.

If X < Y, emit per-test break table:
```
UNREACHABLE TESTS:
  <test-name>  break: <Type>→<Type> (no parent link)
  ...
```

### Exit code
- `0` if X === Y (all tests reachable)
- `1` if X < Y (CI gate FAIL)

### Integration
- Wire into existing `trace-cli check` output (append after back-ref check)
- OR add as `trace-cli audit:strict:7hop` subcommand
- Must be runnable as `npm run trace:audit:strict` or equivalent in CI

## Acceptance Criteria
- [ ] AC1 — Gate runs against all Test scenario units in index
- [ ] AC2 — walkUp follows FORWARD_KEYS reverse edges (same chain as /api/trace/children uses forward)
- [ ] AC3 — Reports X/Y with per-test break table for failures
- [ ] AC4 — Exit code 1 on any failure (CI-blocking)
- [ ] AC5 — Currently reports 0/44 (Task→UC gap) — confirms gate works before fill
- [ ] AC6 — After Task→UC fill: reports 44/44 (no-op pass, locks the win)
- [ ] AC7 — Vitest + build clean, no regression

## Test Scenarios (tester verifies after expert impl)

| Test | Action | Expected |
|------|--------|----------|
| TS1 | Run gate on current graph (Task→UC = 0%) | Reports 0/44, exit 1 |
| TS2 | After Task→UC fill | Reports 44/44, exit 0 |
| TS3 | Remove one Impl→Test link, re-run | Reports 43/44, exit 1, names the broken test |
| TS4 | Regression: add a new Test without chain | Gate catches it, exit 1 |

## Dependencies
- **Requires:** T178 data fill to make the gate pass (gate is ready before fill)
- **Enables:** permanent regression guard on 7-hop chain integrity

## Subtasks
None (atomic task — single CI gate script + integration into trace:audit:strict).

## QA Audit & User Feedback
- 2026-06-04: Tester `c0f61299` authored T183 spec — 7-hop CI gate, per-Test walkUp from Test through Impl→Method→Class→UC→Task→Req. Gate exits 1 if any test unreachable; reports X/44 + per-test break table. No-op pass after T178 fill; guards regression forever. (Tester-driven stand-up per learning #20 reconcile pattern.)
- 2026-06-04: Planner reconciled T183 — added Subtasks + QA Audit sections for Web4Articles compliance; task uuid retained (valid v4 format per learning #17). Linked to strict-bar (1) per-Test 7-hop assertion + learning #27 verify-bar CI extension. T170 follow-on per the strict-bar codification (a `trace:audit:strict` extension that fails on any depth < 7).
- Pending: expert implements the script per the spec → tester verifies gate behaviour (TS1-TS4) → Tron QA closes the permanent regression guard.
