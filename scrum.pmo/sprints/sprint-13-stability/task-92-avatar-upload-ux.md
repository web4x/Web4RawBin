[Back to Sprint 13 Planning](./planning.md)

# T92: Avatar Upload — Never Expose Key Errors to User

[task:uuid:f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f809200]

## Tron Requirement (literal)

> TRON DIRECTIVE: "i tried to upload a new one… got the message key not found. a user should not need to know anything about the keys."

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement (architect)
  - [x] implementing (expert)
  - [ ] testing (tester)
- [ ] QA Review
- [ ] Done

## Implementation (robbin-expert, 2026-05-26, v0.4.11)
Three changes; no crypto/key term reaches the user (UC-AV10):
- **Server self-heal** (POST /api/avatar): replaced the `if (!profile?.sshKeysGenerated) → 'SSH keys not generated'` reject with: `if (!profile) → generic 'Upload failed, please try again'`; then `if (!hasUserKeys(playerToken)) { generateUserKeypair(playerToken); profile.sshKeysGenerated = true; saveProfiles(); addLog(...) }` — idempotent self-heal of the flag/file desync before encrypting (AC2/AC5). Added `hasUserKeys` to the UserKeys import.
- **Server generic catch** (POST /api/avatar): `catch` now `addLog('Avatar POST error: ' + msg)` (real error for debugging, AC4) and returns `{ error: 'Upload failed, please try again' }` — never the raw message (AC1).
- **Client** rb-avatar.ts:211: both the `else` and `catch` branches now `alert('Upload failed. Please try again.')` — never echoes `result.error` (AC1/AC3).
- tsc clean, build v0.4.11, sw.js cache rawbin-v0.4.11. Bundled with T91. Commit reported to PO.

## Diagram
[avatar-workflow.svg](./diagrams/avatar-workflow.svg) ([source](./diagrams/avatar-workflow.puml)) — UC-AV9/AV10 (keyless-UX guard nodes) are the T92 targets.

## Root-Cause Findings (robbin-architect, 2026-05-26 — evidence-backed)

**CONFIRMED: raw crypto error string is passed through, server → client → user.**

Two leak points, both verified:
1. **Server** `POST /api/avatar` (server.ts:336): `catch (e: any) { res.end(JSON.stringify({ error: e?.message || 'Bad request' })) }` — returns the RAW exception message. When `encryptFile()` → `getUserPublicKey()` returns null, UserCrypto throws `'User public key not found'`; that exact text is sent as `error`.
2. **Client** `rb-avatar.ts:211`: `alert(result.error || 'Upload failed')` — alerts whatever the server sent verbatim → user sees "...key not found".

**Why the key is missing despite the flag:** server.ts:322 guards `if (!profile.sshKeysGenerated) → 'SSH keys not generated'`, but the "key not found" comes from `encryptFile` failing when the key FILE is absent/corrupt even though the `sshKeysGenerated` FLAG is true (flag/file desync — keys never written, deleted, or wrong perms). The flag is not a reliable proxy for file presence.

**Fix direction (drives AC1-AC4):**
- Server: in the `POST /api/avatar` catch, log the real error via `addLog(...)` (debugging) but return a generic `{ error: 'Upload failed, please try again' }` — NEVER the raw message. Before encrypting, if `!hasUserKeys(token)`, call `generateUserKeypair(token)` (idempotent — skips if present) to self-heal the flag/file desync, then retry.
- Client: rb-avatar.ts:211 — replace `alert(result.error || ...)` with a fixed user-friendly string; never echo `result.error`.
- Constraint (UC-AV10): NO crypto/key term ever appears in user-facing output anywhere.

## Traceability
- up
  - [requirement:uuid:b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e](./requirements.md) — R-A2: Upload must not expose key errors
  - [Sprint 13 Planning](./planning.md)
- down
  - None (atomic task)
- chain
  - **requirement:** R-A2 in [requirements.md](./requirements.md)
  - **class/method:** `POST /api/avatar` handler in server.ts, `UserCrypto.encryptFile()`, `rb-avatar.ts` upload handler (line ~164)

## Task Description

**Bug:** When uploading an avatar, the user sees "key not found" error. This is a raw crypto error from `UserCrypto.encryptFile()` bubbling up to the client via the API response.

**Two issues:**
1. **Backend:** `POST /api/avatar` returns the raw error message from `encryptFile()` (which throws "User public key not found"). The API should catch this and return a user-friendly message.
2. **Client:** `rb-avatar.ts` line ~173 does `alert(result.error || 'Upload failed')` — shows whatever the server sends, including crypto internals.

**Root cause of the key-not-found:** The user's SSH keys may not have been generated (profile gate race condition), or the key files were deleted/corrupted. The server should handle this gracefully — either auto-regenerate keys or return a message like "Upload temporarily unavailable, please try again."

**Investigation needed by architect:**
1. Under what conditions does `getUserPublicKey()` return null? (Key files missing, wrong permissions, corrupt)
2. Should the server auto-regenerate keys if missing? (Idempotent — `generateUserKeypair` already skips if keys exist)
3. What user-facing message should replace "key not found"?

## Acceptance Criteria
- [ ] AC1: Avatar upload NEVER shows "key not found" or any crypto-related error to user
- [ ] AC2: If keys are missing, server auto-regenerates before encrypting (or returns friendly retry message)
- [ ] AC3: Client shows user-friendly error: "Upload failed. Please try again." (no technical details)
- [ ] AC4: Server logs the actual crypto error for debugging (addLog)
- [ ] AC5: Successful upload after key regeneration works end-to-end

## QA Audit & User Feedback
- 2026-05-26: Tron directive — "got the message key not found. a user should not need to know anything about the keys." Awaiting architect refinement, then Tron QA.

## Subtasks
None (atomic task).
