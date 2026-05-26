# Avatar-Fallback Recurrence — Root Cause (architect diagnosis)

**Captured by robbin-po from the architect's pane at ~2% context, before agent-trainer rewind, so the diagnosis is not lost.** Architect to confirm/refine post-rewind from its committed context.

## Root Cause
The real avatar reverting to the "shitty fallback" is a **key/file desync on identity rekey**:
- The user's avatar is stored encrypted as `avatar.enc`, encrypted with the user's keypair.
- When the keypair is **regenerated / rotated** (e.g. T92's keyless-upload self-heal calling `regenerateUserKeypair` on an encrypt failure, or any identity rekey), the existing `avatar.enc` was encrypted with the **OLD** key.
- The new key **cannot decrypt** the old `avatar.enc` → avatar **fails to load** → client falls back to the SVG/default avatar.
- The SVG fallback as a *transient display fallback* is fine; the BUG is the **orphaned ciphertext** that makes the real avatar permanently unloadable after a rekey. (T91's `ensureAvatar` fileExists guard doesn't help — the file exists, it's just undecryptable.)

## Fix (architect)
On **ANY identity rekey**, **RE-ENCRYPT the user's `files/*`** (including `avatar.enc`) with the new key, so no ciphertext is left orphaned/undecryptable. The architect frames this as a shared invariant (also S14 **T97**: "re-encrypt files/* on any identity rekey") — the same guardrail prevents the migration from reintroducing the bug.

## Sequencing call (architect)
1. **Avatar fix is #1** — it's the live bug.
2. **S14 migrate+verify (T96–T98) is safe in parallel / non-destructive** — T97 only touches `token-<ts>` dirs → UUID; it never touches already-UUID dirs or avatars, so the migration **can't fix and can't worsen** the avatar bug. **T99 removal stays Tron-gated.**
3. Order: **avatar fix → then S14**, to avoid concurrent-write overlap on `data/users/`.

## Next (architect, post-rewind)
Confirm this root cause, then: avatar fix spec (expert implements re-encrypt-on-rekey) → S14 T97 invariant → S15 T104 Object.verb diagrams.

## FIX IMPLEMENTED (robbin-expert, 2026-05-26, v0.5.9, commit <pending>)
Re-encrypt-on-rekey invariant, as the architect specified.
- **New primitive `rekeyUser(token)` in `UserCrypto.ts`** (`[impl:uuid:13a4b5c6-d7e8-4f90-a1b2-c3d4e5f60097]`): (1) snapshot every file's plaintext by decrypting with the CURRENT key (`listUserFiles` → `decryptFile`), (2) `regenerateUserKeypair(token)` (rotate), (3) RE-ENCRYPT each snapshot with the NEW key (`encryptFile`, same storedName/originalName/mimeType). Files undecryptable with the current key (old key already gone/corrupt) are counted as `lost` and skipped — unrecoverable, not our regression. Result: after a rekey, `avatar.enc` is re-wrapped with the new key → `/api/avatar/<token>` still decrypts → NO revert to SVG fallback.
- **Wired at the rotation site:** `server.ts` avatar-POST self-heal catch now calls `rekeyUser(playerToken)` instead of the bare `regenerateUserKeypair` — so any other files are preserved across the regen (the fresh avatar is then written with the new key). Removed the now-unused `regenerateUserKeypair` import from server.ts.
- **Rotation-site audit:** the only force-rotation of a (possibly) live key is that self-heal catch. The other two `generateUserKeypair` calls (avatar-POST pre-encrypt + profile-commit) are idempotent first-time gen — they do NOT rotate an existing good key, so they cannot orphan a good avatar; left unchanged.
- **Reusable for S14 T97:** `rekeyUser` is the shared "re-encrypt files/* on any identity rekey" guardrail — the migration should route any identity rekey through it.
- tsc + build clean. v0.5.9, sw.js cache rawbin-v0.5.9. Tester verifies: "avatar survives a keypair regen" (upload avatar → rekeyUser → /api/avatar still returns the same bytes, no SVG fallback).
