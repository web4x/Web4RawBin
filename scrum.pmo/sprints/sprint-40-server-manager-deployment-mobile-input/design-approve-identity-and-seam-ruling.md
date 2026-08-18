# Approve verdict — identity + seam ruling (architect, 2026-08-18, FIX-NOW, Tron order)

Backstop-only suspended for this; expert building. Bug: Tron's genuine T37.27 approve recorded `approvedBy: "sm_sessi"` → req read the real verdict as phantom + recommended reverting it. A verdict surface that cannot prove WHO ruled is worse than none. **Three ACs, tight, by-construction.** Backstop @390 (pixel not payload). req 0.4 mints; expert 0.1 builds.

## ROOT CAUSE (measured, file:line)
`server.ts:1553` (TaskQaVerdict.approveByOwner, impl 36b6ce2e): `m.approvedBy = ownerTok8; m.approvedAt = now; m.status = 'Done';`
- `ownerTok8` = an **8-char truncation of the "token"**. Via the cookie path `resolveOwner` returns the **placeholder** `{ ok:true, token:'sm_session' }` (server.ts:946) — NOT the owner's real token/identity. So `ownerTok8 = 'sm_session'.slice(0,8) = 'sm_sessi'`. It records the AUTH-PLACEHOLDER, truncated. Even via the direct-token path it would be `41ad88c4` (a truncation of the OWNER_TOKEN) — still not a verifiable identity.
- Two independent faults: (i) an ephemeral/placeholder value where a STABLE IDENTITY belongs; (ii) `m.status='Done'` assigned DIRECTLY beside an unchecked checklist Done-box = dual-status divergence at the approve moment.

## AC-1 — `approvedBy` is a STABLE, VERIFIABLE, UNFORGEABLE owner identity
- **Value:** the owner's STABLE protected-identity **uuid** — the R40.22 owner identity, reusing ServerManagerGuard's ONE `OWNER_TOKEN`/identity (INV-G2 == 1 location). FULL uuid, never a `.slice(0,8)`, never `resolveOwner`'s `'sm_session'` placeholder, never a session id.
- **Resolved SERVER-SIDE** from the authenticated owner (the sm_session cookie → the owner identity), by the endpoint — the client/session never supplies it.
- (a) STABLE across sessions/restarts ✓ (an identity constant in the root-only config, not a session). (b) VERIFIABLE without server access ✓ — any agent reads the R40.22 protected-identity set on disk and checks `approvedBy ∈ set` (so req can PROVE Tron ruled, never mis-flag it phantom).
- (c) CANNOT be synthesised — by construction, impossible-not-merely-detectable (L5): **bind the verdict with a server SIGNATURE** over `(identityUuid ‖ taskUuid ‖ status ‖ approvedAt)` using the existing server key (reuse UserKeys/UserCrypto — no new machinery); store `approvedBy = { id, sig }`. Any agent verifies `sig` with the on-disk server pubkey; a hand-written `approvedBy` has NO valid sig → provably phantom. (The owner-gated write of AC-2 + the R40.45 out-of-seam bypass gate make a forged edit REFUSED/DETECTABLE; the signature makes it IMPOSSIBLE — that is the by-construction bar. If Tron wants the minimal cut, ship the stable-identity-uuid + owner-gated-write now and add the sig as the hardening, but the sig is the honest answer to "cannot synthesise".)

