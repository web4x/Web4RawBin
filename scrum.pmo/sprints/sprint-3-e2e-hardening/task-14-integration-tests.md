[Back to Sprint 3 Planning](./planning.md)

# T14: Integration Test Alignment

**Status:** DONE
**Assigned:** robbin-tester
**Effort:** 2h tester
**Dependencies:** None

## Goal

Fix the 48 failing integration tests in server.test.ts and client.test.ts. These tests hit a running server and currently timeout because no server is started during test runs.

## Requirements

### 14.1 Choose approach

**Option A (recommended):** Refactor to unit tests — extract handler logic like profile.test.ts does. Faster, no server dependency, reliable CI.

**Option B:** Add beforeAll/afterAll server lifecycle — start server in test setup, stop in teardown. Slower but tests real network path.

PO preference: Option A for handler/protocol tests, Option B only for the Playwright E2E suite (T13).

### 14.2 server.test.ts (33 tests, 48 failures total with client.test.ts)

Fix or refactor:
- Config branding tests → unit test the config response object
- Route existence tests → unit test the route handler dispatch
- WS protocol tests → unit test the message handler switch
- Profile/device data separation → unit test with mock data

### 14.3 client.test.ts (remaining failures)

Fix or refactor:
- esbuild output tests → check file existence, no server needed
- Source code checks → grep for patterns, no server needed
- WS flow tests → refactor to unit or move to E2E (T13)

## Acceptance Criteria
- [ ] All server.test.ts tests pass without running server
- [ ] All client.test.ts tests pass without running server
- [ ] Combined with existing tests: 150+ total unit tests passing
- [ ] No test takes more than 5 seconds
