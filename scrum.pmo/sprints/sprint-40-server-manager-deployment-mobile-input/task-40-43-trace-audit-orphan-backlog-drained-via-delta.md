<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.43: trace:audit orphan backlog DRAINED via delta

[task:uuid:724fa12b-d16b-4288-89a8-53468bf78015]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Task Description

Deliver + verify requirement R40.43 (trace:audit orphan backlog DRAINED via delta). Retroactive task unit minted scenario-first from the existing requirement (#126 gap: the req existed, its Task unit was never minted). Covers R40.43; status derived from reality, staged by planner.

## Acceptance Criteria

- [ ] **(tracking)** The standing trace:audit backlog is RECORDED as tracked DEBT with its measured baseline: 1711 orphans + one-class-per-file violations + impl-not-reachable violations (2026-08-17). Not memory — a durable req with the count on it (no-silent-caps).
- [ ] **(scope)** This cleanup is SEPARATE from the CI gate-composition fix (9eb77b30b (a) run-all-then-fail + (b) trace:audit delta-gate) — it must NOT block that fix. The composition fix ships first + makes this backlog visible + self-draining; R40.43 is the cleanup the fix drains.
- [ ] **(mechanism)** trace:audit is a DELTA gate (composition fix (b)): FAIL on any INCREASE vs baseline (0-NEW = catches regressions the red-always gate could not, strictly MORE enforcement), EMIT the counts every run (no-silent-caps visibility via the runner line), auto-flip to strict-0 when a count reaches 0. A delta-report is a non-enforcing block converted into an enforcing counted report.
- [ ] **(self-draining)** The COUNTER is the revisit trigger — the backlog drains over time as the count is worked down; when a count reaches 0 the gate AUTO-FLIPS to strict (debt closed by construction), never a silent defer. Progress is measured by the emitted count, not by memory.
- [ ] **(family)** Graph-integrity / reverse-wire family with R40.39 (type-index): the orphan / one-class-per-file / impl-not-reachable targets likely OVERLAP R40.39's type-index + reverse-wire debt — coordinate so the two do not double-count or fight; a single graph-integrity cleanup pass may serve both. crossRef R40.39.

## Subtasks
