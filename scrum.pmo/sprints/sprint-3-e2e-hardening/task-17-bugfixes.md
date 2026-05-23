[Back to Sprint 3 Planning](./planning.md)

# T17: Bug Fix Sprint

**Status:** PLANNED
**Assigned:** robbin-expert (fix), robbin-tester (verify)
**Effort:** Variable — depends on E2E findings
**Dependencies:** T13 (bugs found during E2E testing)

## Goal

Fix all bugs discovered during Playwright E2E testing and external access validation.

## Process

1. E2E test fails → tester files bug as T17.N subtask
2. Expert fixes → tester re-runs E2E test
3. Repeat until all E2E tests pass

## Subtasks (from T13 E2E findings)

- [ ] T17.1 — Gate→room session flow: profileCommitted guard blocks fresh E2E sessions. The gate saves profile but page reload creates new WS connection with new clientId, causing token→client mapping staleness. Room creation after gate requires single-session flow (no page.goto between gate and room).
- [ ] T17.2 — Room lifecycle E2E: create→chat→leave→rejoin→delete requires profile+enrollment to be pre-seeded without page reloads. Current helpers use localStorage seeding which doesn't survive auth flow.
- [ ] T17.3 — Device enrollment E2E: wrong code error test works, but correct code test skipped because enrollment requires real server-generated keys (not bypass keys).
- [ ] T17.4 — Mobile viewport E2E: profile gate works but room interaction skipped (same session flow issue as T17.1).

## Acceptance Criteria
- [ ] All E2E tests pass
- [ ] No critical bugs open
- [ ] External access confirmed working
