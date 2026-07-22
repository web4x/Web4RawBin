# R31.8c DESIGN — FeatureManager grant user-selector + c2 completion (robbin-architect 2026-07-22, Tron IMG_4614)
Tron: the FeatureManager grant needs a USER-SELECTOR — type name/email/phone/uuid → completion dropdown of matching profiles → select → grant. Model on OOSH c2 completion. Reuse existing profile + phone/email alternate-UUID (device-link) data.

## MEASURED — the identity data to reuse
- **UserProfile** (server.ts:129, `userProfiles: Map<token,UserProfile>`, persisted PROFILES_PATH): `token` (THE grantable identity — what goes in Feature.allowedUsers), `name`, `phone`, `avatar`, `consolidatedFrom[]` (merged tokens), `features[]` (R31.8 grants).
- **Alternate-identity graph** (`scenario/alt/{phone,email,company}/`): `ior:class:Profile` units `{uuid, name, phones:[ior…], emails:[…], companies, unitLinks:[alt/phone/+<num>.scenario.json…]}` — the device-link contact data keyed by phone number / email. A user is reachable by name / email / phone / uuid, all resolving toward a UserProfile.token (via the phone/email match + `consolidatedFrom`/device-link consolidation).

## (1) BACKEND — owner-gated user-SEARCH endpoint
`GET /api/feature-manager/users?q=<query>` — **HARDCODED-owner** (`requireOwnerHttp`, INV-F4): searching ALL users' PII feeds the owner-only grant, so it is owner-only (a FeatureManager member who is NOT owner cannot search/grant — their search + POST 403). Same root-of-trust as the write.
- **Match `q` across** (case-insensitive, reuse existing data — NO new store): userProfiles by `name` (substring) / `phone` / `token` (prefix); alt-identity Profile units by `name` / phone-number (`alt/phone/+<q>`) / email (`alt/email/<q>`) / `uuid`. Resolve each hit → the grantable `token` (UserProfile.token directly, or the alt-identity → token via the existing device-link/`consolidatedFrom` resolution — reuse, don't reinvent).
- **Returns** `{ ok, users: [{ token, name, avatar?, uuid?, identifiers: ["+49•••6789", "a•••@•••.de"] }] }` — enough to IDENTIFY (name + MASKED phone/email; never full PII in the dropdown) + the token for the grant. Owner-only.
- **Ranking (c2-style):** exact match → prefix → substring; cap results (e.g. 10) + note if truncated (no silent cap). Empty q → recent/granted users or empty.
- **Grant-ahead (follow-on, note):** a contact with an alt-identity but no token yet (invited, not joined) = the LINK-CODE case — return it flagged `pending` so the owner can grant-ahead by a link-code that binds on join. Not slice-1; slice-1 grants existing tokens.

## (2) CLIENT — c2-completion user-selector in the grant control (rb-feature-manager-detail)
Per-feature grant control = a text input + a completion dropdown (the OOSH c2 pattern, in the drawer view — NO new overlay):
- Type → **debounced** `GET /api/feature-manager/users?q=` → render a dropdown of matches (avatar + name + masked identifier), ranked.
- **c2 UX:** type-ahead, keyboard nav (↑/↓/Enter to select, Esc to close), click-to-select, highlight the match substring — mirror OOSH c2 completion (ranked candidates, select-to-complete).
- **Select** a match → resolves to its `token` → call `applyGrant(featureUuid, token, 'grant')` (the ALREADY-chained Method) → POST /api/feature-manager (owner-gated) → re-render (the user appears in allowedUsers, access flips live — slice-b proven).
- The selector is a control WITHIN `rb-feature-manager-detail` (the drawer detail-view) — reuses the shared drawer, no fork.

## SECURITY
- Search = `requireOwnerHttp` (owner-only PII access) — same as the grant write (INV-F4 root-of-trust); a non-owner FeatureManager member cannot search/grant. INV-G2 literal ==1, no new literal.
- **MASKED identifiers** in the response (partial phone/email) — the dropdown identifies without leaking full PII. Full token/uuid used only server-side for the grant.
- No overlay/fork — the selector lives in the existing rb-feature-manager-detail drawer view.

## Chain / handoff
Design-only (architect). req formalizes R31.8c + mints: BACKEND — NEW Method `FeatureManager.searchUsers(q)` (returns ranked masked matches; own node on Class FeatureManager 9f7f345a, sibling to listFeatures/grant/revoke) + thin owner-gated `GET /api/feature-manager/users` handler (no node, serverManagerPage precedent). CLIENT — NEW Method `RbFeatureManagerDetail.userComplete(query)` (the c2 completion: debounced fetch + render dropdown + keyboard nav; own node on Class RbFeatureManagerDetail a085d2d1) that on-select calls the existing `applyGrant`. expert (after its rewind): build the search endpoint (reuse profile+alt-identity resolution, masked output) + the c2 selector UI (feeds applyGrant). tester: owner types a name/email/phone/uuid → dropdown lists matching profiles (masked) → select → grant → user appears + access flips 403→200 (slice-b live); search is owner-only (non-owner/member 403); no full-PII leak (masked); INV-F4/INV-G unregressed. I backstop (owner-only search, masked PII, applyGrant reuse, no-overlay) + real restart on ship.
