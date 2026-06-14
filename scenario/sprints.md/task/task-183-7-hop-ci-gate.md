# T183: 7-hop CI gate — trace:audit:strict per-Test reachability
[task:uuid:a3f183b4-c5d6-4e7f-8a90-1b2c3d4e5f83]

## Status

- [x] Planned
- [x] In Progress
  - [x] refinement (tester spec — this file)
  - [ ] creating test cases
  - [x] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

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

## Acceptance Criteria

- [ ] AC1 — Gate runs against all Test scenario units in index
- [ ] AC2 — walkUp follows FORWARD_KEYS reverse edges (same chain as /api/trace/children uses forward)
- [ ] AC3 — Reports X/Y with per-test break table for failures
- [ ] AC4 — Exit code 1 on any failure (CI-blocking)
- [ ] AC5 — Currently reports 0/44 (Task→UC gap) — confirms gate works before fill
- [ ] AC6 — After Task→UC fill: reports 44/44 (no-op pass, locks the win)
- [ ] AC7 — Vitest + build clean, no regression

## QA Audit & User Feedback

- 2026-06-04: Tester `c0f61299` authored T183 spec — 7-hop CI gate, per-Test walkUp from Test through Impl→Method→Class→UC→Task→Req. Gate exits 1 if any test unreachable; reports X/44 + per-test break table. No-op pass after T178 fill; guards regression forever. (Tester-driven stand-up per learning #20 reconcile pattern.)
- 2026-06-04: Planner reconciled T183 — added Subtasks + QA Audit sections for Web4Articles compliance; task uuid retained (valid v4 format per learning #17). Linked to strict-bar (1) per-Test 7-hop assertion + learning #27 verify-bar CI extension. T170 follow-on per the strict-bar codification (a `trace:audit:strict` extension that fails on any depth < 7).
- Pending: expert implements the script per the spec → tester verifies gate behaviour (TS1-TS4) → Tron QA closes the permanent regression guard.

## Subtasks

None (atomic task — single CI gate script + integration into trace:audit:strict).
