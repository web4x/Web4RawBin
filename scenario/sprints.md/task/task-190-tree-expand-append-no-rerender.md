# T190: Tree expand appends only — no full re-render, no scroll jump
[task:uuid:08e46ce3-69f3-40fe-87d7-5ee875a4e94a]

## Status

- [x] Planned
- [x] In Progress
  - [x] refinement (architect — incremental-append folded into seed-path)
  - [x] creating test cases (tester 27ffe1b4 — 8 TS pre-authored)
  - [x] implementing (expert 02c99a7e v0.5.88)
  - [ ] testing (tester executes 8 TS — pending)
- [ ] QA Review
- [ ] Done

## Traceability

- up
  - [Sprint 18 Planning](./planning.md)
  - Sprint unit: `ior:instance:5b950725-a6f6-4d45-b802-4784ee6ef962`
  - Atomic requirements (covered): R18.5 + R18.6 + R18.7 — req-eng `22f43f31` + `a558480b`
- follows
  - T186 R-Y1 (closed; lazy-LOAD verified)
  - T186 R-Y2 (closed; expand/collapse verified)
- down
  - None (atomic task — 8 TS are test scenarios for execution)

## Task Description

Expanding a tree node appends child-level DOM only — no full re-render of the
tree. Scroll position preserved (no jump-to-top). In a 100+ node tree,
expanding node #50 must not re-layout nodes #1-49.

## QA Audit & User Feedback

- 2026-06-05: Tester pre-authored 8 test scenarios from PO's AC description. Ready to execute the instant expert deploys.
- 2026-06-05: Expert `02c99a7e` v0.5.88 shipped — seed-path incremental append + toggle (no full re-render); fetchAndRenderChildren appends only; scroll preserved. Tester strict-bar execution pending.
- 2026-06-05: Planner reconciled (learning #20+#26): moved from sprint-17 to sprint-18 (correct sprint); fake-suffix task uuid → real v4 `08e46ce3-…` matching scenario unit; added Traceability + Subtasks sections for Web4Articles audit compliance.

## Subtasks

None (atomic task — 8 TS above are test scenarios for execution, not subtasks).
