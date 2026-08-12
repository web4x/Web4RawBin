# Owner-token emergency containment — ranked options (architect, 2026-08-12, DESIGN-ONLY, contingency)

CONTINGENCY (not a decision): IF the expert's measurement confirms the public `OWNER_TOKEN` (41ad88c4) currently grants owner access reaching the server-manager PTY, this is the ranked menu the PO hands Tron. Design-only, no build. Must not touch the 116-revocation path the expert is mid-flight on. Reversible + HONEST (no silent degradation — an off PTY must SAY so, never look broken).

## Measured gate map (decides everything)
- **server-manager page + `/api/server-manager/*` + terminal-ws** = `requireFeatureAccessHttp(req,res,'Server Manager')` (server.ts:1523; choke-point covers page+API+ws per :874) → **token ∈ 'Server Manager' Feature.allowedUsers[]** (DATA, R31.8, "NOT a hardcoded literal", fail-closed on empty). → **live-flippable, no deploy.**
- **root-of-trust routes** = `requireOwnerHttp → assertOwner` → the **`OWNER_TOKEN` literal** (ServerManagerGuard.ts:12, INV-G2 one location; requires token ∈ tokenToClient live-session AND === literal): **FeatureManager grant/revoke (server.ts:1641), QA verdict (:1697), pin (:1725)**. → **CODE-gated; a data-flip cannot touch it.**
- ★ Consequence: the public literal, once IDENTIFYed into tokenToClient, passes assertOwner on the **grant/revoke** route and can **re-add itself to any Feature.allowedUsers** → so removing it from allowedUsers is DEFEATABLE by the same public token. Only rotating the literal (code) closes the root-of-trust + the re-grant hole. Revocation can't help here — the owner token must stay live (Tron needs it), so it can't be added to the revoked list.

## ★★★ MEASUREMENT = YES — CONFIRMED LIVE PUBLIC RCE (expert, 2026-08-12)
Public literal `41ad88c4` (ServerManagerGuard.ts:12, tracked+pushed) → owner member of 'Server Manager' Feature (`16604eee` allowedUsers[0], committed line 18, AND `bootstrapSeed()` RE-SEEDS it EVERY boot @server.ts:3384) → ws-upgrade server.ts:3472→:3475 requireFeatureAccess→:3480 handleUpgrade→:3488 `PtyBridge.attachPane` = **interactive shell on the prod host = arbitrary command execution, reachable by anyone reading the public repo.** Outranks the 116 + path-unify. The path-unify does NOT fix it (owner excluded from the 116). Leaked-script scrub target: `scripts/test-data-purge.ts`.

## ★ RECOMMENDED INTERIM = D2 (supersedes option A) — authorize NOW
**D2 = unconditional `socket.destroy` on the terminal ws-upgrade BEFORE the feature gate (server.ts:3472).** Severs the PTY for ALL tokens (incl Tron until rotation) → closes the RCE/shell surface WITHOUT touching the owner token.
- **Fail direction:** fail-MORE-CLOSED — D2 can only DENY, NEVER grant. Worst case = "terminal down" (the intent), never "wrong person in". So the auth-gate review risk is trivial (it authorizes no one).
- **Restart:** YES (code) but justified by a live RCE. **Reversible:** revert the line + redeploy. **Tron loses:** the terminal feature only (keeps identity + all HTTP features). **Scope:** closes the RCE (shell); does NOT close owner-gated HTTP (tree / FeatureManager / Model-Driven) — those need (B).
- **HONEST render:** the severed terminal must SAY "terminal temporarily disabled (security)", never spin/look broken.
- ★ Why D2 over (A): `bootstrapSeed()` re-seeds the owner into allowedUsers every boot (@3384), so the (A) feature-flip is defeated by re-seed AND by the literal's re-grant. D2 severs the actual PTY path and cannot be re-granted around.

## Ranked options
### (A) Feature-unit flip — remove owner from 'Server Manager' Feature.allowedUsers[]  — FASTEST, PARTIAL
- **Restart:** NO (units read live at runtime). **Reversible in seconds:** YES (re-add the entry).
- **Tron loses:** the whole server-manager console (page + otmux tree + PTY); KEEPS FeatureManager / QA-verdict / pin.
- **Scope:** the 'Server Manager' feature only (page+API+ws). Not other owner features.
- **★ HONEST LIMIT (do NOT oversell):** does NOT neutralize the `OWNER_TOKEN` literal — the public token can IDENTIFY and use the hardcoded `assertOwner` **grant/revoke** route to re-add itself to allowedUsers. So (A) is an **instant, reversible SPEED-BUMP, not a wall** — it stops current/casual access and buys minutes, but a determined holder of the public literal restores it. 
- **Honest render:** the pure flip yields the standard 403 forbidden (explicit deny, not a broken page) — acceptable, but a "temporarily disabled by owner" message would need a small code touch; the bare 403 is honest (deny), not silent degradation.

### (B) Rotate the `OWNER_TOKEN` literal (ServerManagerGuard.ts:12) + new token OOB to Tron — COMPLETE, needs deploy
- **Restart:** YES (code change → build + restart). **Reversible in seconds:** NO (revert = another deploy).
- **Tron loses:** nothing functional (he gets the new token OOB); only a short deploy window.
- **Scope:** COMPLETE — kills the literal everywhere (server-manager membership-mint, FeatureManager grant/revoke, QA verdict, pin) AND the (A) re-grant hole. INV-G2 preserved (one location).
- The only option that actually WALLS the exposure. This is Tron's durable path (his "(iv)").

### (C) PTY-specific second factor / fresh OOB ticket on the ws upgrade — narrow, needs deploy
- **Restart:** YES (code on the ws upgrade). **Reversible:** deploy. **Tron loses:** nothing (one extra step to open a terminal). **Scope:** PTY-only (keeps tree/page). More work than (B), narrower blast-radius; doesn't address the literal's other root-of-trust routes.

### (D) Network / IP allowlist — topology-dependent, blunt
- **Restart:** maybe (server/proxy config). **Reversible:** config revert. **Tron loses:** access from any non-allowlisted network — ★ RISK: likely locks his own mobile/roaming. **Scope:** all-or-nothing by network, not per-feature. Last resort.

## Recommendation (if measurement = YES)
Tron's honest choice is NOT a single one-word wall that is also instant. The fastest reversible action is **(A)** — but present it truthfully as a **speed-bump that the literal can re-open**, good for buying minutes. The only **complete** close is **(B) rotate the literal**, which costs a deploy. So: **(A) now to blunt + (B) as the real fix**, or **(B) straight** if Tron will spend the deploy. Never hand him (A) as "contained." None of these touch the 116-revocation path (different unit / different literal).
