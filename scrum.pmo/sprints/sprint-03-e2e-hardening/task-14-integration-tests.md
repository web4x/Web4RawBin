[Back to Sprint 3 Planning](./planning.md)

# T14: Integration Test Alignment

[task:uuid:cf488ded-0225-42a4-ba82-036e280e1a49]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [x] Done


## Traceability
- up
  - [sprint-03-e2e-hardening Planning](./planning.md)
- down
  - None
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


## QA Audit & User Feedback

## Subtasks
None (atomic task).
## Acceptance Criteria
- [x] All server.test.ts tests pass without running server
- [x] All client.test.ts tests pass without running server
- [x] Combined with existing tests: 150+ total unit tests passing
- [x] No test takes more than 5 seconds
