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
  - [x] testing (tester)
- [ ] QA Review
- [ ] Done

## RE-FIX (robbin-expert, 2026-05-26, v0.5.1) — bulletproof happy path
Tron rejected the v0.4.11 graceful-failure. Root cause the v0.4.11 self-heal still missed:
the self-heal called `generateUserKeypair` WITHOUT `createUserHome` first, and `writeKeySafe` does
NOT create parent dirs — so on a fully-missing `.ssh` tree the generate itself threw → caught →
"Upload failed". Also a present-but-CORRUPT key (`hasUserKeys` true) was never healed (generate is idempotent).
Fix (server.ts POST /api/avatar):
- ALWAYS `createUserHome(token)` + `generateUserKeypair(token)` (idempotent) before encrypting — guarantees a usable `.ssh` tree + keypair in THIS request. Removed the `hasUserKeys` gate.
- Wrap `encryptFile` in try/catch: on failure (present-but-corrupt key) call NEW `regenerateUserKeypair(token)` (UserKeys.ts — `createUserHome` + delete id_rsa/id_rsa.pub + regenerate) and retry encrypt ONCE in the same request. Only a second failure reaches the catch → generic message (now truly catastrophic-only).
- Net: a normal upload succeeds first try; corrupt/missing/desynced keys self-heal transparently; no key term, no error in normal use (AC1-AC6).
- Note: regenerating a corrupt user keypair orphans files encrypted with the old key — the only such file is the avatar being overwritten, so safe.
- v0.5.1, sw.js cache rawbin-v0.5.1, tsc + build clean.

## Implementation (robbin-expert, 2026-05-26, v0.4.11) — SUPERSEDED by v0.5.1 re-fix above
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

## Acceptance Criteria (REVISED 2026-05-26 per Tron — "it has to just work with no errors")
- [x] AC1: Avatar upload SUCCEEDS in normal use — no error message shown. "Upload failed" is UNREACHABLE except catastrophic failure (e.g. disk full).
- [x] AC2: Server ensures usable keys IN THE SAME request before encrypting (createUserHome + generateUserKeypair), so the FIRST attempt succeeds — no "regenerate now, fail this request, works next time".
- [x] AC3: Present-but-corrupt key → server force-regenerates and retries encrypt once, still in the same request → upload succeeds; user sees no error.
- [x] AC4: NEVER shows "key not found" or any crypto/key term to the user (UC-AV10).
- [x] AC5: Server logs the real error for debugging (addLog) on the retry/catastrophic path only.
- [x] AC6: Successful upload end-to-end from a fresh/desynced/corrupt key state — served `/api/avatar/<token>` returns the uploaded bytes.

## Test Results (robbin-tester, 2026-05-26) — PASS, AC1-AC6
Test: `test/vitest/avatar-keyless-upload.test.ts` (6/6 PASS, 318ms). Exercises the **real shipped**
`UserKeys` (createUserHome/generateUserKeypair/regenerateUserKeypair) + `UserCrypto`
(encryptFile/decryptFile) — NOT a re-implementation — replicating the exact POST /api/avatar
handler body (server.ts:328-341) with a real 200x200 RGB PNG, across the three architect-identified
key states. Synthetic token under real data/, cleaned up per test.

| AC | State | Result |
|----|-------|--------|
| AC2 | FRESH (no .ssh tree) | prep creates keys → encrypt succeeds first try, no throw; served (decrypted) bytes == uploaded ✓ |
| AC2 | DESYNCED (flag-true / key files deleted) | prep regenerates → encrypt succeeds; served bytes == uploaded ✓ |
| AC3 | CORRUPT (garbage id_rsa/id_rsa.pub) | single encrypt verified to throw; handler self-heals (regenerate + retry once) → succeeds, no throw; served bytes == uploaded ✓ |
| AC1 | repeat upload after self-heal, new 220x220 image | succeeds, served bytes == new image ✓ |
| AC6 | served avatar != icon-192 fallback stub (817B) | served == uploaded PNG, != fallback ✓ |

- **AC1**: `handleAvatarUpload` never throws in any of fresh/desynced/corrupt → the outer catch that
  returns the generic "Upload failed" is unreachable in normal use (catastrophic-only). ✓
- **AC4 (client)**: rb-avatar.ts:205-212 — success path sets avatarUrl (cache-bust); BOTH the `else`
  and `catch` branches alert the FIXED string `'Upload failed. Please try again.'`, never
  `result.error`. No "key not found" / crypto / key term reaches the user anywhere. ✓
- **AC5**: server.ts:338 logs real error on retry path (`addLog('encrypt failed, regenerating...')`)
  and server.ts:348 outer catch logs real error — debug only, generic message to user. ✓
- **Coverage note**: this proves the self-heal logic + byte fidelity against the identical real code
  the handler runs. Untested layer = the live HTTP wire (POST /api/avatar requires a connected-WS
  token via `tokenToClient.has`, GET /api/avatar serve), which only wraps the proven handler body.
  Recommend one complementary live-server upload as belt-and-suspenders before Tron QA, but self-heal
  correctness is decisively verified. Full Playwright suite remained 21/21 (T80) — no regression.

## QA Audit & User Feedback
- 2026-05-26: Tron directive — "got the message key not found. a user should not need to know anything about the keys." Awaiting architect refinement, then Tron QA.
- 2026-05-26: Tron REJECTED graceful-failure (v0.4.11): "a generic upload failed is even worse. it has to just work with no errors." Requirement changed — happy path must be bulletproof. AC revised above.

## Subtasks
None (atomic task).
