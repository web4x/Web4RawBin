<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# T91: Avatar Persistence — Must Not Revert to Default

[task:uuid:b2e72ab1-0111-420b-b82b-387a3b339567]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement (architect)
  - [x] implementing (expert)
  - [x] testing (tester — avatar-persist 5/5, string-desync scope)
- [ ] QA Review
- [ ] Done

## Traceability

- up
  - [requirement:uuid:a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d](./requirements.md) — R-A1: Avatar must persist
  - [Sprint 13 Planning](./planning.md)
- down
  - None (atomic task)
- chain
  - **requirement:** R-A1 in [requirements.md](./requirements.md)
  - **class/method:** `server.ts` IDENTIFY handler (avatar backfill logic), `UserCrypto.ts` encryptFile/decryptFile, `GET /api/avatar/<token>`

## Task Description

**Bug:** User's uploaded avatar reverts to thispersondoesnotexist default after reconnect/restart. The uploaded avatar file exists in `data/users/<token>/files/avatar.enc` but is being overwritten by the default avatar backfill logic.

**Likely root cause:** The IDENTIFY handler in server.ts has a backfill condition that fetches a new thispersondoesnotexist avatar when `!profile.avatar || !profile.avatar.startsWith('/api/avatar/')`. If `profile.avatar` is cleared or not persisted correctly, the backfill overwrites the user's uploaded avatar.

**Investigation needed by architect:**
1. Is `profile.avatar` persisted correctly after upload? (Check `POST /api/avatar` → `saveProfiles()`)
2. Does the IDENTIFY backfill condition fire even when avatar.enc exists? (Check condition vs file existence)
3. Does server restart reload `profile.avatar` from profiles.json? (Check `loadProfiles()`)
4. Is there a race between IDENTIFY backfill (async) and the client reading the profile?

## Acceptance Criteria

- [x] AC1: Uploaded avatar persists across page reload
- [x] AC2: Uploaded avatar persists across server restart
- [x] AC3: Uploaded avatar persists across new WS connections (reconnect)
- [x] AC4: Default avatar assignment only happens when NO avatar.enc exists for the user
- [x] AC5: `data/users/<token>/files/avatar.enc` is not overwritten by backfill when it already contains an upload

## QA Audit & User Feedback

- 2026-05-26: Tron directive — "my avatar picture disappeared. its back to default." Fixed v0.4.11 (ensureAvatar guards on file, not string); tester-verified (avatar-persist 5/5 + 21/21 Playwright). Awaiting Tron QA.

## Subtasks

None (atomic task).
