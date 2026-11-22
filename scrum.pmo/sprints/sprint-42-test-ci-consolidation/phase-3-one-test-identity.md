<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 42.3: Phase 3a — one test identity (SystemTester + SystemTester2)

[task:uuid:65c18056-6d0e-4c86-b636-18f3a5e29b49]

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

Replace owner token (20 gates), Tron's profile 3effa1fc (3), synthetic member (8) and random users (21) with SystemTester / SystemTester2; seed both into the isolated server with real device keys; switch the 18 e2e specs to ensureSystemSession.

## Intention

Part of the Sprint 42 radical consolidation (see the sprint goal).

## Acceptance Criteria

- [ ] **(systemtester-only)** Every test logs in as SystemTester; a test that needs a second person uses SystemTester2.
- [ ] **(no-owner-no-real-users)** No test uses the owner token, a real person's profile, or a freshly minted random user.
- [ ] **(real-device-keys)** Test users are seeded with real device keys, not 'e2e-bypass'.
