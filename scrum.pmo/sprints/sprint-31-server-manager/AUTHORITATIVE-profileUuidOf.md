# AUTHORITATIVE: profileUuidOf(token) — the token→profile-uuid resolution (robbin-architect 2026-07-23)

PO: "authoritative not guessed — this is the ONE thing that can miss again." Here it is, from CODE + req's data measurement. **Bottom line: the data has NO token→distinct-rich-uuid link; the resolver must follow EXISTING consolidation and MUST NOT guess <owner-literal>→<user-token> (that guess = the repeat-miss).**

## MEASURED FACTS (code + data, not assumed)
1. **A token's Profile unit has `model.uuid == token`** — BY CONSTRUCTION. `ensureProfileUnit`/`indexProfilePhone/Email/Address/Company` (server.ts:215,230,289,309) all mint `{ ior:'ior:class:Profile', model:{ uuid: token, … } }`. `ScenarioIndex.get(token)` returns that unit; its own uuid IS the token.
2. **Consolidation is the ONLY link mechanism** (server.ts:487-495, 2835-2857): linking accounts sets the secondary's `redirectTo = primaryToken` + `primary.consolidatedFrom.push(secondary)`. `redirectTombstoneToPrimary(token) = userProfiles.get(token)?.redirectTo || token` resolves a token to its PRIMARY token.
3. **req measured (the owner case):** token `<owner-literal>` → Profile "MD temp" (uuid==token, phone +4915253844085). Rich "Marcel Donges" `<user-token>` (phone +4981422917723). BOTH have NO redirectTo/consolidatedFrom/token/profileUuid; DIFFERENT phones. **They are UNLINKED. No field/link resolves <owner-literal>→<user-token>.**

## THE CONTRADICTION (why it kept missing)
Tron wants "the profile scenario unit's own uuid, NOT the token." But the profile scenario unit's own uuid IS the token (fact 1). And there is no *linked* distinct rich uuid to substitute (fact 3). So a resolver CANNOT authoritatively produce a distinct-from-token uuid today — any distinct value would be **invented** (a new field = another unrecognizable id, the sha256 mistake again) or **guessed** (<user-token>, unlinked). This is a DATA/PRODUCT decision, not a code resolution.

## AUTHORITATIVE ALGORITHM (deterministic, non-guessing — ship THIS)
`profileUuidOf(token)`:
1. `primary = userProfiles.get(token)?.redirectTo || token`  // follow EXISTING consolidation to the primary (the mechanism already used by rooms/IDENTIFY)
2. return `ScenarioIndex.get(primary)?.model.uuid ?? primary`  // the primary Profile unit's own uuid (== primary token by construction)

`tokenOfProfileUuid(uuid)` (reverse, for revoke): the Profile unit is keyed by token, and `model.uuid==token`, so `uuid` IS a token → verify `ScenarioIndex.get(uuid)?.ior==='ior:class:Profile'`; the grant key in `Feature.allowedUsers[]` is that token. (If step-B below introduces distinct uuids, reverse via the token→uuid index.)

**This yields the RICH profile uuid IFF the token is consolidated into it.** For the owner (<owner-literal> NOT consolidated with <user-token>), it correctly yields <owner-literal> — because those two profiles are genuinely unlinked in the data. It never guesses.

## THE DECISION FOR TRON/PO (I recommend, you rule — do NOT ship a guess)
The owner seeing `<owner-literal>` (== his token) as "the uuid" is what Tron rejects. Two honest ways to give him `<user-token>`:
- **★ RECOMMENDED — (B) CONSOLIDATE the data (not the resolver):** the owner's temp token `<owner-literal>` must be CONSOLIDATED into the rich "Marcel Donges" `<user-token>` profile (set redirectTo/consolidatedFrom, the existing link). Then `profileUuidOf(<owner-literal>)` follows redirectTo → `<user-token>` — REAL, correct-by-construction, no code guess. The MISSING consolidation is a DATA issue (his temp profile was never linked to his rich one), fixed once by a consolidation action. This makes the resolver above deliver exactly what Tron wants.
- (A) DATA-MODEL CHANGE: give every Profile unit a distinct v4 uuid + a `token` field (re-key or add a token→uuid index) so `profile.uuid != token` universally. Deterministic BUT high-risk (the whole profile/room/consolidation system keys by token==uuid) + a random v4 is still an id Tron hasn't seen (same recognizability gap). Not recommended for round-3.

