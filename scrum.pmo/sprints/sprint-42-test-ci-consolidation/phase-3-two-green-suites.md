<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 42.4: Phase 3b — two green suites (triage test/visual, fix known failures, clean tree)

[task:uuid:ba1a2444-d856-4143-9a0b-7b7b7a1adf7d]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing (unit suite, e2e specs, CI clean-tree gate)
  - [x] implementing (server scenario/ writes go to a temp copy: RAWBIN_SCENARIO_ROOT)
  - [x] implementing (test/visual triage: all 436 scripts sorted in test/visual/TRIAGE.md; 55 gates run in CI)
  - [x] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

Done 2026-11-22: vitest 1081/1081 green (was 23 failing; stale tests updated to the ruling that changed them, R40.6 seed level fix); e2e 49/53 locally (the 4 editor tests need the Monaco CDN, green in CI); real bug fixed: leave + rejoin of a persistent room closed the user's own socket (Room.rejoinDedup); editor save test no longer empties README.md; unit runs leave the tree clean, CI enforces it (scripts/ci-suites.mjs). 2026-11-22: the isolated e2e server works on a copy of scenario/ (src/ts/server/scenario-root.ts, RAWBIN_SCENARIO_ROOT set by playwright.config.ts); both CI suites now fail on a dirty tree. Open: triage the 439 test/visual scripts. | test/visual triage 2026-11-22: 47 node-only gates run in the unit suite, 8 server gates in the e2e suite (isolated server), 124 unreferenced PNGs (159 MB) deleted. Still to do, per test/visual/TRIAGE.md: 212 headed-WebKit gates to convert or delete, 70 owner-token gates (violate R42.3), 24 prod-data probes to delete, 63 red gates to check against their requirement.

## Task Description

Triage the 439 test/visual scripts (convert / move / delete), fix or delete the ~22 failing vitest and 12 failing e2e tests, make test runs write scenario/ into the data dir.

## Intention

Part of the Sprint 42 radical consolidation (see the sprint goal).

## Acceptance Criteria

- [ ] **(ci-runs-both)** CI runs build, vitest and e2e on every PR (.github/workflows/ci.yml).
- [ ] **(all-green)** Both suites are green on main; known failures are fixed or deleted, never skipped.
- [ ] **(visual-triaged)** test/visual is triaged: behaviour checks become Playwright specs, source-text checks become vitest tests or are deleted, one-off probes are deleted.
- [ ] **(clean-tree)** A test run never changes tracked files (scenario/ and README writes go to the test data dir).
