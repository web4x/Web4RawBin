[Back to Sprint 13 Planning](./planning.md)

# T91: Avatar Persistence — Must Not Revert to Default

[task:uuid:e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091]

## Tron Requirement (literal)

> TRON DIRECTIVE: "my avatar picture disappeared. its back to default."

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement (architect)
  - [x] implementing (expert)
  - [ ] testing (tester)
- [ ] QA Review
- [ ] Done

## Implementation (robbin-expert, 2026-05-26, v0.4.11)
Rewrote `ensureAvatar()` (server.ts) to trust the on-disk `avatar.enc` FILE, not the `profile.avatar` STRING:
- Gate the default fetch on `fileExists(token, 'avatar')` (not the string). If the file exists and decrypts to a non-SVG (real upload): restore `profile.avatar = /api/avatar/<token>` + saveProfiles only if desynced, then `return` — NEVER overwrite (AC4/AC5). Fixes the "back to default" desync.
- SVG-fallback upgrade path preserved: if stored avatar is `image/svg+xml`, fall through to re-fetch a real photo.
- Decrypt failure (corrupt) → fall through to fetch a fresh default (only when no usable avatar.enc).
- AC1/AC2/AC3 (persist across reload/restart/reconnect): the string is now reconstructed from the file on every IDENTIFY, so a cleared/desynced string self-corrects instead of clobbering the upload.
- tsc clean, build v0.4.11, sw.js cache rawbin-v0.4.11. Bundled with T92 (same avatar subsystem) — commit reported to PO.

## Diagram
[avatar-workflow.svg](./diagrams/avatar-workflow.svg) ([source](./diagrams/avatar-workflow.puml)) — UC-AV6 (restore, not reset) is the T91 target node.

## Root-Cause Findings (robbin-architect, 2026-05-26 — evidence-backed)

**CONFIRMED root cause: `ensureAvatar()` (server.ts:776-805) gates the default-avatar fetch on the `profile.avatar` STRING, not on the on-disk `avatar.enc` FILE — and `encryptFile(token, ..., 'avatar')` at line 801 OVERWRITES the existing `avatar.enc`.**

Trace:
- IDENTIFY (server.ts:1053): backfill fires when `!profile.avatar || !profile.avatar.startsWith('/api/avatar/')`.
- `ensureAvatar` (line 779): only returns early (keeps avatar) if `profile.avatar` is already an `/api/avatar/` URL AND it decrypts to a non-SVG. Otherwise falls through to line 787+ → fetches a NEW default → **line 801 overwrites `avatar.enc`** → the user's uploaded photo is destroyed on disk and `profile.avatar` reset.
- So whenever `profile.avatar` desyncs from the on-disk file (empty/cleared while `avatar.enc` still holds the real upload), the backfill replaces the real photo with a default. This is the "back to default" Tron saw.

Secondary: line 782 — if a prior avatar was an initials-SVG fallback (`image/svg+xml`), ensureAvatar intentionally re-fetches; harmless unless it clobbers a later real upload due to the same string-vs-file gap.

**Fix direction (drives AC4/AC5):** before fetching a default, check `fileExists(token, 'avatar')`. If the encrypted avatar exists, RESTORE `profile.avatar = /api/avatar/<token>` (+ saveProfiles) and return — NEVER overwrite an existing `avatar.enc` with a default. Only fetch a default when no `avatar.enc` exists.

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
- [ ] AC1: Uploaded avatar persists across page reload
- [ ] AC2: Uploaded avatar persists across server restart
- [ ] AC3: Uploaded avatar persists across new WS connections (reconnect)
- [ ] AC4: Default avatar assignment only happens when NO avatar.enc exists for the user
- [ ] AC5: `data/users/<token>/files/avatar.enc` is not overwritten by backfill when it already contains an upload

## QA Audit & User Feedback
- 2026-05-26: Tron directive — "my avatar picture disappeared. its back to default." Awaiting architect root-cause refinement, then Tron QA.

## Subtasks
None (atomic task).