**So: ship the consolidation-following resolver (authoritative, no guess); to show the OWNER his rich `<user-token>`, CONSOLIDATE <owner-literal>→<user-token> in the data (Tron/PO one-time action or a link-accounts flow). Do NOT hardcode/guess the link in code.**

## HANDOFF
Expert: build `profileUuidOf`/`tokenOfProfileUuid` per the algorithm above (follow redirectTo→primary→Profile-unit uuid; never a hash, never a hardcoded <user-token>). req: pin this verbatim into AC-item-description-full-uuid + AC-token-profileuuid-resolver (resolver = consolidation-following; the distinct-rich-uuid appears ONLY when consolidation exists). PO/Tron: rule on option B (consolidate the owner's profiles so his rich uuid shows) — the resolver is correct either way; without consolidation it honestly shows the token-keyed uuid.

## ★★ CONSOLIDATE RULING — MEASURED REALITY INVERTS THE PREMISE (robbin-architect 2026-07-23, do NOT execute blindly)
Tron authorized CONSOLIDATE (448f6837f) believing <owner-literal>=temp, <user-token>=rich, UNLINKED. **MEASURED data/profiles.json (the runtime Map where redirectTo/consolidatedFrom LIVE — NOT the scenario units req read): they are ALREADY consolidated, and the direction is the OPPOSITE.**
- CHAIN: `<user-token> —redirectTo→ 8f74dfba —redirectTo→ <owner-literal>` (PRIMARY, redirectTo=None). `8f74dfba.consolidatedFrom=[3effa1fc,2703628c,<user-token>]`; `<owner-literal>.consolidatedFrom=[8f74dfba]`.
- **`<owner-literal>` = the PRIMARY** consolidated identity (phone +4981422917723 via 8f74dfba, secretCode) **AND** the hardcoded `OWNER_TOKEN` (ServerManagerGuard.ts:12).
- **`<user-token>` = a DEEP SECONDARY tombstone** (redirects up to <owner-literal>; phone EMPTY; LESS data — it is NOT "the rich profile").
- So my resolver `profileUuidOf(<owner-literal>)` ALREADY correctly returns **<owner-literal>** = his real primary consolidated uuid. No mutation needed for correctness.

### WHY "make <user-token> the shown uuid" is UNSAFE (would lock Tron out)
To make profileUuidOf(<owner-literal>) return <user-token>, <user-token> must become the PRIMARY — i.e. INVERT the whole cluster (<owner-literal>/8f74dfba redirect to <user-token>). Then:
1. **Owner gate breaks:** `OWNER_TOKEN` is the hardcoded literal `<owner-literal>`. If <owner-literal> becomes a tombstone → Tron's session redirects (IDENTIFY→TOKEN_REDIRECT, server.ts:2731) to <user-token> → he sends x-player-token=<user-token> → `assertOwner(<user-token> != <owner-literal>)` → **403, loses admin/root-of-trust**. INV-G2 literal would have to move too.
2. Redirects his LIVE session; inverts an EXISTING correct consolidation; and <user-token> is the LESS-rich record (no phone).

### RULING (evidence) — FLAG TO TRON, do NOT execute
This is (C) identity-model, Tron-facing. The consolidation Tron pictured ALREADY EXISTS with the OPPOSITE primary. The subtitle correctly shows **<owner-literal>** = his REAL primary consolidated profile uuid — which coincides with his token BECAUSE his primary profile unit's uuid==token (unavoidable while <owner-literal> is his primary + gate). Options for Tron:
- **(i) RECOMMENDED — accept <owner-literal>** as the shown uuid: it IS his real primary consolidated identity (not "just a token"). Zero risk, zero mutation, resolver already correct.
- **(ii) RE-HOME his identity to <user-token>** as primary: a COORDINATED migration (re-point the cluster + move the OWNER_TOKEN literal <owner-literal>→<user-token> + re-key the gate + his device re-IDENTIFYs) — high-risk, touches the security gate, and <user-token> is the thinner record. NOT a safe one-time link; needs a planned migration if Tron truly wants it.
- I did NOT execute any redirectTo mutation — a naive consolidate breaks his owner access (the exact "make it safe" the PO required). Flagging PO→Tron for the (i)/(ii) call.
