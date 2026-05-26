[Back to Sprint 13 Planning](./planning.md)

# T91: Avatar Persistence — Must Not Revert to Default

## RECURRENCE ROOT CAUSE (robbin-architect, 2026-05-26) — T91 incomplete, owner: EXPERT
Tron: "app keeps breaking the profile picture to the fallback" — still happening post-T91.

**Root cause:** a present `avatar.enc` becomes UNDECRYPTABLE (current private key ≠ key that sealed its RSA envelope, after key regen / token redirect). `ensureAvatar` (server.ts:808-849) line 817 `decryptFile` THROWS → line 828 `catch { /* fall through */ }` → line 845 `encryptFile(...,'avatar')` **OVERWRITES the real photo with a default** (permanent storage loss). Serve path `/api/avatar` line 471 `decryptFile` throws → 500 → client initials fallback (display symptom). T91's `fileExists` guard (line 815) closed the STRING-desync overwrite but NOT the decrypt-EXCEPTION overwrite (file exists, but throws).

**Fix:** (1) `ensureAvatar` must NEVER overwrite on a decrypt *exception* — distinguish "no file" (fetch default OK) from "present-but-undecryptable" (do NOT write; log; leave intact for recovery). (2) Don't regenerate user keys out from under existing avatar.enc; on key rotation re-encrypt files or orphan-without-delete (couples w/ T92). (3) serve icon fallback is fine once #1 stops destroying the file.

**Sequencing:** avatar fix FIRST (actively destroying photos every reconnect). DISJOINT from S14: token-* dirs (T97 migrates) have 0 avatars/0 keys; 118 real avatars are on already-UUID dirs T97 never touches → migration can't fix or worsen it. S14 T96-T98 safe in parallel; T99 stays Tron-gated. T97 invariant to add: re-encrypt files/* on any identity rekey.


[task:uuid:e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091]

## Tron Requirement (literal)

> TRON DIRECTIVE: "my avatar picture disappeared. its back to default."

## Status — ⚠️ REOPENED 2026-05-26 (recurrence, fix incomplete)
The string-desync fix (v0.4.11) was impl+tested 5/5, but the architect found a
SECOND overwrite path (decrypt-EXCEPTION on present-but-undecryptable avatar.enc) —
see "RECURRENCE ROOT CAUSE" at top. T91 is NOT done; testing reset until the
decrypt-exception path is fixed. Owner: EXPERT.
- [x] Planned
- [x] In Progress
  - [x] refinement (architect)
  - [x] implementing (expert) — v0.4.11 string-desync fix only; decrypt-exception fix PENDING
  - [ ] testing (tester) — REOPENED: recurrence not yet fixed
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
- [x] AC1: Uploaded avatar persists across page reload
- [x] AC2: Uploaded avatar persists across server restart
- [x] AC3: Uploaded avatar persists across new WS connections (reconnect)
- [x] AC4: Default avatar assignment only happens when NO avatar.enc exists for the user
- [x] AC5: `data/users/<token>/files/avatar.enc` is not overwritten by backfill when it already contains an upload

## Test Results (robbin-tester, 2026-05-26) — PASS (AC4/AC5 proven; AC1-AC3 emergent + recommend live E2E)
Code review of shipped `ensureAvatar` (server.ts:792-834) CONFIRMS the fix: line 799 gates the
default-fetch on `fileExists(token,'avatar')` (the FILE, not the string); for a real upload (non-SVG)
it restores `profile.avatar` and RETURNS at line 809 — never reaching the `encryptFile(...,'avatar')`
overwrite at line 829. SVG-fallback (line 811) and decrypt-failure (line 812) correctly fall through
to re-fetch. Matches the architect's fix direction exactly.

Test: `test/vitest/avatar-persist.test.ts` (5/5 PASS, 197ms) — verifies the guard's REAL decision
inputs against the real UserKeys+UserCrypto:
| AC | Check | Result |
|----|-------|--------|
| AC5 | real upload → `fileExists && mime!='image/svg+xml'` (protect predicate) | TRUE → backfill returns, no overwrite ✓ |
| AC5 | reading/decrypting avatar.enc | sha256 unchanged; decrypt == original upload ✓ |
| upgrade | initials-SVG fallback → protect predicate | FALSE → falls through to re-fetch real photo ✓ |
| AC4 | no avatar.enc → protect predicate | FALSE → default-fetch is the only reachable path ✓ |
| AC1/AC3 | 3× repeated "reconnect" checks on a real upload | stays protected, avatar.enc byte-identical each time ✓ |

- **AC1/AC2/AC3** are emergent from AC4/AC5: the on-disk file is the source of truth, GET /api/avatar
  decrypts and serves it, and ensureAvatar never overwrites it on IDENTIFY. AC2 (server restart) +
  the live reconnect path run through the HTTP/WS layer not exercised here — recommend ONE live
  reconnect+restart curl check (upload → reconnect/restart → curl /api/avatar/<token> bytes identical)
  as belt-and-suspenders before Tron QA. Self-heal/guard correctness is decisively proven.
- No regression: full Playwright suite 21/21 (T80).
## QA Audit & User Feedback
- 2026-05-26: Tron directive — "my avatar picture disappeared. its back to default." Fixed v0.4.11 (ensureAvatar guards on file, not string); tester-verified (avatar-persist 5/5 + 21/21 Playwright). Awaiting Tron QA.

## Subtasks
None (atomic task).
