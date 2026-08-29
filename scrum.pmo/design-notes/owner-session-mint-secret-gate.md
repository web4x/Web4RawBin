# Owner session-mint SECRET-GATE — pre-design (architect, 2026-08-29, PO top-priority)

★ FRAMING CORRECTION (I own it): I earlier called session-mint a "follow-on." It is THE critical open question. **05e58f81 is itself token==uuid (public — the PO read it from an UNAUTHENTICATED API response).** So "Tron authenticates as 05e58f81" solves the LOCKOUT but NOT EXCLUSIVITY: if a bare public token mints a session, then anyone who reads a task's `ownerIor` can present that uuid and become owner. **The lockout and the vulnerability are independent. This is a live RCE-class hole on the owner credential.** Pre-designed here so we ship immediately IF the measurement confirms it.

## THE HOLE (measured, pending expert confirmation of live exploit)
`ownerByToken` (server.ts:948) = `userProfiles.has(token) && !revoked && profileUuidOf(token) ∈ list` — a **BARE TOKEN presentation**. If the profile's token == its public uuid (the PO's measurement), presenting the public uuid → `userProfiles.has(it)` → owner. And server.ts:984 already flags the `tokenToClient` liveness gate as FORGEABLE (ws-IDENTIFY sets it with the client-supplied token). ⇒ a bare public uuid, readable from any task's ownerIor, authenticates as owner.

## THE SECRET PROOF ALREADY EXISTS (the fix builds on it, not new crypto)
On WS connect the server issues a random `challenge` (crypto.randomBytes 32, server.ts:3857); an ENROLLED device signs it with its keypair; `verifyChallenge` (UserKeys.js) verifies the signature; `client.authenticated` starts `false` (3858) and is set true only on a passed challenge. This is UNFORGEABLE — a holder of only the public uuid CANNOT sign the challenge. Tron has **16 enrolled devices** → his legit sessions pass by construction.

## FIX-SHAPE — owner-auth requires a SECRET PROOF, never a bare token
- **`ownerByToken` / `resolveOwner` / the sm_session mint must require the session be CHALLENGE-AUTHENTICATED** (an enrolled-device signed challenge passed = `client.authenticated===true` via the keypair path), IN ADDITION to the token's profile being the owner. A bare token — especially a public uuid — that has NOT passed the enrolled-device challenge is **NOT owner** (403 / unauthenticated).
- **By construction the owner credential = the enrolled-device KEYPAIR** (a secret the device holds), the secretCode a secondary secret path — **NEVER the public uuid.** Owner-auth = "this session proved possession of an enrolled device's private key for the owner profile," not "this session presented the owner's uuid."
- **Fix ONLY here (the auth gate), NEVER by consolidation** — consolidation would spread the forgeability, not close it.

## RED BASELINES (both proven before ship — the RCE case AND the legit case)
1. ★ Present the owner's PUBLIC uuid (as read from a task's `ownerIor`) via IDENTIFY WITHOUT an enrolled-device signed challenge → **403 / unauthenticated** (the RCE, MUST be closed — this is the security RED baseline, the case that must NOT pass).
2. An enrolled device (Tron's, passing the signed challenge) → **owner** (the legit case must still work — no lockout regression).

## BLAST RADIUS (this TIGHTENS auth — measure before ship)
Requiring the challenge must not lock out legit sessions that today rely on bare-token. Tron's 16 enrolled devices pass. Measure any OTHER legit caller that authenticates by bare-token-only (a service, a script) — those need enrollment or a secret path, or they break. The enrolled-device challenge is the INTENDED auth; bare-token was the hole. Roll out: prove RED baseline 1 (closed) + RED baseline 2 (legit passes) + enumerate any bare-token dependents, on Tron's surface @390. Atomic served==committed. Ship immediately IF the measurement confirms the exploit; hold if legit bare-token dependents need migration first.

## ★ CONFIRMED + SCOPE REFINED (2026-08-29, expert empirical: bare-token→owner = TRUE, control=false)
The RCE is LIVE: `ownerByToken(bare public token, no secret)` = TRUE. The hole is the **protected-identity path (`resolveOwner`:963 → `ownerByToken`:948)** — a public uuid in-list, no challenge, no live-session req.
- ★ **SURGICAL SCOPE — tighten ONLY the `ownerByToken` PUBLIC-IDENTITY path.** Require `client.authenticated===true` via the enrolled-device signed challenge (`verifyChallenge`) for the protected-identity owner determination. A public uuid that hasn't signed the challenge → NOT owner.
- ★ **KEEP the `assertOwner` / OWNER_TOKEN-SECRET path INTACT** — the tooling (R40.31 / purge / e2e) authenticates with the OWNER_TOKEN **secret** (not a public uuid), which is already secret-gated and NOT the hole. Do NOT touch it. `post-deploy-gate.mjs` references none of x-player-token/OWNER_TOKEN/sm_session → unaffected.
- **Bare-token dependents that break** = only callers presenting a bare PUBLIC uuid for owner — none of ours by design (all tooling uses the OWNER_TOKEN secret). Tester confirms across the ~70 gate files.
- **RED BASELINES (all three, before ship):** (1) public-uuid via IDENTIFY, no challenge → **403** (the RCE, closed); (2) enrolled-device signed challenge → **owner** (no lockout regression); (3) ★ OWNER_TOKEN-secret (assertOwner path) → **still owner** (prove the tooling path SURVIVES the tighten).
- **BUILD:** expert builds to this design (my role = design + backstop, not implement); I backstop the diff (public-path-only tightened / assertOwner untouched / 3 RED baselines) + the tester's ~70-file bare-token sweep. **PO GO gates the deploy** (prod security change on the live owner credential). Atomic served==committed; verify on Tron's surface @390 (his enrolled device = owner; a bare uuid = 403).
