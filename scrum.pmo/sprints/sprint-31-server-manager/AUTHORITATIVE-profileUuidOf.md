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