## AC-2 — non-owner approve is REFUSED outright (fail-closed)
Done is a **Tron act** (R40.10). The approve endpoint MUST fail-closed for anyone but the owner (`ServerManagerGuard.isOwner`): a non-owner request → **403/refuse**, and it NEVER writes `approvedBy`/`approvedAt`/`status=Done` for whoever-is-authenticated. Recording a non-owner as approver is the exact class of "cannot prove who ruled." (Confirms the PO's belief: yes, refuse — never record-whoever.)

## AC-3 — approve routes through the SEAM; status DERIVED from checklist (derivation-not-hook, L1 / R-C5)
The approve writes the status ENUM directly (`m.status='Done'`) while the checklist Done-box stays unchecked → two sources diverge at the approve moment. RULE: the approve **checks the checklist's Done source, and status = `deriveStatus(checklist)`** (the R37.5 dual-status reconcile) — ONE write to the source, status FOLLOWS, never separately assigned. Route the whole approve through the mutation SEAM (`UnitController.apply`) so it emits → the item + detail views live-update. This is my derivation-not-hook applied to the approve path: no status-enum hook, derive it.

## (4) icon + (5) green-DONE — CONSEQUENCES, not separate defects (measured; refutes half the hypothesis)
The PO's decisive test ("after a manual Refresh, is it correct?") answered BY CONSTRUCTION from the render code:
- **The item-row status badge reads `model.status`** — `server.ts:2488` `obj.status = String(unit.model.status)` → `rb-trace-tree.ts:321` sets the row's `status` attr from `obj.status`. `rb-object-item.ts` `BADGE_MAP` maps **`'done' → {green, ✓}`** (line 219).
- The approve ALREADY wrote `m.status='Done'` (server.ts:1553). So **on a hard refresh the badge re-reads model.status='Done' → renders green ✓ — it would ALREADY be correct.** ⇒ **(5) green-DONE is PURE LIVENESS (my AC-3 emit), NOT a separate green defect.** ★ Refines the PO hypothesis: green follows from LIVENESS (3), not from the atomic-write (2) — because the render reads the ENUM (which the approve set), not the checklist. (AC-3's atomic derive still matters so status↔checklist can't DIVERGE, but the badge was already fed Done.)
- **The `.oi-icon` is `TRACE_ICONS[type]` (rb-object-item.ts:195) — keyed on TYPE only, no status dimension.** After a refresh it stays the Task icon regardless of status. So (4) "the icon did not change": the row's ONE status surface is the BADGE (which goes green✓ live once emitted); the type-icon is object IDENTITY and must NOT encode status — adding a Done state to it would be a SECOND status render surface = the exact DRY debt to avoid (one-renderer-one-truth). ⇒ **(4) is resolved by the status badge re-rendering green✓ live — the SAME liveness root as (5); NOT a separate icon-mapping bug.** (If Tron insists the leading glyph itself must flip, that is an explicit product change AND a second status source — flag it, don't default to it.)
- ⇒ **NOT five fixes. TWO roots:** (I) identity — AC-1 + AC-2; (II) seam — AC-3 (route approve through the seam → derive status from the checklist → EMIT → the badge re-renders green✓ live). Symptoms (3)(4)(5) all collapse into root (II).

## GATES (each stub-must-fail; report-only→strict)
1. `approvedBy` matching a session-id/placeholder/`.slice` shape, or NOT resolving to a protected-identity uuid → RED (catches the exact `sm_sessi` bug).
2. an `approvedBy` present whose `sig` fails verification against the server pubkey → RED (phantom/forged verdict).
3. a task with `status=='Done'` but its checklist Done-box unchecked → RED (dual-status divergence — the approve bypassed the derive).
4. the approve endpoint reachable by a non-owner without 403 → RED (fail-closed proof).

## BACKSTOP @390 (I verify on ship — pixel not payload)
Tron (owner session) approves → checklist box checks → status DERIVES to Done → emits → the item+detail views LIVE-UPDATE showing Done + `approvedBy = Tron's identity` (verifiable), NO reload. Non-owner → 403, nothing recorded. I verify the served build @390 real-WebKit, not the JSON.

## Notes / reuse (no ballooning)
Reuse: ServerManagerGuard identity (AC-1/AC-2), R40.22 protected-identity set (AC-1 verify), R37.5 deriveStatus (AC-3), UnitController seam + R40.45 emit (AC-3 live), UserKeys (AC-1 sig). Nothing new invented. Missing units for req: `qaVerdict.recordOwnerIdentity` (AC-1) + the AC-2/AC-3 as ACs on the existing TaskQaVerdict.approveByOwner req (R40.10 family) — keep it to the one verdict req, do not spawn a sprint.
