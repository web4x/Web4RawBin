# Structural literal-trust removal (server-manager RCE root) — MEASURED design INPUT for architect ratify

**Author:** robbin-expert · **2026-08-24** · **NOT a build — a measured proposal. Do NOT edit auth code until architect ratifies the shape** (my prior sm_session gate was HELD as RCE-reopening; this surface is architect-backstopped by rule). **NOT deployable until Tron ROTATES the token.** Terminal stays SEVERED (server.ts:3705) = safe state.

## The RCE chain (measured on disk, HEAD 279183055 / v0.8.130)
`x-player-token: 41ad88c4…` (the PUBLIC literal, committed in 37 tracked files) → gate at **server.ts:1664** = `requireFeatureAccessHttp('Server Manager')` (data-driven `Feature.allowedUsers` membership) → **POST /api/server-manager/session** mints an `sm_session` cookie (owner:true, server.ts:1735-1737) → that cookie authenticates the **terminal ws-upgrade** → **PTY → shell**.

The literal passes the membership gate because **`ServerManagerGuard.seedOwnerInto` pushes `OWNER_TOKEN` into every `Feature.allowedUsers`** as the bootstrap root-of-trust (ServerManagerGuard.ts:69-71, called by FeatureManager.bootstrapSeed). It is ALSO accepted directly by `assertOwner`/`isOwner` (timingSafeEqual against the literal, :29/:40) which `resolveOwner` path-(a) uses.

## ★ KEY FINDING — a NON-literal owner path ALREADY exists (so removal need NOT lock the owner out)
`resolveOwner` (server.ts:943-959) has TWO owner paths:
- **(a) literal** — `assertOwner` timingSafeEqual against `OWNER_TOKEN` 41ad88c4. **← the RCE root.**
- **(b) protected-identity** — the caller's REAL player token → `FeatureManager.profileUuidOf(token)` → the owner's **Profile-unit uuid**; owner iff that uuid ∈ `loadProtectedIdentities().ids` (contains Tron's profile **05e58f81**). This is keyed on the owner's per-user PROFILE identity, **not** the shared public literal.

Path (b) is seeded into `allowedUsers` at boot separately (the protected-identities re-seed, FeatureManager.ts:26). So the legitimate owner authenticates as **05e58f81** without the literal.

## Proposed structural shape (make the literal authenticate NOWHERE) — for architect ratify
1. **Remove the literal as a seed:** `seedOwnerInto` no longer pushes `OWNER_TOKEN` into `allowedUsers`. Owner bootstrap = protected-identity membership (05e58f81) ONLY. ⇒ the literal is not a member ⇒ fails `requireFeatureAccess` ⇒ **cannot mint a session** ⇒ cannot reach the terminal.
2. **Remove path (a) literal-trust:** `assertOwner`/`isOwner` no longer timingSafeEqual against a hardcoded literal. `resolveOwner` keeps ONLY path (b) protected-identity. (Or: if a bootstrap owner-secret is still needed, load it from a NON-TRACKED source — env `SM_OWNER_TOKEN` / untracked `~/config` — never a source literal, fail-closed when unset. Architect to choose: pure-protected-identity vs secret-from-config.)
3. **Delete the `OWNER_TOKEN` literal from ServerManagerGuard.ts.** Repurpose the INV-G2 grep-lint: assert ZERO hardcoded owner-token literal in any source auth path (the burned value 41ad88c4 must appear in NO auth-accepting code).
4. **Terminal gate** (when eventually un-severed, separate step): gate on `sm_session` owner:true — sound ONLY because the mint now requires the real protected identity, so the literal can't obtain a session.

## Open questions for the architect (I will not guess these on an RCE surface)
- **Q1 — availability fallback:** today a protected-identities config LOAD ERROR falls back to seeding the literal owner (FeatureManager.ts:25 "owner-only seed fallback"). Removing the literal-seed means a broken config ⇒ NO owner can auth (fail-CLOSED). Security-correct, but an availability tradeoff — PO/architect must accept it. Fail-closed is my recommendation (an RCE fallback is worse than an outage).
- **Q2 — is path (b) sound end-to-end?** Confirm `profileUuidOf(token)` cannot be driven to 05e58f81 by any attacker-presentable token (the token→profile binding must be the owner's own per-user secret, `tokenToClient`/profiles map). If sound, (b) is a complete owner auth.
- **Q3 — client secret delivery:** the mint button (server.ts:1130) sends `token` as x-player-token. Post-removal the owner's client must present its protected-identity player token (which it already holds as `rawbin-player-id`) — confirm no client change needed, or scope it.
- **Q4 — bootstrap-secret source (only if Q1/Q2 don't fully cover owner auth):** env vs untracked config; fail-closed semantics. Tron sets the value (rotation) — I NEVER write a secret value (propose+GO discipline).

## MANDATORY FAILABLE TEST (architect-required; must exercise the full chain, not no-cookie→403)
`literal 41ad88c4` → `POST /api/server-manager/session` → **use the returned cookie** → terminal ws-upgrade must **403, no PTY**. GREEN-if-connects = **RED** (the RCE returned). Plus: broken/absent protected-identity config ⇒ mint 403 (fail-closed); the REAL protected identity ⇒ owner path still works (no lock-out).

## Sequencing
architect ratifies shape → I build to it (auth code + failable test + repurposed INV-G2 lint) → architect re-backstops the FULL chain → **Tron rotates OWNER_TOKEN** (I never write the value) → only THEN un-sever + deploy. Zero rush (PO: "rather Tron wait than reopen an RCE").
