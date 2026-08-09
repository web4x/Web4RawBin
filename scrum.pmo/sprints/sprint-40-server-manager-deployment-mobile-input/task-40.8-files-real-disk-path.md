<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.8: 'Files' shows the REAL measured on-disk path of the scenario unit (fail-closed if absent, browsable)

[task:uuid:b0be0668-d35d-4739-b805-f25c0abe8420]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [ ] creating test cases
  - [x] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

Planned - S40 R40.8 (Files = real measured disk path, fail-closed if absent). Scenario-first: req minted R40.8 90cc7bab (515f743b8); coveredRequirements + useCases 98df6abf wired; ACs MIRRORED (2 AUTOMATABLE disk/@390). Architect designs the chain. No build until build-go.

## Traceability

  - up
    - [Sprint 40 Planning](./planning.md)
    - Requirement R40.8 `[requirement:uuid:90cc7bab-f7d4-4646-bc85-4a58fcb2c3eb]`
  - down
    - None (atomic task)

## Task Description

R40.8 (Tron: 'files should show where the file really is'). The editor footer 'Files' tab reveals the ACTUAL filesystem path of that scenario unit (browsable there), and the path shown MATCHES the unit's real location on disk (measured, not composed). Scenario-first: req mints R40.8 + ACs; architect designs; expert implements; tester gates (disk).

## Acceptance Criteria

- [ ] [AUTOMATABLE, disk] The path shown by Files MATCHES the unit's REAL location on disk (scenario/index/<shard>/<uuid>.scenario.json) — measured against the filesystem, NOT composed from the slug.
- [ ] [AUTOMATABLE @390] The Files tab reveals that path and is browsable to the containing folder from there.

## Subtasks

None (atomic task).
