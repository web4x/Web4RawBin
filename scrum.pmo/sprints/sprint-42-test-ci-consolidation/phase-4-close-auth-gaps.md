<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 42.5: Phase 4 — close the auth gaps, CI-made releases

[task:uuid:cfff2674-5358-4149-b672-762cc76a94a5]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Task Description

CREATE_ROOM/JOIN_ROOM use the connection identity; device-key login required; tokens out of the repo and rotated; CI bumps version, stamps sw.js, tags and deploys on merge to main. DONE: CREATE_ROOM/JOIN_ROOM act as the connection's IDENTIFY identity (src/ts/server/connection-identity.ts), a foreign msg.playerToken is refused and no longer re-binds tokenToClient. OPEN: device-key login instead of bare-token IDENTIFY; tokens out of the repo + rotation (needs Tron: touches live users); CI-made release tags (with T42.2).

## Intention

Part of the Sprint 42 radical consolidation (see the sprint goal).

## Acceptance Criteria

- [ ] **(connection-identity)** CREATE_ROOM/JOIN_ROOM use the connection's authenticated identity and reject a different playerToken.
- [ ] **(no-token-only-login)** A bare token no longer logs a user in; device-key login is required.
- [ ] **(rotated-secrets)** Test and owner tokens are out of the repo and the public ones are rotated.
- [ ] **(main-is-prod)** git merge-base main <prod commit> equals the prod commit.
- [ ] **(pr-only)** main is protected: PR required, CI required, no force-push.
- [ ] **(ci-tags)** Tags are created by CI on the merge commit after the version bump; nobody tags by hand.
