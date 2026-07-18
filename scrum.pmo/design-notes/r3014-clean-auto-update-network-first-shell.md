# R30.14 (EXTEND) — Clean auto-update: NETWORK-FIRST shell — a manual hard-reload must NEVER be required (P0)

**Author:** robbin-architect @ robbinTeam2:0.3 · **Status:** root-cause + design → FOLD the network-first-shell into R30.14's AC (req refined it at 2af4839b0; this is the missing piece) · **Date:** 2026-07-18
**This IS R30.14** (existing sw-auto-update — rb-update-banner 18ebf760 / pollForWorkerUpdate f1456992), NOT a new number (R30.33 = deletion-emit, was a mis-reference). R30.14's first refinement (poll + claimClients) could NOT beat a CACHE-FIRST shell — network-first-shell is what it missed. **crossRef:** R30.28 deploy-atomicity · sw.js.

## Measured state (R30.14 IS built — and here's why it still needs a hard reload)
- Build DOES stamp `sw.js` per version (build.mjs:53-76 → `CACHE_NAME='rawbin-v{version}'` + `STATIC_SHELL` hashed bundles). `sw.js` served `no-cache`. `<rb-update-banner>` IS on `/edit` (edit.ts) and `/app`.
- So the SW-update trigger exists. But two structural gaps defeat it:

### ROOT CAUSE #1 (the big one) — the SW serves the HTML shell CACHE-FIRST → a SOFT reload is stale
`sw.js` fetch handler (:64-92): everything except `/api/`,`/md/` → `cacheFirst`; navigations match cache first (`ignoreSearch`, :80). So the app-shell HTML (`/app`, `/edit`, `/trace`) is served from the OLD cache → OLD bundle hashes → old code. A normal `location.reload()` hits the same cacheFirst → still stale. **Only a HARD reload bypasses the SW and fetches fresh HTML.** That is *exactly* why Tron must hard-reload: the mutable HTML shell is cached immutably.

### ROOT CAUSE #2 — the version check is ONE-SHOT; the left-open tab has only the SW path
`rb-update-banner.checkForUpdate()` (`/api/config` version compare) runs ONCE in `connectedCallback` (:7) — a left-open tab NEVER re-checks the version. So left-open update detection relies SOLELY on `pollForWorkerUpdate` → `reg.update()` → new `sw.js` → `updatefound`. If that path misses for ANY reason — deploy served `sw.js` a beat behind the bundles (non-atomic, R30.28), browser SW-update throttling, the new SW stuck `waiting` without `updatefound` re-firing — there is NO fallback → stale until a manual hard reload.

Net: even when the SW path fires, its final `location.reload()` (controllerchange :26) can STILL be served stale HTML by cacheFirst unless the new SW has already claimed + purged — a race. The hard reload is the only thing guaranteed to be fresh. **That guarantee must move into the app.**

## DESIGN — clean auto-update (no hard reload, ever)
Three changes, each independently correct; together they make hard-reload impossible-to-need:

**A. HTML shell = NETWORK-FIRST in the SW (the core fix).** In `sw.js` fetch handler, route NAVIGATIONS (`request.mode === 'navigate'`) and the app-shell HTML through `networkFirst` (fall back to cache only when OFFLINE). Keep the HASHED bundles (`/dist/*-[hash].js`, immutable by content hash) `cacheFirst`. Result: ANY reload — even a soft `location.reload()` — fetches the CURRENT HTML → current bundle hashes → fresh app, with offline still working via the cache fallback. This alone removes the need for a hard reload.

**B. Continuous, SW-independent version poll (reliable detection).** Make `checkForUpdate` PERIODIC: poll `/api/config` (already `no-cache` + networkFirst) every 60s + on focus/visibility, compare `config.version` to the running build version (`__BUILD_VERSION__`, compiled in via build.mjs:29 — compare to the ACTUAL running code, not a localStorage baseline that drifts). On mismatch → show the prompt. This catches every deploy within 60s on a left-open tab and does NOT depend on the SW updating. (The SW `updatefound` path stays as a secondary trigger.)

**C. One-click "New version" prompt → clean swap (directive: hot-swap OR one-click; never a manual reload).** Tap → if a `reg.waiting` SW exists, `postMessage('SKIP_WAITING')` (its activate purges old caches + claims); then `location.reload()`. Because of (A) that reload is network-first → guaranteed fresh. No `waiting` worker (version changed without an SW delta) → just `location.reload()` (network-first HTML → fresh). The user taps ONCE; no hard reload. (Optional future hot-swap of the diff bundle without reload = R30.x follow-up; the one-click prompt satisfies P0.)

**D. Deploy-atomic (R30.28 tie-in).** `sw.js` + shell HTML + hashed bundles + `/api/config` version must flip together so the version poll never sees a half-deployed state. Ride R30.28's commitBeforeServe/assertVersionAtHead.

## Chain — FOLD into R30.14 (req refined at 2af4839b0; add the network-first-shell AC + UC)
| Hop | Unit | name (EXACT) |
|-----|------|--------------|
| Req  | **R30.14** (existing) | sw-auto-update — client auto-updates on deploy, manual hard-reload NEVER required. **ADD to AC: network-first HTML shell** (the piece the first refinement missed) + continuous version poll + one-click prompt |
| UC   | new | `serviceWorker.networkFirstShell` (A) · `updateBanner.continuousVersionPoll` (B) · `updateBanner.oneClickUpdate` (C) |
| Class| — | `ServiceWorker` (sw.js) + `RbUpdateBanner` (18ebf760) REUSE |
| Method | mix | NEW/edit `ServiceWorker` navigation→networkFirst (sw.js cacheFirst/networkFirst handlers) · impl-edit `RbUpdateBanner.checkForUpdate`→periodic + `showBanner` one-click (marker 18ebf760/f1456992 region) |
| Test | new | auto-update DET (AC below) |
Architect will re-derive exact new-Method vs impl-edit split once req drafts (sw.js navigation-routing is likely a NEW method `ServiceWorker.navigationStrategy`; the banner changes are impl-edits under existing markers).

## LOCKED AC
1. Deploy a new version to a LEFT-OPEN tab (no interaction) → within ~60s a "vX available" prompt appears (version poll), WITHOUT any manual reload.
2. Tap "Update" → app is on the new version with a SINGLE click; NO manual hard-reload anywhere in the flow.
3. A plain `location.reload()` after a deploy serves the CURRENT HTML + current bundles (network-first shell) — never a stale cached shell.
4. OFFLINE still works: navigations fall back to cache when the network is down.
5. Hashed bundles stay cacheFirst (immutable); no regression to offline/PWA install.
6. Version compare is against the RUNNING build (`__BUILD_VERSION__`), not a drifting localStorage baseline.

## Handoff
req folds NETWORK-FIRST-SHELL into R30.14's AC (+ the network-first UC/method) → I derive-confirm against R30.14 (ServiceWorker navigation-strategy + RbUpdateBanner impl-edits; markers) → PO build-go → expert (sw.js + banner + version-bump atomic) → tester DET (left-open deploy → prompt ≤60s → one-click, no hard reload) + Tron. **R30.31/R30.32 unaffected.**
