<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 42.5: Phase 4 — close the auth gaps, CI-made releases

[task:uuid:cfff2674-5358-4149-b672-762cc76a94a5]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing (connection identity PR #6; CI-made release tags)
  - [x] implementing (device-key login instead of bare token: IDENTIFY parked until DEVICE_AUTH or secret-code enrollment)
  - [ ] implementing (tokens out of the repo + rotation)
  - [x] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

Done 2026-11-22: CREATE_ROOM/JOIN_ROOM use the connection's identity (PR #6); release tags are made by CI (.github/workflows/release.yml + scripts/tag-on-merge.mjs: tag v<version> only when a push to main bumps the version). Open: device-key login instead of a bare token; test/owner tokens out of the repo and rotated (needs TRON's go). | 2026-11-23 (Tron: "no users automatically log in with a token only" — "with a key only"): an account with keys is entered only with an enrolled device key or by enrolling the device with the secret code (src/ts/server/login-gate.ts). Found while doing it: device-key login had never worked — authorized_keys holds multi-line PEM keys but was matched line by line (fixed in UserKeys.authorizedKeyEntries). Still open: tokens out of the repo + rotation (needs Tron's go), HTTP endpoints that accept ?token=.

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
