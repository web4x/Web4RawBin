<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 42.3: Phase 3a — one test identity (SystemTester + SystemTester2)

[task:uuid:65c18056-6d0e-4c86-b636-18f3a5e29b49]

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

Replace owner token (20 gates), Tron's profile 3effa1fc (3), synthetic member (8) and random users (21) with SystemTester / SystemTester2; seed both into the isolated server with real device keys; switch the 18 e2e specs to ensureSystemSession. DONE in this task: test/e2e/identities.ts (globalSetup signs up SystemTester + SystemTester2 once per isolated data dir via the real gate + device enrolment; loginAs/testerContext), all specs migrated off ensureLobby/cleanupTestUsers, helpers read the server's data dir, scripts/check-test-identity.mjs wired into test:guard. Open: the four first-visit specs (new-user, device-enrollment, negative-cases, returning-user-unlock) still sign up a fresh visitor because that flow is their subject; and test/visual gates are handled in T42.4.

## Intention

Part of the Sprint 42 radical consolidation (see the sprint goal).

## Acceptance Criteria

- [ ] **(systemtester-only)** Every test logs in as SystemTester; a test that needs a second person uses SystemTester2.
- [ ] **(no-owner-no-real-users)** No test uses the owner token, a real person's profile, or a freshly minted random user.
- [ ] **(real-device-keys)** Test users are seeded with real device keys, not 'e2e-bypass'.
