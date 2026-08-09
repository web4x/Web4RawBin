# R31.8c FM-detail REFINE — design (robbin-architect 2026-07-22, Tron IMG_4616 device-feedback)
FM works on device; 3 UI refinements (scenario-first, SHARED rb-detail-drawer, positioning!=function, NO fork). ★ SECURITY (architect owns): the URL-addressable ref STAYS OPAQUE (FIX-2 `<featureUuid>:<sha256[:16]>`, NO raw token); resolve display+nav to the user SERVER-SIDE, owner-gated. MEASURED current impl first, then design.

## MEASURED — current state (IMG_4616)
- Children: `FeatureManager.allowedUsersChildren` (FeatureManager.ts:161) emits `{uuid:'<feature>:<userId>', type:'profile', name}` → renders a GENERIC row (icon + name + name-subtitle repeated). Tron: "generic uuid rows, subtitle repeats the name."
- Detail: `RbProfileDetail.mount` (rb-profile-detail.ts:20) resolves ONLY the NAME (`resolveGranted` → /api/trace/children name field) → renders avatar-placeholder + name + opaqueId-slice + Revoke button BELOW the identity. Tron: wants the user's FULL profile + Revoke at the top.
- Reusable: `maskIdentifier(kind,v)` (:126) + `maskToken` (:120) already mask PII; `searchUsers` (:73) produces masked UserHit (name/avatar/masked-identifiers) carrying the token INTERNALLY. UserProfile fields: name, phone, url, avatar, avatarCrop, secretCode(SENSITIVE-never-expose)…

## DESIGN — 3 refinements

### (1) Children = itemViews of the REAL user (not opaque-uuid rows) — opaque ref preserved
The child stays keyed by the opaque composite ref `<feature>:<sha256[:16]>` (FIX-2), but the itemView renders the REAL user: **enrich `allowedUsersChildren`** to emit, per child, the SERVER-RESOLVED `{name, avatar, subtitle}` where subtitle = a MASKED identifier (maskIdentifier phone/url — NOT the name repeated). So the row shows avatar + name + masked-identifier = a user itemView, not a generic uuid row. Tap still routes via the composite ref → RbProfileDetail (nav to the user, opaque). Impl-edit on allowedUsersChildren (no new node); the child's `name`+`avatar`+`subtitle` come from `userProfiles.get(token)` resolved server-side; token NEVER leaves the server.

### (2) Detail = the user's FULL masked profile (RbProfileDetail), not name+opaqueId
**NEW server Method `FeatureManager.grantedUserProfile(featureUuid, userId, profiles)`** (owner-gated resolver): match `userId` (sha256[:16]) against the feature's allowedUsers token-hashes (like `revokeFeature` token-OR-hash) → `userProfiles.get(token)` → return a **MASKED FULL PROFILE** `{name, avatar, identifiers:[maskIdentifier(phone), maskIdentifier(url)…], grantedFeatureCount?, deviceCount?}` — NO token, NO secretCode, NO raw PII. **Thin endpoint** `GET /api/feature-manager/granted-user?feature=<f>&id=<userId>` (no node; `requireFeatureAccess('Feature Manager')` gate). **Impl-edit `RbProfileDetail.mount`**: fetch this masked full profile (replacing the name-only resolveGranted) → render avatar + name + the masked identifier list + profile fields. Client never receives the token.

### (3) Drawer layout: actions under the grab-bar, content below
**Impl-edit `RbProfileDetail.mount`** render ORDER: `[grab-bar (shared RbDetailDrawer chrome — untouched)] → [actions: Revoke] → [content: full masked profile]`. Revoke moves to the TOP of the detail body (right under the grab-bar); the profile renders below. The drawer's grab-bar/scroll/expand-minimize stay SHARED + untouched (positioning!=function); RbProfileDetail only reorders its OWN panel content. NO fork.

## SECURITY invariants (INV-F, preserved)
- INV-FIX2 (opaque ref): the tree child ref AND the RbProfileDetail `uuid` stay `<feature>:<sha256[:16]>` — no raw token on any URL-addressable ref. UNCHANGED.
- INV-F7 (server-side resolve, no token to client): `allowedUsersChildren` + `grantedUserProfile` resolve userId→token→profile SERVER-SIDE; the response carries ONLY masked display data (name/avatar/masked-identifiers) — NEVER the raw token or secretCode.
- INV-F-gate: `/api/feature-manager/granted-user` owner/member-gated `requireFeatureAccess('Feature Manager')` (viewing granted-user PII = FeatureManager access); non-member → 403. Revoke stays hardcoded-owner (INV-F4). INV-G2 literal==1 unchanged.
- Masked PII: reuse maskIdentifier/maskToken; no un-masked email/phone/url; no secretCode.

