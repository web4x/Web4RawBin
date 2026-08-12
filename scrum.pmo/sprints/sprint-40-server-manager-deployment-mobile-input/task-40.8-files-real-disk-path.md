<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.8: 'Files' shows the REAL measured on-disk path of the scenario unit (fail-closed if absent, browsable)

[task:uuid:b0be0668-d35d-4739-b805-f25c0abe8420]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [ ] Done

## Remaining Issues

HELD-FROM-BATCH (PO 2026-08-12, NOT Tron-signable): tester-diagnosed = GATE STALE/UNVERIFIABLE (status:pass over a currently-RED gate DET-3x, hollow-row class), FEATURE NOT IMPLICATED (no broken feature). Status stays QA-Review (not downgraded); do NOT approve until the gate is re-verified GREEN. --- QA-Review (units-win; planner disk-verified BOTH directions + tester two-key CLOSED): chain-complete-to-Test — Impl 3ee03bde (ServerManagerApi.unitRealPath) tests[]=[c4a7f1b9] <-> Test c4a7f1b9.implementations[]=[3ee03bde], status=pass, ownerIor=3ee03bde (single-impl, clean, no cross-wire). Tester KEY-2 two-key CLOSED both-dir + PUSHED (01addbba1, origin==b0d0f5a17). All In-Progress sub-steps [x]. Done-gate [ ] = Tron's act (R40.10 approve-control). Board re-derived from units (PO campaign 2026-08-09).

## Traceability

  - up
    - [Sprint 40 Planning](./planning.md)
    - Requirement R40.8 `[requirement:uuid:90cc7bab-f7d4-4646-bc85-4a58fcb2c3eb]`
  - down
    - None (atomic task)

## Task Description

R40.8 (Tron: 'files should show where the file really is'). The editor footer 'Files' tab reveals the ACTUAL filesystem path of that scenario unit (browsable there), and the path shown MATCHES the unit's real location on disk (measured, not composed). Scenario-first: req mints R40.8 + ACs; architect designs; expert implements; tester gates (disk).

## Acceptance Criteria

- [x] [AUTOMATABLE, disk] The path shown by Files MATCHES the unit's REAL location on disk (scenario/index/<shard>/<uuid>.scenario.json) — measured against the filesystem, NOT composed from the slug.
- [x] [AUTOMATABLE @390] The Files tab reveals that path and is browsable to the containing folder from there.

## Subtasks

None (atomic task).
