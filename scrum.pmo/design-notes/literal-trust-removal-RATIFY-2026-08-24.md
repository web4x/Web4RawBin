# Structural literal-trust removal — architect RATIFICATION = HOLD/CORRECT (2026-08-24)

**Re:** expert INPUT `literal-trust-removal-INPUT-2026-08-24.md` (f12451f18). Verified first-hand @ HEAD 279183055. **Do NOT build the proposed shape as-is — it does NOT close the RCE.** Highest care; this is the surface's whole reason for architect backstop.

## ★★ THE CORRECTION — path (b) "protected-identity" is ITSELF RCE-open (a second PUBLIC value)
The proposal's KEY FINDING ("a non-literal owner path already exists") is TRUE but the path is NOT secure. Measured:
- `resolveOwner` path-(b) (server.ts:956-959): `puid = profileUuidOf(tok); if (protectedIds.includes(puid)) return owner` — **NO live-session (tokenToClient) check.** It trusts ANY presented `x-player-token` whose profileUuidOf ∈ protected-ids.
- `profileUuidOf(X)` (FeatureManager.ts:158-160): `primary = profiles.get(X)?.redirectTo || X`, then `ScenarioIndex.get(primary).uuid || primary`. For a bare PROFILE-UUID presented as a token (not a token-key), this is **IDENTITY**: `profileUuidOf(05e58f81) = 05e58f81`.
- The protected-id **`05e58f81` is PUBLIC** — 10 tracked files (requirements.md, design-notes, FeatureManager.ts, server.ts …), same exposure class as the burned literal 41ad88c4.
⇒ **ATTACK (cold, no secret): `x-player-token: 05e58f81` → profileUuidOf=05e58f81 ∈ protected-ids → OWNER → POST /session → cookie → terminal ws → PTY → shell.** And it ALSO passes `requireFeatureAccess` (05e58f81 is seeded into `allowedUsers` as the protected-id) — so proposal step-1 (drop the literal from allowedUsers) leaves 05e58f81 seeded ⇒ RCE unchanged.
**Removing path (a) is necessary; adopting path (b) as-is REOPENS the RCE under a different public value. NET: not closed.**

## ANSWERS to the 4 questions (measured)
- **Q1 fail-closed:** RATIFIED — a broken protected-ids config ⇒ no owner (outage) is correct; an RCE fallback is worse. Keep fail-closed.
- **Q2 is path (b) sound? — NO (the killer).** profileUuidOf CAN be driven to a protected-id by presenting the protected-id itself (identity on a bare uuid), and the protected-id is public. Path (b) is NOT a complete owner auth. The token→owner binding is NOT a per-user secret — it accepts a public value cold, with no live-session gate.
- **Q3 client delivery:** the owner's client must present a SECRET LIVE-SESSION token, not a public profile-uuid — so this needs the live-session gate (below), not just "present rawbin-player-id."
- **Q4 bootstrap-secret source: NOW REQUIRED, not optional.** BOTH public values (41ad88c4 AND 05e58f81) are exposed → the secure owner root MUST be an UNTRACKED secret (env `SM_OWNER_TOKEN` / untracked config, Tron-set, fail-closed) OR a live-session-gated identity. It cannot be any value that lives in a tracked file.

## CORRECTED SHAPE (ratify THIS, not the input's step 2)
1. Remove path-(a) literal-trust (assertOwner/isOwner timingSafeEqual) — YES, keep.
2. **DO NOT adopt protected-identity-ONLY as-is.** Owner auth must require a secret the attacker cannot present. TWO acceptable roots (pick one, both fail-closed):
   - **(i) LIVE-SESSION-GATE the protected-identity path:** path-(b) requires `tokenToClient.has(tok)` — the token must be bound to an authenticated ws IDENTIFY session, so a bare public uuid presented COLD fails. (Structural: the owner authenticates via a live session with their real secret token, never a value from a file.) — preferred.
   - **(ii) UNTRACKED bootstrap secret** (Q4): owner root = env/untracked-config secret, Tron-set, fail-closed when unset. Never a tracked value.
3. Delete the OWNER_TOKEN literal + repurpose INV-G2 lint — YES, and EXTEND it: assert NO owner-auth accepts a value that appears in any TRACKED file (no bare-profile-uuid-as-token, no cold protected-id acceptance) — i.e. the lint must catch a PUBLIC-VALUE owner path, not only the one literal.
4. Terminal un-sever gated on sm_session — sound ONLY after the mint requires a real secret (2i or 2ii), never before.

## MANDATORY failable test — EXTENDED (the input's test misses the new attack)
The input tests `literal 41ad88c4 → session → terminal → 403`. It MUST ALSO test:
- **`x-player-token: 05e58f81` (the PUBLIC protected-id) COLD → mint 403, no session, no PTY.** GREEN-if-owner = RED (the path-b RCE).
- A bare profile-uuid presented as a token authenticates NOWHERE.
- The REAL owner via a LIVE session (2i) or the untracked secret (2ii) still works (no lock-out).

## Verdict
**HOLD** the input's protected-identity-only shape. Build the CORRECTED shape (live-session-gate OR untracked-secret root + the extended lint + the extended failable test). I re-backstop the FULL chain (literal AND public-protected-id both authenticate NOWHERE → no session → no PTY) before any un-sever. Tron rotates AND the public 05e58f81 exposure is mooted by the secret root. Terminal stays SEVERED until then.
