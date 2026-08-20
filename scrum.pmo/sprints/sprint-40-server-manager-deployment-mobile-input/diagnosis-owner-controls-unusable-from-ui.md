# Diagnosis: owner-gated UI controls are structurally unusable from the browser (2026-08-20)

**Tron-facing headline, measured (code-read; tester's runtime matrix agrees).** Set-as-Current 403s not because Task 40.1 is unowned (tester AXIS-2: unowned task + owner session = 200 → task-ownership is irrelevant to the gate) but because **his browser never becomes a recognised owner.**

## The intended path, and the failing step
`make-current` → `requireOwnerHttp` → `resolveOwner(req)` (server.ts:943) passes iff ONE of:
1. a valid **`sm_session` owner cookie** (branch 1), OR
2. the **`OWNER_TOKEN` literal** (a public constant, not real identity), OR
3. the caller's **`x-player-token` header** → `profileUuidOf` → a profile in the protected-identity set (R40.45 put `05e58f81` there) (branch 3).

**MEASURED — the browser satisfies NONE of them, ever:**
- **No UI surface mints an `sm_session`.** `grep server-manager/session in src/public/ts` = **0**. The cookie is only obtainable via `POST /api/server-manager/session`, which the app itself never calls. ⇒ branch 1 unreachable from any page.
- **No client fetch sends `x-player-token`.** `grep x-player-token in src/public/ts` = **0**. Every owner-gated action — `make-current` (universal-actions.ts:138), approve/decline (:98), sprint designate (:171) — uses only `credentials:'same-origin'` (cookies), no identity header. ⇒ branch 3 never receives the token; `playerTokenFrom` reads empty; the R40.45 protected-identity check never runs.

⇒ **R40.45 readied the SERVER to recognise `05e58f81`, but the CLIENT was never wired to SEND identity.** So resolveOwner can only pass on the public `OWNER_TOKEN` literal — which no real user carries. **Every owner-gated control (Set-as-Current, Approve, Decline, sprint-designate) is unusable from the UI for EVERYONE, Tron included.** The tester's 200s come from a scratch session that manually mints the cookie; no real browser does that.

## The failing step, named
**The client never transmits owner identity on owner-gated requests** — it neither mints the session cookie nor sends the player-token header the server checks. That single gap shuts all three doors.

## Recommended fix (route to req)
**Send `x-player-token` (the player's `rawbin-player-id`) on owner-gated fetches** via ONE shared authed-fetch helper, used by make-current + approve + decline + designate. Then `resolveOwner` branch 3 maps it via `profileUuidOf` → `05e58f81` → protected set → 200. This REUSES the R40.45 server path (no new server trust surface); the fix is purely "the client sends the identity the server already knows how to verify." One helper, all owner actions — so it can't regress per-call-site again (make-current was exactly a call site the R40.45 work never reached).
- Do NOT accept "mint a cookie manually" — he'd hit it on every device and the UI's owner controls stay decorative.
- INV: a non-owner token still 403s (profileUuidOf → not in protected set); fail-closed unchanged.
