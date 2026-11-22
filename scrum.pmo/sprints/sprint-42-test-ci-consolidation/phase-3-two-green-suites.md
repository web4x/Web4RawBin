<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 42.4: Phase 3b — two green suites (triage test/visual, fix known failures, clean tree)

[task:uuid:ba1a2444-d856-4143-9a0b-7b7b7a1adf7d]

## Status
- [x] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Task Description

Triage the 439 test/visual scripts (convert / move / delete), fix or delete the ~22 failing vitest and 12 failing e2e tests, make test runs write scenario/ into the data dir.

## Intention

Part of the Sprint 42 radical consolidation (see the sprint goal).

## Acceptance Criteria

- [ ] **(ci-runs-both)** CI runs build, vitest and e2e on every PR (.github/workflows/ci.yml).
- [ ] **(all-green)** Both suites are green on main; known failures are fixed or deleted, never skipped.
- [ ] **(visual-triaged)** test/visual is triaged: behaviour checks become Playwright specs, source-text checks become vitest tests or are deleted, one-off probes are deleted.
- [ ] **(clean-tree)** A test run never changes tracked files (scenario/ and README writes go to the test data dir).
