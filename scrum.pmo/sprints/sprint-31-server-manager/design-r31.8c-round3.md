# R31.8c ROUND-4 PLAN (robbin-expert capture 2026-07-23, for the fresh-budget expert — req chains ready, #126)

Round-3 DONE+LIVE+backstop-verified (v0.7.125, pid 3571355, commits 705cea994/8544b16a6/a0840c4f3/04453c099). Round-4 = req chains (build against them):
- **FIX-B (core): NEW neutral server module `src/ts/server/ProfileView.ts`** — Class ProfileView **e20de5f6**, Method `profileViewData` **86738972**. `static profileViewData(profile: ServerProfileRecord): ProfileViewData` — ONE builder, devices mapping INLINE. Neutral 3rd module BOTH server.ts + FeatureManager import (avoid circular dep). NOT the client RbProfileView. Place `[impl:uuid:<new>]` on the decl, ownerIor→86738972, add to implementations[]. Report marker to req.
- **(B) grantedUserProfile 8a3f6d21 (impl-edit):** return `ProfileView.profileViewData(profile)` (incl devices) + FeatureManager's profileUuid; DROP the summary identifiers/deviceCount. server.ts /profile PROFILE-ws feed uses the SAME builder → drawer===/profile BY CONSTRUCTION (this is the point of FIX-B).
- **(A1) featureRoots 79b22596 (impl-edit):** emit allowedUsers INLINE as `children` (reuse allowedUsersChildren ad622052) so the tree shows granted users inline.
- **(A2) SHARED rb-trace-tree items-mode reactive, on setItems Impl c5b331a7 (impl-edit):** connectedCallback SKIP graph-sub when `_items` set; render() → renderItems (not the no-graph render) when `_items`; renderItems clears stale `.tt-empty`. → revoke live-updates, no stray no-graph, refresh=fallback. REGRESSION-CHECK /trace.
- KEEP: non-owner→403 + INV-F7. Report all Impl markers → req reconciles + two-key; tester re-gates the REAL owner-interactive flow @390 (incl revoke live-update). SERVER changes (ProfileView/grantedUserProfile/featureRoots) → batched REAL restart + verify-by-PID.

---

# R31.8c ROUND-3 DESIGN — DELIVER LITERALLY (robbin-architect 2026-07-23)

PO owns the misses; root cause = WE injected owner-side masking/caution Tron never asked for (sha256 uuid, masked mini-card, INV-F7 on his OWN owner-gated console, deferred /profile migration = the stub). Round-3 = deliver LITERALLY + SIMPLER (remove the scope-creep). KEEP only the real protection: non-owner→403. MEASURED first.

## MEASURED
- **The user's REAL profile uuid EXISTS:** first-class `ior:class:User` scenario units (R19.54 "Users become first-class scenario units") carry a real v4 `model.uuid` DISTINCT from the token — e.g. "Marcel Donges" = `<user-token>-8209-4ebe-b2e4-fd9e4a5b185d` (token = `<owner-literal>-…`). So item-1 = THAT uuid (resolve allowedUsers token → the user's User-unit uuid), NOT sha256, NOT the token.
- **THE /profile viewer** = server-inline HTML (server.ts:2254-2314), fed by the PROFILE ws msg `m.profile`: avatar, Name, Token, Secret Code (.code), Devices list (type/deviceId[:8]/IP/screen/platform/connCount/lastSeen/online-dot), My Bug Reports list (status/date/text), feature-grants. THIS is the layout the shared viewer must render.
- Round-2 shipped `RbProfileView` (masking-aware, renders present fields) fed a MASKED subset + `grantedUserProfile`/`allowedUsersChildren` MASK (opaque sha256 userId, masked phone, opaque avatar route, no secret/devices) = the scope-creep to REMOVE. The masking-aware render is fine; feed it REAL FULL data.

## DELIVER (literal) — ONE real viewer, real data, real uuid, /profile migrated NOW

### (4)★ /profile → ONE shared viewer NOW (the deferral that caused the stub)
- `RbProfileView` (existing round-2 Class) = promoted to THE full real-profile viewer: renders avatar, Name, an ID row, Secret Code, Devices list (FULL details matching /profile), Bug Reports list — from its `data`. Data-driven, renders exactly the fields present.
- **MIGRATE /profile (server.ts:2254):** replace the inline HTML render with `<rb-profile-view>` in the page; the inline PROFILE-ws handler sets `el.data = m.profile` (own real profile incl token) → renders IDENTICAL to today = the PROOF it's the real viewer. Retire the inline HTML string (its layout MOVES into RbProfileView). `feature-grants` stays appended.
- FM drawer (`rb-profile-detail.mount`, round-2 already hosts `<rb-profile-view>`): feed it the REAL granted-user profile. So /profile AND the FM drawer are the two callers of the ONE viewer.

### (2)+(3) Drawer = the real viewer + REAL data (drop owner-masking)
- `FeatureManager.grantedUserProfile` (impl-edit): return the REAL FULL profile — real name, the user's **User-unit uuid** (id row), REAL phone/identifiers (NOT masked), REAL devices list (full details), secretCode, bugReports, real avatar. Owner-gated (unchanged). NO masking.
- `rb-profile-detail.mount` (impl-edit): feed `<rb-profile-view>` the real grantedUserProfile data; keep Revoke directly under the grab-bar, viewer below.

