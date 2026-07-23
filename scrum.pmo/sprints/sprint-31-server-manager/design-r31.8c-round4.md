# R31.8c ROUND-4 DESIGN — reactive FM tree + drawer feed-parity (robbin-architect 2026-07-23)

Tron device walk-through (R31.8c-round4-feedback.md, ed11fb8f8): 5 issues. MEASURED the shipped v0.7.125 code (not assumed). TWO roots — ROOT A is the "likely ONE root" the spec hypothesized for issues 2/3/4/5 (confirmed); ROOT B is issue 1 (drawer). DRY, reuse SHARED mechanics, no per-symptom forks. [[generic-behavior-in-the-shared-component]] [[gate-the-ac-surface]]

## MEASURED — the two roots

### ROOT A — the FM tree is NOT reactive (issues 2 revoke, 3 principle, 4 refresh, 5 "no graph"): CONFIRMED ONE ROOT
- FM client (`feature-manager.ts:22-47`): `load()` → `GET /api/feature-manager` → `tree.items = roots`. `refresh` + `fm-tree-refresh` BOTH call `load()` (the wiring exists). Revoke DOES dispatch `fm-tree-refresh` (`rb-profile-detail.ts:65`). So the event path is present — yet nothing updates. Why:
- **Feature roots are LAZY** — `featureRoots()` returns `{hasChildren:true}` with NO inline children (allowedUsers fetched separately on expand via `/api/trace/children` Feature-branch → `allowedUsersChildren`). `renderItems()` (rb-trace-tree:136) keyed-reconciles ROOTS and, PATH-A (:151-183), only reconciles `root.children` **when inline children are present**. With lazy roots (`root.children` empty), the already-expanded `.tt-children` (lazily-loaded granted-user nodes) are **never re-reconciled** → after revoke→`load()`, the root badge may change but **the revoked user node stays in the expanded list** (issue 2), and Refresh looks like a no-op on the visible children (issue 4).
- **"no graph" leak (issue 5):** rb-trace-tree `connectedCallback:82` subscribes EVERY non-graph-seeded tree to `ViewBus.subscribe('graph', () => this.render())`. The FM tree is `.items`-fed (no `.graph`). Any `'graph'` ViewBus event → `render()` → `:209 if(!this.graph){ innerHTML='no graph'; return }` wipes to a `.tt-empty` "no graph". `renderItems()` then APPENDS `.tt-node` roots but **only removes stale `.tt-node`** (:192) — it never clears the `.tt-empty` placeholder → **"no graph" persists at the TOP** above the tree (exactly Tron's screenshot).
- `/server-manager` does NOT have issue 2/4 because it returns **inline** children (server.ts:988) so `renderItems` reconciles the whole visible tree. The FM chose lazy → lost the shared reconcile. Same latent "no graph" leak applies to it.

### ROOT B — drawer feed ≠ /profile feed (issue 1 "drawer is a fork"): NOT a component fork, a DATA-SHAPE fork
- `rb-profile-detail.ts:36` DOES render the shared `<rb-profile-view>` (the canonical viewer). tagMap `profile→rb-profile-detail` (rb-detail-drawer.ts:182). So the COMPONENT is shared — Tron's "it's a fork" is true at the RENDER SURFACE but caused by the FEED, not the component.
- `/profile` (server.ts:2278-2282) feeds `<rb-profile-view>` the **FULL** shape (`token/secretCode/devices/bugReports`). The FM drawer feeds `grantedUserProfile` (FeatureManager.ts), which returns the **SUMMARY** shape (`identifiers`, no `devices` array; `grantedFeatureCount`). rb-profile-view is data-driven ("renders exactly the fields present", ProfileViewData supports BOTH full + summary) → the FM feed renders the SUMMARY layout ("Identifiers", "Feature grants", NO Devices list) = Tron's screenshot; /profile renders the FULL layout (Devices(N)). **Different feed → different render, same component.**

## DESIGN — reuse the shared mechanics, kill both roots by construction

### FIX A1 — inline children ⇒ shared `renderItems` reconciles the whole visible tree live (issues 2/3/4)
Make `/api/feature-manager` return Feature roots WITH their `allowedUsers` **inline** as children (the `/server-manager` shape, server.ts:988), so `renderItems()`'s existing keyed reconciliation (PATH-A `root.children` diff, :163-182) handles grant/revoke by construction: revoke → `fm-tree-refresh` → `load()` → `renderItems` diffs the inline children → the revoked child node is REMOVED + badge decrements, LIVE, no manual refresh. Grant → child appears. **Reuses the shared reconcile — no new store, no fork.** Honors the reactive principle (issue 3): the AUTO `fm-tree-refresh`-on-mutation is the primary live path; the manual Refresh button stays as the last-resort fallback ONLY.

| File | Change |
|------|--------|
| `src/ts/server/FeatureManager.ts` `featureRoots()` | emit each Feature root WITH `children: allowedUsersChildren(featureUuid)` INLINE (+ keep `childCount` badge) — same shape `/server-manager` returns; owner/member-gated already. Reuse the EXISTING `allowedUsersChildren` (composite refs, opaque userId, INV-F7 preserved). |
| `src/public/ts/feature-manager/feature-manager.ts` | none needed — `load()` already sets `tree.items = roots`; inline children flow through `renderItems`. (Keep `fm-tree-refresh`→`load()` as the auto path; keep the Refresh button as last-resort.) |

### FIX A2 — kill the "no graph" leak in the SHARED tree (issue 5) — benefits /server-manager too
An `.items`-fed tree must never be wiped by a `'graph'` event, and `renderItems` must clear stale empty-state placeholders.

| File | Change |
|------|--------|
| `src/public/ts/trace/rb-trace-tree.ts:82` | gate the ViewBus subscription on graph-mode: `if (!this._items && !data-seed-ior && !data-eager-lazy) this.unsub = ViewBus.subscribe('graph', …)` — an items-fed tree does NOT subscribe to `'graph'` (it has no graph; the event only wipes it). |
| `src/public/ts/trace/rb-trace-tree.ts` `render():209` | belt-and-suspenders: if `this._items` present, call `this.renderItems()` instead of emitting "no graph" (never wipe an items-tree). |
| `rb-trace-tree.ts renderItems()` (~:139) | before appending roots, remove any stale non-`.tt-node` placeholder (`this.querySelector(':scope > .tt-empty')?.remove()`) so a prior "no graph"/"Loading" never persists above the tree. |

### FIX B — drawer feed parity: ONE shared full-profile builder (issue 1)
`grantedUserProfile` must return the IDENTICAL full `ProfileViewData` shape `/profile` feeds `<rb-profile-view>` — WITH the real `devices` array (+ bugReports/token/secret already added in round-3), DROP the summary-only `identifiers`/`grantedFeatureCount`/`deviceCount`. Best correct-by-construction: extract a SHARED `profileViewData(profile)` builder used by BOTH the `/profile` render (server.ts:2278) AND `grantedUserProfile` (FeatureManager.ts) → same shape by construction ⇒ **drawer render === /profile render** (same view + same feed). INV-F7 stays (owner console shows real data per round-3 deliver-literally; non-owner-403 is the security, not owner-masking [[deliver-literally-gate-is-security-not-owner-masking]]).

| File | Change |
|------|--------|
| `src/ts/server/` (shared) | extract `profileViewData(p): ProfileViewData` (full: avatar/name/profileUuid/token/secretCode/devices/bugReports) used by both callers. |
| `FeatureManager.ts grantedUserProfile` | return `profileViewData(profile)` (incl `devices`), drop summary fields. |
| `server.ts` /profile feed | feed from the same `profileViewData` (already full; just share the builder). |

## GATE (tester — REAL owner-interactive @390, NOT seeded-structural) — the round-3 gate-gap
Seed a REAL owner session + drive the actual flow: (1) open a granted-user in the drawer → screenshot === /profile screenshot (SAME sections incl **Devices(N)**), not "a component mounted"; (2) click **Revoke** → the child DISAPPEARS from the tree LIVE + badge decrements, WITHOUT pressing Refresh; (3) grant → child appears live; (4) Refresh (last-resort) actually re-fetches; (5) NO "no graph" label anywhere. [[tron-on-390px-mobile-gate-there]]. Re-open round-3 `AC-detail-full-profile` as UNMET.

## ROUTE — diligent scenario-first, FULL team (Tron)
- **planner (0.6):** scaffold round-4 task + reopen the device-QA'd ACs on the board.
- **req (0.4):** capture-gate each of the 5 as ACs pinned to the REAL @390 interactive assertions above; reopen AC-detail-full-profile UNMET.
- **architect (0.3, me):** this design (roots + FIX A1/A2/B). Node topology: FIX-A1 = impl-edit `featureRoots` (existing Method, no node) + reuse `allowedUsersChildren`; FIX-A2 = impl-edit shared `rb-trace-tree` (RbTraceTree.render/renderItems + connectedCallback, existing Impls); FIX-B = NEW shared `profileViewData` builder (mint a Method) + impl-edits on grantedUserProfile + /profile. Supply per-node topology on req request (#126).
- **expert (0.1):** build. **tester (0.5):** the REAL owner-interactive @390 gate above. **Tron:** device re-verify.
I backstop: drawer===/profile (feed parity), revoke-live-reconcile, no-graph-gone, INV-F7/INV-G preserved, + real restart (server methods changed → Ctrl-C+npm start, verify by fresh PID).

## ARCHITECT BACKSTOP — v0.7.126 (expert fddf58d89 + ade3a35cd, robbin-architect 2026-07-23): **PASS** (server+data live; rendered surface → tester @390)
Real restart Ctrl-C+npm start (sole driver): fresh **pid 4181813** (etimes 34s), /api/health uptime=37 reset, served==0.7.126.
- **STATIC (all 3 match design):** FIX-A1 `featureRoots` emits `children: allowedUsersChildren(uuid,profiles)` INLINE + childCount (FeatureManager.ts). FIX-A2 rb-trace-tree: (a) `connectedCallback:81` gates ViewBus graph-sub on `!this._items`; (b) `render():208` `if(this._items){renderItems();return}` before the 'no graph' branch; (c) `renderItems():138` clears `:scope > .tt-empty`. FIX-B `ProfileView.profileViewData` (neutral module, Impl c3e6a2b4) returns full shape incl `devices`; BOTH `grantedUserProfile` (FeatureManager.ts:241) AND the /profile PROFILE-ws feed (server.ts:2770) call it → same builder.
- **LIVE (seeded owner via ws IDENTIFY):** FIX-A1 **PASS** — `GET /api/feature-manager` returns 2 Feature roots each with INLINE `children.length==childCount` (Server Manager 2/2, Feature Manager 2/2; composite refs `<feature>:<userId>`) → shared `renderItems` can reconcile grant/revoke live. FIX-B **PASS** — `GET /api/feature-manager/granted-user` (200) returns `[name,avatar,profileUuid,token,secretCode,devices,bugReports]` = FULL ProfileViewData, `devices` field PRESENT, summary `identifiers`/`deviceCount` DROPPED → rb-profile-view renders the Devices section === /profile (same builder both sides).
- **SACRED GATE / INV:** non-owner 403 on `/api/feature-manager`, `/feature-manager`, `/server-manager`, `/api/server-manager/tree`; `/trace` 200. INV-F7 (owner real data, non-owner-403=the security) + INV-G untouched.
- **403-LIMITED → tester REAL owner-interactive @390 + Tron device:** the RENDERED surface — drawer screenshot===/profile (incl Devices list on-screen), Revoke→child DISAPPEARS live + badge--, NO "no graph" label. Server data + client reconcile mechanics are in place (proven above); the on-screen render is the tester's real-interactive gate.

## ROUND-4 REDs (tester real-@390 r31r4, gate now works) — DIAGNOSIS + fix (robbin-architect 2026-07-23)
The real owner-interactive gate (round-3 gap closed) caught 2. MEASURED both.

### RED-1 — drawer missing Devices(N)/BugReports (AC-detail-full-profile still UNMET). ROOT = devices-ENRICH not shared (NOT "summary vs builder")
Expert's data-point ("endpoint returns a summary, not the builder") is OVERRIDDEN by measurement: `grantedUserProfile` (FeatureManager.ts:241) ALREADY calls the shared `ProfileView.profileViewData` (FIX-B landed). `profileViewData` (ProfileView.ts:42-43) DOES emit `devices`/`bugReports`, and rb-profile-view renders them. So neither the builder nor the render is the gap.
**The gap is the FEED into the builder:** `devices` are NOT on the profile record — they live in the SEPARATE `deviceRecords` store (server.ts). `/profile` MERGES them before the builder: `ProfileView.profileViewData({ ...profile, devices: myDevices }, { connectedDeviceIds })` where `myDevices = deviceRecords.filter(d => d.ownerToken === token)` (server.ts:2767-2770). `grantedUserProfile` passes the raw `p = userProfiles.get(token)` (NO devices, NO connectedDeviceIds) → `profileViewData` sees `p.devices === undefined` → emits `devices:[]` → the drawer's Devices section is empty while /profile shows Devices(6). (My earlier live-PASS used the OWNER, who genuinely has 0 devices — that MASKED it; the tester used a user WITH devices. Lesson: backstop feed-parity with a user that HAS the data.) bugReports ARE on the profile record (loadProfiles:186) so they flow already; if still absent the tested user has none — devices is the certain root.
**FIX (correct-by-construction — share the ENRICH, not just the builder):** extract ONE `profileViewDataForToken(token, {connectedDeviceIds?})` in server.ts (where `deviceRecords` lives) = load profile + merge `devices = deviceRecords.filter(ownerToken===token)` + connectedDeviceIds + profileUuid → `ProfileView.profileViewData(...)`. Use it in BOTH the /profile feed AND the granted-user handler (server.ts:1071). `grantedUserProfile` keeps ONLY the INV-F7 `userId→token` resolution (returns the resolved token, server-side); the server.ts handler does the devices-enrich via the shared fn → drawer feed === /profile feed BY CONSTRUCTION (devices included). INV-F7 kept (owner deliver-literally real data; non-owner-403 at the caller sacred). [[measure-all-auth-layers-not-just-caller]] pattern: parity needs the WHOLE feed path shared, not just the last builder call.

| File | Change |
|------|--------|
| `src/ts/server/server.ts` | NEW shared `profileViewDataForToken(token, opts?)` = merge `deviceRecords.filter(ownerToken===token)` + connectedDeviceIds + profileUuid → `ProfileView.profileViewData`. |
| `src/ts/server/server.ts` /profile feed (:2770) | call `profileViewDataForToken(profile.token, {connectedDeviceIds})` (same output, now the shared fn). |
| `src/ts/server/server.ts` granted-user handler (:1071) | `const token = FeatureManager.resolveGrantedTokenForView(feature,id)` (INV-F7 userId→token) → `profileViewDataForToken(token)` — devices now flow. |
| `FeatureManager.ts grantedUserProfile` | slim to the INV-F7 resolution (or expose `resolveGrantedTokenForView`); the devices-enrich moves to the server.ts shared fn (FeatureManager has no `deviceRecords` access). |

### RED-2 — feature badge (childCount) doesn't decrement on revoke. ROOT = SHARED rb-trace-tree: re-render doesn't refresh `dataset.childRefCount`
`renderItems` PATH-A (rb-trace-tree.ts:154) updates the item's `child-count` attribute on re-render, but does NOT update `node.dataset.childRefCount`. `computeBadges` sets the badge = `Math.max(domCount, Number(node.dataset.childRefCount))`. After revoke → `fm-tree-refresh` → `load()` → `renderItems` reconciles the inline child OUT (domCount 3→2) but `dataset.childRefCount` stays the BUILD-time 3 → `max(2, 3) = 3` → badge stuck at 3. Shared gap (any reconciled items-tree; the child-remove works via FIX-A1, only the badge lags).
**FIX (shared rb-trace-tree, correct-by-construction):** on every re-render, `dataset.childRefCount` must track current data — in `renderItems` PATH-A (and the child-update path :178) set `node.dataset.childRefCount = String((root.children||[]).length || root.childCount || 0)` alongside the `child-count` attr, so `computeBadges` reflects the current count. (Belt: `computeBadges` for a FULLY-inline reconciled tree could prefer domCount, but updating childRefCount is the minimal correct fix + keeps collapsed-badge-correct.)

| File | Change |
|------|--------|
| `src/public/ts/trace/rb-trace-tree.ts` `renderItems()` PATH-A (~:154) + child path (~:178) | set `node.dataset.childRefCount = String((root.children||[]).length || root.childCount || 0)` on the existing-node update, so `computeBadges` decrements the badge live. |

### Route / gate
req reconciles: RED-1 = impl-edits (new shared `profileViewDataForToken` in server.ts + slim grantedUserProfile — confirm if the shared fn is a NEW Method node or a thin server helper; RECOMMEND thin server helper, no node, rides existing /profile+granted-user impls, like other server.ts helpers) + RED-2 = impl-edit on the shared rb-trace-tree (rides setItems c5b331a7 like FIX-A2). Expert builds BOTH. Tester re-gates @390 with a user that HAS Devices(6)+BugReports: drawer Devices/BugReports === /profile; revoke → badge decrements live. I real-restart (server.ts changed) + backstop (feed-parity with a device-having user this time) + INV-F7/G.

## ARCHITECT BACKSTOP — round-4-fix v0.7.127 (expert f97e073b3, robbin-architect 2026-07-23): **PASS** (feed-parity proven WITH real devices)
Real restart Ctrl-C+npm start (sole driver): **fresh pid 63513** (etimes 18s), /api/health uptime=19 reset, served 0.7.127.
- **STATIC:** RED-1 `profileViewDataForToken(token)` (server.ts:866) merges `deviceRecords.filter(ownerToken===token)` (:868) + connectedDeviceIds + profileUuid → ProfileView.profileViewData; used by BOTH /profile feed AND granted-user handler (:1087); grantedUserProfile slimmed to userId→token. RED-2 `renderItems` re-stamps `ex.dataset.childRefCount` (:155) + `cex` (:180) on UPDATE → `computeBadges` max(domCount, FRESH refCount).
- **LIVE — RED-1 PASS (device-having user, the honest-catch closed):** seeded owner; `GET /api/feature-manager/granted-user` for **05e58f81 (Marcel Donges, 3 real devices, granted member)** → 200, keys `[name,avatar,profileUuid,token,secretCode,devices,bugReports,connectedDeviceIds]`, **DEVICES=3 POPULATED** (was `[]` pre-fix; the OWNER's 0-devices masked it last round). Both feeds now use `profileViewDataForToken` → drawer feed === /profile feed BY CONSTRUCTION. bugReports=0 (this user genuinely has none).
- **RED-2 static-PASS:** childRefCount re-stamped on re-render → badge max() sees the fresh count; live badge-decrement-on-revoke render = tester @390.
- **SACRED / INV:** non-owner 403 on /api/feature-manager, /feature-manager, /server-manager; /trace 200; INV-F7 (owner real data) + INV-G intact.
- **403-LIMITED → tester @390 + Tron:** the ON-SCREEN render — drawer Devices(N)/BugReports === /profile for a device-having user (server feed proven above), badge decrements live on revoke. Recommend the tester use SystemTester (ce981242, 6 devices) or Marcel Donges (05e58f81, 3 devices).
