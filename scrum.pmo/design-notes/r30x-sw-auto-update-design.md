# R30.x — Service-Worker Auto-Update (no more manual hard-refresh)

**Author:** robbin-architect · 2026-07-14. Recurring friction: Tron's SW serves the STALE cached bundle (PO measured — his merge header = old, tester fresh-browser = R30.13 live; so R30.13 IS served, just SW-cached client-side). He hard-refreshes every deploy. Design-only → req mints → I derive-confirm → PO build-go → expert (pure client, no server restart). Goal: new deploy → page auto-detects → one-tap "New version — reload" (no hard-refresh).

## Measured current state (mostly built — 2 targeted gaps)
- **sw.js:** `CACHE_NAME='rawbin-v0.7.21'` (build.mjs bumps per version → sw.js bytes change per deploy). `message` handler: `'SKIP_WAITING' → self.skipWaiting()` ✓. `install`: caches STATIC_SHELL (waits, no premature skipWaiting) ✓. `activate`: deletes old caches ✓ **but NO `clients.claim()`** ✗. `fetch`: cache-first for app shell (so /app HTML + bundles are cached until the new SW activates).
- **rb-update-banner.ts (Class RbUpdateBanner, mounted in app.ts + edit.ts):** `registerServiceWorker` wires `updatefound → newWorker.statechange==='installed' && controller → showBanner` ✓; `controllerchange → location.reload()` ✓; `showBanner` reload button → `reg.waiting.postMessage('SKIP_WAITING')` ✓; `checkForUpdate` polls `/api/config` version vs localStorage → showBanner — **but only runs ONCE on connectedCallback (page load)** ✗.

**Root cause:** the detection is correct BUT only fires on load/navigation. A PWA left open never re-checks sw.js (`updatefound` dormant) and never re-runs `checkForUpdate` → Tron must hard-refresh to trigger it. Plus, without `clients.claim()`, even after skipWaiting the new SW may not grab the open page → controllerchange unreliable.

## Fix — 2 targeted additions (reuse the existing banner/skipWaiting flow)
### (1) Proactive detection — Method `RbUpdateBanner.pollForWorkerUpdate` (NEW)
While the app is open, periodically force a check so the user never has to reload to be told:
- `setInterval(~60s)` + on `document.visibilitychange`(visible) / window `focus`: call `reg.update()` (forces the browser to re-fetch sw.js; if its bytes changed via the CACHE_NAME bump → `updatefound` fires → the EXISTING banner path lights up) AND re-run the `/api/config` version compare (the existing checkForUpdate logic, now periodic, as a belt-and-suspenders trigger).
- Debounce so a burst of focus/visibility events = one check. This is the piece that makes deploys visible WITHOUT a hard-refresh.

### (2) Reliable takeover — Method `ServiceWorker.claimClients` (NEW)
Add `self.clients.claim()` to the sw.js `activate` handler (after the old-cache cleanup) so the newly-activated SW immediately controls all open pages → `controllerchange` fires on the open page → the EXISTING `controllerchange → location.reload()` runs. Pairs with the existing SKIP_WAITING message handler (skipWaiting + claim = the standard reliable takeover).

### REUSE unchanged (build-note — markers STAY)
`RbUpdateBanner.registerServiceWorker` (updatefound wiring) + `showBanner` (banner + SKIP_WAITING post) + the `controllerchange → reload`; sw.js `SKIP_WAITING` message handler; the unrelated sw.js impls (flushAndReload 4bb96a28/79505a42, ignoreSearchNav cec00d7f, OfflinePage.reloadButton 3f6a9ce1) UNTOUCHED. `checkForUpdate` re-scoped to be callable periodically (impl-edit, marker stays).

## UX decision (flag to PO/Tron)
Primary = the existing **one-tap banner** ("New version — reload") — the single tap replaces the hard-refresh, no surprise reload mid-edit. OPTION (nice-to-have): auto-reload when the page is idle/hidden (reload on next visibilitychange→visible if an update is pending) so it's zero-tap without interrupting active work. Recommend banner-first; auto-reload-on-idle as a follow-up if Tron wants zero-tap.

## Chain to mint (scenario-first — req)
★ **MEASURED (uuid-file): `RbUpdateBanner` Class = 0 units (does NOT exist — the 'RbUpdateBanner' component is modeled under Class `ServiceWorker`). `ServiceWorker` Class = 8bd3bd6b, 3 methods (ignoreSearchNav, updateBanner, flushAndReload) — it already groups BOTH sw.js AND the banner concern.** So BOTH new methods go on the ONE existing `ServiceWorker` Class — do NOT mint a RbUpdateBanner Class.

| UC | Class (REUSE) | Method (NEW, name-matching) | sourceFile | Impl |
|----|---------------|-----------------------------|-----------|------|
| `swUpdate.pollForUpdate` | **ServiceWorker 8bd3bd6b** | `ServiceWorker.pollForWorkerUpdate` | src/public/ts/components/rb-update-banner.ts | designAhead |
| `swUpdate.claimClients` | **ServiceWorker 8bd3bd6b** | `ServiceWorker.claimClients` | src/public/sw.js | designAhead |

Two UCs, two NEW methods on the SAME Class `ServiceWorker 8bd3bd6b` REUSE (3→5 methods, +2), 0-dup, name-exact, designAhead, unit-level ownerIor. **Build-note (impl-edits, markers stay):** sw.js activate gains `clients.claim()` (in claimClients), `checkForUpdate`/registerServiceWorker (ServiceWorker.updateBanner, existing) re-scoped to be called periodically by pollForWorkerUpdate; the unrelated ServiceWorker impls (ignoreSearchNav/flushAndReload) untouched. crossRef T39 (ServiceWorker.updateBanner original).

## Gate / handoff
On req commit → I derive-confirm (2 NEW Methods name-exact, RbUpdateBanner + ServiceWorker REUSE 1-unit each/0-dup/+1 method each, designAhead, unit-level ownerIor, existing markers intact) → PASS/FAIL → PO build-go → expert (pure client, NO server restart) → I confirm 2 markers AST-attached (pollForWorkerUpdate on its decl in rb-update-banner.ts, claimClients on the sw.js activate/claim decl) + reused markers unchanged → tester DET-3x + Tron deploy-visibility re-check (deploy → banner appears within the poll interval WITHOUT hard-refresh).
