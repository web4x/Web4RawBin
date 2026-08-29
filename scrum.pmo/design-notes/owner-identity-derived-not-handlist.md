# Owner auth — DERIVED identity-equivalence, not a hand-list (architect, 2026-08-29, Tron locked out)

Tron gets `403 owner only` on his OWN Task 37.21 (ownerIor = his profile 05e58f81). ROOT: `ownerByToken` (server.ts:950) = `loadProtectedIdentities().ids.includes(puid)` — a CONFIGURED HAND-LIST of protected identity uuids. `puid = profileUuidOf(token)` (follows `redirectTo` → primary). He has MULTIPLE identities (alt-uuid / device-link / merged) — any that resolves to a primary NOT in `ids` → 403 on his own tasks. His words: "I am owner of all tasks no matter with which of my uuids." **This is the hand-list failure applied to IDENTITY — exists, wired, wrong surface (a maintained enumeration where a derived property belongs).**

## ★ SECURITY FRAME (this WIDENS auth — the derivation must be PROVABLY TIGHT)
A too-loose derivation is WORSE than the lockout. The rule: **an identity is the owner ONLY IF it resolves to the ONE owner profile (05e58f81) through edges the OWNER (or their proven-controlled key) AUTHORED.** A non-owner's identity graph must NEVER reach 05e58f81 — which holds IFF every counted edge is owner-authored (a non-owner cannot author such an edge to the owner's profile).

## DERIVED SHAPE (rule)
Replace `ids.includes(puid)` with **`resolvesToOwnerProfile(token)`**: does the token's identity resolve — through the AUTHENTICATED identity-equivalence graph — to the owner profile **05e58f81**? Anchor on the ONE canonical owner profile (not "any protected profile"). A new device/token the owner CONSOLIDATES works BY CONSTRUCTION; no config edit ever again.

## WHICH EDGES COUNT — the tight boundary (measured)
**COUNT (authenticated identity-equivalence):**
- **`redirectTo` consolidation tombstones** + the owner profile's **`consolidatedFrom`** set (server.ts:4213-4220): set by an OWNER-INITIATED MERGE (the owner absorbed this token into their profile; immutable tombstone). Authenticated by construction — a non-owner can't merge into the owner's profile. ✓
- **device-link via phone/email** (R21.4 `deviceLinkOnKnownKey`, PhoneIndex/EmailIndex.resolveToProfile) — COUNTS **ONLY IF verification-gated** (the person PROVED control of the phone/email, e.g. an OTP/challenge). ★ **MUST BE VERIFIED before counting** — if the device-link merely PRESENTS an unverified phone/email claim, it is FORGEABLE and MUST NOT grant OWNERSHIP.

**MUST NOT COUNT (association, not identity-equivalence — a too-loose edge is worse than the lockout):**
- a bare **same-phone / same-email ASSERTION** (an unverified claim of a number/address — shared/reused numbers link DIFFERENT people);
- **room membership**, shared-resource, friend-link, or ANY edge a non-owner can author.

## ★ THE PROVABLY-TIGHT CONDITION (expert confirms with his measurement)
The expert is measuring Tron's ACTUAL resolved uuid + his resolution graph. Two sub-cases:
1. **His 403'd identity resolves to 05e58f81 through an AUTHENTICATED edge** (a `redirectTo` merge tombstone / `consolidatedFrom`, or a verification-gated device-link) → the derived check counts it → he's the owner by construction. This is the fix: `resolvesToOwnerProfile` traverses those authenticated edges.
2. **His 403'd identity is UN-consolidated / reaches 05e58f81 only via an UNVERIFIED phone/email** → do NOT loosen the derivation to count an unverified edge. His real fix = an AUTHENTICATED consolidation (merge that identity into 05e58f81) OR make device-link verification-gated. **Never widen ownership onto a forgeable edge to close the lockout.**

## Gate (fail-closed, provably tight)
- Owner iff `resolvesToOwnerProfile(token) === 05e58f81` through authenticated edges ONLY; else 403 (fail-closed unchanged). Revoked token authenticates nowhere (existing).
- **STUB-MUST-FAIL / RED baseline:** (a) a token on an UNVERIFIED same-phone edge to 05e58f81 must STILL 403 (prove the loose edge is excluded — this is the security RED baseline, the case that must NOT pass); (b) an authenticated-merged alt-identity of the owner must PASS (the lockout case). Prove BOTH before ship.
- No hand-list: adding a new owner identity = the owner authoring a consolidation edge, never a config edit.

## Handoff
Expert reports Tron's resolved uuid + which edge type reaches 05e58f81; I confirm the edge is authenticated (sub-case 1) or rule the un-consolidated path (sub-case 2, no loose widening). Then build the derived check + the two stubs; tester verifies Tron accesses his own tasks @390 AND a same-phone non-owner is still 403. Security-widening: nothing ships until the loose-edge-excluded RED baseline passes.
