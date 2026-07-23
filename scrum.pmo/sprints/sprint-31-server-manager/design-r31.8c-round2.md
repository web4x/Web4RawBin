# R31.8c ROUND-2 DESIGN — DRY reuses for the FM detail (robbin-architect 2026-07-23)

Tron device round-2 (5 items, ALL DRY no-fork). MEASURED the round-1 surfaces (Explore map) FIRST. Route: req mints/reconciles scenario-first off THIS topology (rewind-safe on disk) → expert builds → tester gates the RENDERED surface @390 (not "flow works") → Tron device.

## MEASURED ground truth (why round-1 missed)
- **NO existing reusable CLIENT full-profile component.** The canonical full viewer is the SERVER-inline /profile page (server.ts:2254-2314: avatar, name, token, secretCode, devices[], bugReports[], featureGrants — WS PROFILE-driven). `ProfileSheet.open(profile)` is a lighter OVERLAY (avatar+name+link), which round-1 rightly avoided. So round-1 hand-built a name+phone STUB in `rb-profile-detail` = the miss (AC-2). True DRY ⇒ EXTRACT the profile render into ONE shared component both call.
- `FeatureManager.featureRoots()` (FeatureManager.ts:136-148) emits `hasChildren:au.length>0` but **NO `childCount`** → collapsed badge = 0 (item c). The Sprint root DOES emit `childCount:tasks.length` (server.ts:1483) → shared tree shows its collapsed count. So the fix is ONE field, using the SHARED mechanic.
- `allowedUsersChildren` (FeatureManager.ts:156-162) child `description` = masked phone (item a wants full uuid). Child ref = `profile:<featureUuid>:<opaque userId sha256[:16]>` (FIX-2, no raw token).
- `grantedUserProfile` (FeatureManager.ts:210-224) returns only name/avatar(opaque)/identifiers(masked)/counts — NOT the full masked profile (no devices/bugReports detail).
- Grant (`rb-feature-detail.applyGrant` :143) + Revoke (`rb-profile-detail.revoke` :73) POST then only flash — **NO tree refresh** (item b). Tree refresh = `feature-manager.ts load()` (:22-35, refetch /api/feature-manager → `tree.items`), currently only the Refresh button (:45).
- Shared tree count mechanic (rb-trace-tree.ts): a collapsed node's badge = `node.dataset.childRefCount` = inline children.length **OR** the server-provided `serverChildCount` (buildSeedNode :363) → `computeBadges`. No nodeChildCount map (retired). This is the SHARED mechanic item c must reuse.

## Topology (req: 1 NEW node + 5 impl-edits; opaque FIX-2 + INV-F7 preserved throughout)

### (2)+(3) Full profile viewer inline + Revoke under grab-bar — the ONE new node
| # | Node/edit | What |
|---|-----------|------|
| **NEW NODE** | **Class `RbProfileView` + Method `render`** (`src/public/ts/trace/rb-profile-view.ts`, `<rb-profile-view>`) | the CANONICAL data-driven full-profile render (avatar, name, identifiers, devices summary, bug-report summary, feature grants) — MASKING-AWARE: renders only the fields present in its data, so a masked feed omits token/secret BY CONSTRUCTION (INV-F7). This is THE viewer, reused; NOT a drawer-only fork. |
| impl-edit | `FeatureManager.grantedUserProfile` (FeatureManager.ts:210) | ENRICH the returned masked profile to the full field-set `RbProfileView` needs (masked identifiers, device summaries, bugReport count/summaries) — still NO token/secretCode/raw-avatar (opaque only). |
| impl-edit | `RbProfileDetail.mount` (rb-profile-detail.ts:20, Impl 3f61d7d8) | REPLACE the stub. Layout = `[grab-bar] → [Revoke button] → [<rb-profile-view> fed the enriched masked profile]`. Revoke FIRST (directly under the bar), viewer BELOW (item 3). Retire the hand-built head/stub. |
| **RECOMMEND (DRY-completion, flag PO/Tron)** | /profile page (server.ts:2254) | to make `RbProfileView` genuinely "the existing viewer reused" (not a 2nd render), migrate the /profile body to render via `<rb-profile-view>` too (own-profile = full data incl token/secret). Can be a fast-follow if round-2 scope is tight, but it's the true single-viewer end-state — owned, not forgotten. |