## TOPOLOGY (hand req)
- NET-NEW node: **`FeatureManager.grantedUserProfile`** — UC featureManager.viewGrantedUser (or ride the R31.8c FeatureManager UC) → Class FeatureManager 9f7f345a → Method grantedUserProfile (owner-gated masked-full-profile resolver by opaque id). Method topology on req request.
- IMPL-EDITS (no node): `allowedUsersChildren` (ad622052) enrich child {avatar, masked subtitle}; `RbProfileDetail.mount` (e809f03a) full-profile via grantedUserProfile + actions-under-grab-bar layout. Expert points [impl] on the edited decls; req reconciles.
- THIN (no node): GET /api/feature-manager/granted-user handler (owner-gated), precedent = the existing /api/feature-manager routes.

## ROUTE
req capture-gate the 3 ACs (children-itemview-real-user opaque-preserved / detail-full-masked-profile / actions-under-bar layout) + INV-F7 + mint grantedUserProfile Method → expert builds (server resolver + endpoint + allowedUsersChildren enrich + RbProfileDetail full-profile+layout) → tester gates @390 (child rows show real user avatar+masked-id not name-repeat; tap→full masked profile; Revoke under grab-bar; opaque ref, non-owner 403, no token in any response) → Tron device re-verify. I backstop INV-F7 (no token/secretCode in any response, opaque ref preserved) + client-only (rb-trace-tree/rb-profile-detail bundles + server resolver=server change→real restart) on ship.

## ★ INV-F7 BACKSTOP v0.7.120 = FAIL — avatar field leaks the raw token (architect catch 2026-07-22)
Real restart (fresh pid 1750512, uptime reset, INV-V1/V3 passed, non-owner 403, INV-G/trace unregressed). BUT owner GET `/api/feature-manager/granted-user` payload = `{"name":"arch","avatar":"/api/avatar/<owner-literal>-…","identifiers":["+49••••085"]}` — the **`avatar` carries the RAW TOKEN** (`/api/avatar/<token>`). An owner viewing a granted user gets THAT user's auth token via the avatar URL → INV-F7 violation (raw token in a response body; e.g. viewing <grant-member> leaks its token). Owner-gated (non-member 403) so NOT a public P0, but a real defense-in-depth violation. **My design GAP:** I specified "avatar" without pinning it opaque — owning it.
**FIX (opaque avatar, folds into the FM-detail build):** NEW owner-gated route `GET /api/feature-manager/granted-user/avatar?feature=<f>&id=<userId>` (requireFeatureAccess('Feature Manager') → resolve userId→token SERVER-SIDE → serve/redirect the avatar). `grantedUserProfile` + `allowedUsersChildren` return `avatar: '/api/feature-manager/granted-user/avatar?feature=<f>&id=<userId>'` (OPAQUE), NEVER `p.avatar` (=/api/avatar/<token>). Then NO token on any URL-addressable ref OR response body. INV-F7 amended: **the avatar URL is also opaque (feature+userId-keyed), the token resolves server-side.** Expert folds into the FM-detail refinement build (refinements 1+2 both emit avatar → both use the opaque ref); v0.7.120 stays live as owner-gated interim; I re-backstop (owner GET → avatar is opaque, no token anywhere in the payload).

## INV-F7 RE-BACKSTOP v0.7.121 = PASS (opaque-avatar fix 152d23205)
Real restart fresh pid 1778306. Owner granted-user avatar=opaque ref (feature-uuid[public]+sha256-userId, NO raw token); avatar route 200 image/jpeg serves bytes Location=(none) no-redirect-leak; non-owner both routes 403; INV-G/trace ok. v0.7.120 avatar-token leak CLOSED. GATE: requireOwnerHttp owner-only ACCEPTED (stricter/safe); non-blocking flag tree(requireFeatureAccess) vs detail(requireOwnerHttp) align when FM delegation real.
