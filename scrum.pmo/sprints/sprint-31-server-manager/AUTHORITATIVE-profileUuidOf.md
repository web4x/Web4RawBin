# AUTHORITATIVE: profileUuidOf(token) — the token→profile-uuid resolution (robbin-architect 2026-07-23)

PO: "authoritative not guessed — this is the ONE thing that can miss again." Here it is, from CODE + req's data measurement. **Bottom line: the data has NO token→distinct-rich-uuid link; the resolver must follow EXISTING consolidation and MUST NOT guess 41ad88c4→37fcb752 (that guess = the repeat-miss).**

## MEASURED FACTS (code + data, not assumed)
1. **A token's Profile unit has `model.uuid == token`** — BY CONSTRUCTION. `ensureProfileUnit`/`indexProfilePhone/Email/Address/Company` (server.ts:215,230,289,309) all mint `{ ior:'ior:class:Profile', model:{ uuid: token, … } }`. `ScenarioIndex.get(token)` returns that unit; its own uuid IS the token.
2. **Consolidation is the ONLY link mechanism** (server.ts:487-495, 2835-2857): linking accounts sets the secondary's `redirectTo = primaryToken` + `primary.consolidatedFrom.push(secondary)`. `redirectTombstoneToPrimary(token) = userProfiles.get(token)?.redirectTo || token` resolves a token to its PRIMARY token.
3. **req measured (the owner case):** token `41ad88c4` → Profile "MD temp" (uuid==token, phone +4915253844085). Rich "Marcel Donges" `37fcb752` (phone +4981422917723). BOTH have NO redirectTo/consolidatedFrom/token/profileUuid; DIFFERENT phones. **They are UNLINKED. No field/link resolves 41ad88c4→37fcb752.**

## THE CONTRADICTION (why it kept missing)
Tron wants "the profile scenario unit's own uuid, NOT the token." But the profile scenario unit's own uuid IS the token (fact 1). And there is no *linked* distinct rich uuid to substitute (fact 3). So a resolver CANNOT authoritatively produce a distinct-from-token uuid today — any distinct value would be **invented** (a new field = another unrecognizable id, the sha256 mistake again) or **guessed** (37fcb752, unlinked). This is a DATA/PRODUCT decision, not a code resolution.

## AUTHORITATIVE ALGORITHM (deterministic, non-guessing — ship THIS)
`profileUuidOf(token)`:
1. `primary = userProfiles.get(token)?.redirectTo || token`  // follow EXISTING consolidation to the primary (the mechanism already used by rooms/IDENTIFY)
2. return `ScenarioIndex.get(primary)?.model.uuid ?? primary`  // the primary Profile unit's own uuid (== primary token by construction)

`tokenOfProfileUuid(uuid)` (reverse, for revoke): the Profile unit is keyed by token, and `model.uuid==token`, so `uuid` IS a token → verify `ScenarioIndex.get(uuid)?.ior==='ior:class:Profile'`; the grant key in `Feature.allowedUsers[]` is that token. (If step-B below introduces distinct uuids, reverse via the token→uuid index.)

**This yields the RICH profile uuid IFF the token is consolidated into it.** For the owner (41ad88c4 NOT consolidated with 37fcb752), it correctly yields 41ad88c4 — because those two profiles are genuinely unlinked in the data. It never guesses.

## THE DECISION FOR TRON/PO (I recommend, you rule — do NOT ship a guess)
The owner seeing `41ad88c4` (== his token) as "the uuid" is what Tron rejects. Two honest ways to give him `37fcb752`:
- **★ RECOMMENDED — (B) CONSOLIDATE the data (not the resolver):** the owner's temp token `41ad88c4` must be CONSOLIDATED into the rich "Marcel Donges" `37fcb752` profile (set redirectTo/consolidatedFrom, the existing link). Then `profileUuidOf(41ad88c4)` follows redirectTo → `37fcb752` — REAL, correct-by-construction, no code guess. The MISSING consolidation is a DATA issue (his temp profile was never linked to his rich one), fixed once by a consolidation action. This makes the resolver above deliver exactly what Tron wants.
- (A) DATA-MODEL CHANGE: give every Profile unit a distinct v4 uuid + a `token` field (re-key or add a token→uuid index) so `profile.uuid != token` universally. Deterministic BUT high-risk (the whole profile/room/consolidation system keys by token==uuid) + a random v4 is still an id Tron hasn't seen (same recognizability gap). Not recommended for round-3.

