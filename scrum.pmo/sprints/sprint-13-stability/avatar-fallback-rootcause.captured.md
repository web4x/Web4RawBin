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
