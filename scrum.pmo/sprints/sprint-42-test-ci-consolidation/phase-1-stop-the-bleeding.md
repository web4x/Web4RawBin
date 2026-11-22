<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 42.1: Phase 1 — stop the bleeding (tests off prod, CI, pollution inventory)

[task:uuid:4a82b2e5-d4c3-455e-b75d-cfb0a4bc747b]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [ ] Done

## Task Description

test/visual/_target.mjs (isolated by default, RAWBIN_TARGET=prod opt-in) for 286 scripts; .github/workflows/ci.yml (build, vitest, e2e); scripts/list-test-pollution.mjs (read-only). PR #3 into hotfix/t40.1-checklist-band. Chain artifacts (this sprint): scripts/rawbin-target.mjs RawbinTarget.resolveRawbinTarget + test/vitest/rawbin-target.test.ts; scripts/list-test-pollution.mjs TestPollution.listTestPollution + test/vitest/list-test-pollution.test.ts. CI e2e job shares E2E_DATA_DIR with the server.

## Intention

Part of the Sprint 42 radical consolidation (see the sprint goal).

## Acceptance Criteria

- [ ] **(isolated-by-default)** A test script with no environment set connects to the isolated server (https://localhost:4445), never to prod.
- [ ] **(prod-opt-in)** Reaching prod requires RAWBIN_TARGET=prod and prints a warning.
- [ ] **(no-prod-pollution)** A full test run leaves prod's room and user counts unchanged.
- [ ] **(ci-runs-both)** CI runs build, vitest and e2e on every PR (.github/workflows/ci.yml).
- [ ] **(all-green)** Both suites are green on main; known failures are fixed or deleted, never skipped.
- [ ] **(visual-triaged)** test/visual is triaged: behaviour checks become Playwright specs, source-text checks become vitest tests or are deleted, one-off probes are deleted.
- [ ] **(clean-tree)** A test run never changes tracked files (scenario/ and README writes go to the test data dir).