**So: ship the consolidation-following resolver (authoritative, no guess); to show the OWNER his rich `37fcb752`, CONSOLIDATE 41ad88c4→37fcb752 in the data (Tron/PO one-time action or a link-accounts flow). Do NOT hardcode/guess the link in code.**

## HANDOFF
Expert: build `profileUuidOf`/`tokenOfProfileUuid` per the algorithm above (follow redirectTo→primary→Profile-unit uuid; never a hash, never a hardcoded 37fcb752). req: pin this verbatim into AC-item-description-full-uuid + AC-token-profileuuid-resolver (resolver = consolidation-following; the distinct-rich-uuid appears ONLY when consolidation exists). PO/Tron: rule on option B (consolidate the owner's profiles so his rich uuid shows) — the resolver is correct either way; without consolidation it honestly shows the token-keyed uuid.

## ★★ CONSOLIDATE RULING — MEASURED REALITY INVERTS THE PREMISE (robbin-architect 2026-07-23, do NOT execute blindly)
Tron authorized CONSOLIDATE (448f6837f) believing 41ad88c4=temp, 37fcb752=rich, UNLINKED. **MEASURED data/profiles.json (the runtime Map where redirectTo/consolidatedFrom LIVE — NOT the scenario units req read): they are ALREADY consolidated, and the direction is the OPPOSITE.**
- CHAIN: `37fcb752 —redirectTo→ 8f74dfba —redirectTo→ 41ad88c4` (PRIMARY, redirectTo=None). `8f74dfba.consolidatedFrom=[3effa1fc,2703628c,37fcb752]`; `41ad88c4.consolidatedFrom=[8f74dfba]`.
- **`41ad88c4` = the PRIMARY** consolidated identity (phone +4981422917723 via 8f74dfba, secretCode) **AND** the hardcoded `OWNER_TOKEN` (ServerManagerGuard.ts:12).
- **`37fcb752` = a DEEP SECONDARY tombstone** (redirects up to 41ad88c4; phone EMPTY; LESS data — it is NOT "the rich profile").
- So my resolver `profileUuidOf(41ad88c4)` ALREADY correctly returns **41ad88c4** = his real primary consolidated uuid. No mutation needed for correctness.

### WHY "make 37fcb752 the shown uuid" is UNSAFE (would lock Tron out)
To make profileUuidOf(41ad88c4) return 37fcb752, 37fcb752 must become the PRIMARY — i.e. INVERT the whole cluster (41ad88c4/8f74dfba redirect to 37fcb752). Then:
1. **Owner gate breaks:** `OWNER_TOKEN` is the hardcoded literal `41ad88c4`. If 41ad88c4 becomes a tombstone → Tron's session redirects (IDENTIFY→TOKEN_REDIRECT, server.ts:2731) to 37fcb752 → he sends x-player-token=37fcb752 → `assertOwner(37fcb752 != 41ad88c4)` → **403, loses admin/root-of-trust**. INV-G2 literal would have to move too.
2. Redirects his LIVE session; inverts an EXISTING correct consolidation; and 37fcb752 is the LESS-rich record (no phone).

### RULING (evidence) — FLAG TO TRON, do NOT execute
This is (C) identity-model, Tron-facing. The consolidation Tron pictured ALREADY EXISTS with the OPPOSITE primary. The subtitle correctly shows **41ad88c4** = his REAL primary consolidated profile uuid — which coincides with his token BECAUSE his primary profile unit's uuid==token (unavoidable while 41ad88c4 is his primary + gate). Options for Tron:
- **(i) RECOMMENDED — accept 41ad88c4** as the shown uuid: it IS his real primary consolidated identity (not "just a token"). Zero risk, zero mutation, resolver already correct.
- **(ii) RE-HOME his identity to 37fcb752** as primary: a COORDINATED migration (re-point the cluster + move the OWNER_TOKEN literal 41ad88c4→37fcb752 + re-key the gate + his device re-IDENTIFYs) — high-risk, touches the security gate, and 37fcb752 is the thinner record. NOT a safe one-time link; needs a planned migration if Tron truly wants it.
- I did NOT execute any redirectTo mutation — a naive consolidate breaks his owner access (the exact "make it safe" the PO required). Flagging PO→Tron for the (i)/(ii) call.