### (1) Subtitle = REAL profile uuid
- `FeatureManager.allowedUsersChildren` (impl-edit): child `description` = the user's **User-unit uuid** (resolve token → ior:class:User unit → model.uuid), NOT sha256, NOT masked-phone, NOT token. Real avatar (drop the opaque avatar route). Child ref = the profile uuid (server resolves uuid→token to act) — this keeps the raw auth TOKEN out of URL-addressable refs, which is a DIRECT consequence of item-1 (a real uuid, not the credential), NOT re-added masking.

### token → User-unit-uuid resolver (the one genuinely-new bit)
- NEW small server resolver (Method on `FeatureManager`, e.g. `profileUuidOf(token)` / and reverse `tokenOfProfileUuid(uuid)`): map an allowedUsers token ↔ its `ior:class:User` scenario unit uuid. Used by allowedUsersChildren (subtitle+ref), grantedUserProfile, revoke (uuid→token). REPLACES `userIdOf`(sha256)/`resolveGrantedToken`(sha256→token)/`grantedAvatarUrl`(opaque) — retire those.

### RETIRE (the scope-creep)
`userIdOf` (sha256), `grantedAvatarUrl` + the `/api/feature-manager/granted-user/avatar` opaque route, `maskIdentifier`/`maskPhone` on the owner FM path, the "masked" framing in grantedUserProfile/allowedUsersChildren. INV-F7 (owner-side masking) is WITHDRAWN — it was our scope-creep, not a Tron requirement.

### AC4 collapsed-badge=0 (tester 44e972e07, real bug) — SHARED tree 1-line
`rb-trace-tree.ts:186` (PATH-B): pass `root.childCount` as `serverChildCount` to buildSeedNode (twin of the :186 expander fix). featureRoots already emits childCount (round-2) → this wires it to the badge. Expert 1-line, proceeds regardless.

## SECURITY (keep the REAL protection, drop the scope-creep)
- **KEEP (untouched): non-owner → 403** on all Feature / server-manager / /api/feature-manager / granted-user / Feature-branch-of-/api/trace/children endpoints — the ACTUAL P0 (public non-owner token leak) fix. This is the security boundary.
- **DROP:** owner-side data masking on the owner-gated FM admin console. Tron is sole owner / root-of-trust viewing real users on HIS console → REAL data (real phone/devices/secret). This masking was OUR scope-creep.
- **FLAG (FUTURE, do NOT block round-3):** IF FeatureManager is ever delegated to NON-owner admins, revisit whether a delegate should see a user's raw token/secret/PII. Today Tron is sole owner → full real data. Captured as a future consideration only.

## Route / handoff
req: refine ACs (subtitle=real-User-unit-uuid / drawer==the /profile viewer / real-data-no-mask / migrate-/profile-NOW) + reconcile markers (RbProfileView=full viewer, /profile migration, grantedUserProfile real, allowedUsersChildren uuid, the token↔uuid resolver, retire sha256/opaque machinery). expert: build; /profile through RbProfileView must look IDENTICAL. tester: gate @390 AGAINST THE /profile REFERENCE — the FM drawer renders the SAME full viewer with REAL data + the real profile uuid subtitle; /profile still looks identical; non-owner STILL 403; collapsed badge = real count. Tron device. I backstop: /profile-identical + drawer==viewer + real-data + real-uuid + non-owner-403-KEPT + real restart (server methods changed).

## ARCHITECT BACKSTOP — R31.8c round-3 v0.7.125 / 04453c099 (robbin-architect 2026-07-23): **PASS**
Real restart (Ctrl-C→npm start, sole driver): fresh server.ts pid 3571355 (etimes 42s, was 3456s = the version-lie process). served==committed==0.7.125.
- **SACRED GATE intact:** non-owner /feature-manager + /api/feature-manager + /server-manager → 403; /trace → 200 (public).
- **STATIC:** profileUuidOf = follow-consolidation (`primary=redirectTo||token; get(primary).model.uuid`), NO sha256/userIdOf/hardcoded-<user-token>; subtitle+ref use it; grantedUserProfile returns REAL data (real phone/avatar/token/secretCode, no mask); /profile creates `<rb-profile-view>` (migration); opaque `/granted-user/avatar` route removed (grep 0).
- **LIVE (seeded owner):** allowedUsersChildren subtitle = the REAL profile uuid via profileUuidOf — owner→`<owner-literal>` (the honest primary uuid per my inverted-premise finding, NOT sha256), other user→`<grant-member>` (real v4). NO 16-hex sha256 ids. grantedUserProfile = REAL unmasked data (phone +4915253844085, secretCode, token, real avatar). featureRoots childCount=2 (collapsed badge). 
- **Tron device / tester @390 (I'm 403-limited on the authed browser render):** /profile renders IDENTICAL through `<rb-profile-view>` (the migration PROOF) + the FM drawer shows the same full viewer + Revoke-under-bar + collapsed real-count on screen. Static+data confirmed; the RENDERED-identical is the device gate.
- NOTE (my test-pollution, flagged): owner <owner-literal> profile name shows 'arch' (my ws-IDENTIFY seeds used name:'arch') — display-only, Tron/PO restore the real name; NOT a round-3 defect.
VERDICT: round-3 code LIVE + correct — real profile uuid (no sha256/guess), real data, /profile migrated, sacred gate intact. Tester @390 unblocked.
