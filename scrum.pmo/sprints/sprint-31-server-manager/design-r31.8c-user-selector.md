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

## (3) PROFILE DETAIL renders in the SHARED drawer (PO add 2026-07-22) — one drawer, no profile-overlay fork
MEASURED: 11 drawer detail-views exist (requirement…test/file/webitem/terminal/feature) but NO profile one; `ProfileSheet.ts` renders a profile in a SEPARATE OVERLAY (`.user-sheet`, `this.overlay`) = a FORK. Per positioning≠function / DRY-drawer, the detailed profile must render in the SHARED `rb-detail-drawer`, NOT the overlay.
- **NEW `rb-profile-detail` drawer detail-view** + tagMap `profile: 'rb-profile-detail'` (rb-detail-drawer.ts:167+, exactly like `feature`→`rb-feature-manager-detail`, `otmuxpane`→`rb-terminal-detail`). ONE drawer for ALL detail views (trace units, terminal, feature, now profile).
- **Flow:** user-selector completion → pick a match → `selectionModel.select('profile:<token-or-uuid>')` → `selection-changed` → the SHARED drawer renders `rb-profile-detail` = the DETAILED profile (avatar, name, MASKED identifiers, granted features/memberships, and in the FeatureManager context a grant/revoke control). Consistent with the ServerManager/FeatureManager/trace-detail flow.
- **DRY the CONTENT too:** reuse `ProfileSheet`'s profile-render (avatar/name/vcard) where practical — extract the shared profile markup so `rb-profile-detail` (drawer) and any legacy sheet share it; the drawer POSITION is DRY (positioning≠function), the profile CONTENT is DRY (one render). RETIRE the `ProfileSheet` overlay for this flow (the drawer is the one detail surface) — note the overlay as the fork to consolidate (its own follow-on, don't big-bang).
- **Grant from the detail:** the profile detail-view's grant control (owner-only) → `applyGrant(featureUuid, token, 'grant')` (existing chained Method) → POST → access flips live (slice-b). So: type → pick → profile opens in the drawer → grant, all in the one drawer.
- **Security:** rb-profile-detail shows MASKED identifiers (no full PII); the profile-detail read = owner-gated (same as the search, `requireOwnerHttp`) for the FeatureManager admin context. No new overlay/fork.

## Chain / handoff (updated for the profile detail)
Add to R31.8c: CLIENT — NEW Class `RbProfileDetail` (custom element `rb-profile-detail`, drawer detail-view, mint fresh) + Method `mount()` (fetch the picked profile's detail + render, reuse ProfileSheet render where practical) — own node, reuses RbDetailDrawer via the `profile:` tagMap (NO new drawer/overlay). req mints it alongside `FeatureManager.searchUsers` + `RbFeatureManagerDetail.userComplete`. Net R31.8c new nodes: `FeatureManager.searchUsers` (backend) + `RbFeatureManagerDetail.userComplete` (client c2 completion) + `RbProfileDetail.mount` (client profile detail in the shared drawer); the GET handlers + tagMap wiring are thin (no node). tester also gates: pick a user → their detailed profile renders in the SHARED drawer (not a separate overlay) with masked identifiers; grant from there flips access.

## ★ REFRAME (Tron/PO 2026-07-22) — FeatureManager view = the SHARED item-TREE, not a bespoke list
Tron: REPLACE the bespoke FeatureManager card-list with the SHARED `rb-trace-tree`/itemView (the SAME one ServerManager's otmux tree uses). Model: **Features = top-level items; each granted user = a CHILD item under its feature** (`Feature.allowedUsers` → user child-items). This makes FeatureManager IDENTICAL in shape to ServerManager (shared tree + shared drawer) — everything DRY: items+tree+drawer+completion reused. NO bespoke list/cards, NO new tree. **This SUPERSEDES the card-list render** (retire the bespoke `rb-feature-manager-detail` list; the tree IS the list).

### The view (mirrors /server-manager exactly)
`/feature-manager` page hosts the SHARED `rb-trace-tree` + the SHARED `rb-detail-drawer` (same as `/server-manager` hosts the otmux tree + drawer). No bespoke components.
- **Tree data:** `GET /api/feature-manager` returns itemView `roots` (NOT a flat list): each Feature = a node `{ uuid, type:'feature', name, icon, hasChildren, children:[ { uuid:<userToken>, type:'profile', name:<userName> } … from allowedUsers ] }`. So `Feature.allowedUsers` → granted-user child-items. `FeatureManager.listFeatures` (already minted 5e338054) reshapes to this itemView roots form.
- **Details in the shared drawer** (tagMap entries, DRY — one drawer for all):
  - `feature` node select → **`rb-feature-detail`** (feature info + the c2 user-selector GRANT control). (feature→rb-feature-detail; note: this REPLACES the `feature`→`rb-feature-manager-detail` list mapping — the detail is now a feature-info+grant view, not a list.)
  - `profile` (user child) node select → **`rb-profile-detail`** (masked profile detail + a REVOKE control).
- **Grant = ADD a child item:** the c2 user-selector (in the feature detail) → `applyGrant(featureUuid, token, 'grant')` (kept) → POST → re-fetch the tree → the user appears as a child of that feature (access flips live, slice-b). **Revoke = REMOVE the child item:** the revoke control (on the user node / in rb-profile-detail) → `applyGrant(featureUuid, token, 'revoke')` → re-fetch → child gone.
- **User-search + c2 completion + profile-detail** (sections 1-3 above) are UNCHANGED — they feed the grant (c2 selector) + render the user detail; only the FeatureManager LIST becomes the shared tree.

### DRY summary (everything reused)
`rb-trace-tree` (the view) + `rb-detail-drawer` (feature-detail + profile-detail) + c2 completion (grant selector) + itemView data shape + `applyGrant`/`searchUsers`/`listFeatures` — all reused. FeatureManager ≡ ServerManager in shape.

### Chain reconciliation (req)
- **RETIRE** the bespoke card-list render: `RbFeatureManagerDetail.mount` (b7d6ca6a) as a LIST is superseded by `rb-trace-tree`; either retire the Class or repoint `mount` → the feature-detail (`rb-feature-detail`) render. **KEEP** `applyGrant` (ee4143df) + `userComplete` (c2). 
- **NEW/repoint:** `feature`→`rb-feature-detail` (feature info + grant c2 selector) — repoint the tagMap from `rb-feature-manager-detail`; `profile`→`rb-profile-detail` (`RbProfileDetail.mount`, from the PO add). `FeatureManager.listFeatures` (5e338054) reshapes to itemView roots (Feature + user children).
- Net: reuse rb-trace-tree (no new tree) + rb-detail-drawer; retire the bespoke list; the detail-views (rb-feature-detail + rb-profile-detail) + c2 selector + searchUsers are the R31.8c build. tester: /feature-manager renders the SHARED tree (Features→granted-users), select feature→detail+grant, select user→profile-detail+revoke, grant/revoke add/remove the child + flip access, all in the shared drawer/tree (no bespoke list/overlay).