### (a) tree child description = full uuid — impl-edit
`FeatureManager.allowedUsersChildren` (FeatureManager.ts:162): set child `description` = the FULL opaque userId (the FIX-2 stable, non-token, non-reversible id already in the ref), shown in full — NOT the masked phone, NOT the raw token (INV-F7). NOTE for req: "full uuid" here = the opaque stable userId; if a distinct persisted profile UUID exists and Tron means THAT, use it — but never the raw token. Flag for Tron confirm.

### (b) tree auto-updates on grant/revoke (Refresh already rebuilds) — impl-edit
On grant/revoke SUCCESS, dispatch a `document` CustomEvent `fm-tree-refresh`; `feature-manager.ts` adds ONE listener → `load()` (refetch roots → `tree.items` → shared renderItems diff; re-fetches an expanded feature's children so a revoked user disappears / a grant appears). Edits: `rb-feature-detail.applyGrant` (:143) + `rb-profile-detail.revoke` (:73) dispatch on ok; `feature-manager.ts` (:45 area) listen→load(). Reuses the EXISTING Refresh/load path (no new tree API, no FM tree logic).

### (c) collapsed feature shows real count via the SHARED mechanic — impl-edit
`FeatureManager.featureRoots` (FeatureManager.ts:136-148): add `childCount: au.length` to each feature root (EXACTLY like the Sprint root's `childCount:tasks.length` :1483). The SHARED `rb-trace-tree` buildSeedNode(:363 serverChildCount)→`dataset.childRefCount`→`computeBadges` then shows the real collapsed count. ZERO FM-specific tree code — one field feeds the generic eager/lazy badge. [[generic-behavior-in-the-shared-component]]

## Security / invariants (unchanged, by construction)
Opaque FIX-2 ref (`<feature>:<sha256[:16]>`, no raw token) preserved everywhere (description, child ref, avatar). INV-F7: `grantedUserProfile` + `RbProfileView` carry ONLY masked display — never token/secretCode; the enrichment adds masked fields only. Owner/member gate on /api/feature-manager + the Feature branch of /api/trace/children UNCHANGED. INV-G2 literal==1 untouched.

## Handoff
req: mint the 1 new node (Class RbProfileView + Method render; a fitting UC e.g. profile.viewFull) + reconcile the 5 impl-edit markers (grantedUserProfile enrich, RbProfileDetail.mount, allowedUsersChildren desc, featureRoots childCount, applyGrant/revoke+feature-manager refresh). expert: build against the units + the /profile-adoption recommendation (or flag it fast-follow). tester: gate @390 the RENDERED surface — `<rb-profile-view>` full viewer present (not a stub), Revoke directly under the bar + viewer below, child description = full uuid, COLLAPSED feature badge = real granted-user count, grant/revoke reflects in the tree (+Refresh); NOT "flow works". I backstop INV-F7 (no token/secret in any granted-user payload/render) + the rendered surface + a real restart (server changes: featureRoots/grantedUserProfile/allowedUsersChildren).

## PO RULING 2026-07-23 (scoping confirmed)
- (1) EXTRACT RbProfileView = APPROVED as THE one shared masking-aware profile viewer (INV-F7 by construction). ROUND-2 BUILD = the FM drawer detail renders `<rb-profile-view>` (not a stub) + the 4 impl-edits.
- (2) /profile migration to `<rb-profile-view>` = APPROVED but as a SCOPED FAST-FOLLOW — captured as its OWN follow-up AC (so it's genuinely the single viewer), NOT folded into round-2 (don't bloat / risk regressing the live /profile page). req captures it as a distinct follow-up; expert does it AFTER round-2 lands.
- (3) the other 4 impl-edits (grantedUserProfile enrich, allowedUsersChildren desc=uuid, featureRoots childCount, grant/revoke→refresh) = proceed.
- Re-gate @390 asserts the RENDERED viewer + Revoke-under-bar + collapsed-count (NOT flow). Real restart + verify-by-uptime for the server-method changes. I backstop INV-F7 + rendered surface.
NET round-2 = RbProfileView (new node) + FM drawer uses it + 4 impl-edits; /profile-adopts-rb-profile-view = captured fast-follow (separate AC).
