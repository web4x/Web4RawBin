[Back to Sprint 13 Planning](./planning.md)

# T92: Avatar Upload — Never Expose Key Errors to User

[task:uuid:f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f809200]

## Tron Requirement (literal)

> TRON DIRECTIVE: "i tried to upload a new one… got the message key not found. a user should not need to know anything about the keys."

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement (architect)
  - [ ] implementing (expert)
  - [ ] testing (tester)
- [ ] QA Review
- [ ] Done

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
