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

## ★ DERIVE-CONFIRM against refined R30.14 (req d5ac7de75) = FAIL (cross-wired) — req must fix
Measured Req `96634144` (altId R30.14 "Service-Worker auto-update"): `useCases = [9c41a415, d7493e80]`.
- `9c41a415` = **merge.kindColoring** (Class RbDiffEditor 18165081, method computeMergedCenter 09af8c8d)
- `d7493e80` = **merge.blockActions** (Class RbDiffEditor, method dfbbd057)
These are **R30.35 coloring+actions** content wrongly parented to R30.14. The genuine R30.14 auto-update units EXIST but aren't the req's UCs: `ServiceWorker.pollForWorkerUpdate` `82e5ba83`, `ServiceWorker.claimClients` `406e1e33`, `RbUpdateBanner` `18ebf760`. And the NEW **network-first-shell** UC/Method is ABSENT.
**Fix for req:** (a) MOVE `9c41a415`/`d7493e80` off R30.14 → onto the new R30.35 req (coloring+actions); (b) wire R30.14's real UCs — `serviceWorker.networkFirstShell` (new, below) + poll + claimClients + one-click banner; (c) mint the network-first UC/Method. Then I re-derive.

## EXPERT IMPL SPEC — network-first shell (exact)
**Decision: NEW named ServiceWorker method `ServiceWorker.navigationStrategy` (mark it) + REUSE existing `networkFirst`.** The routing change is a genuinely new named behavior (THE clean-release fix, tester-gated) → a champagne unit; the delivery mechanism (`networkFirst`) already exists and keeps offline intact. The banner changes are impl-edits under `RbUpdateBanner` markers.

**sw.js fetch handler (`self.addEventListener('fetch')`, :64):** route shell + bundles network-first; keep offline fallback via the existing `networkFirst`:
```
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.protocol === 'ws:' || url.protocol === 'wss:') return;
  event.respondWith(navigationStrategy(event.request, url));   // R30.14
});

// [impl:uuid:<mint>] ServiceWorker.navigationStrategy — R30.14 network-first shell (deploys reach the running client)
function navigationStrategy(request, url) {
  // /api + /md already network-first; NAV + shell HTML + hashed bundles → network-first so a deploy is fetched fresh.
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/md/')) return networkFirst(request);
  if (request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.startsWith('/dist/')
      || ['/app','/edit','/trace','/scenario'].includes(url.pathname)) return networkFirst(request);
  return cacheFirst(request);   // icons, css, other immutable static → cache-first (fast); still refreshed by networkFirst’s cache.put path when fetched
}
```
- **Offline stays intact BY CONSTRUCTION:** `networkFirst` (:94) = try fetch → on success `cache.put` + return → on network FAIL → `caches.match` (last-cached shell/bundle) → else `offlineResponse()`. So online = always fresh; offline = last-cached; `install` still pre-caches `STATIC_SHELL`, `activate` purges non-current caches + `claimClients()`. No offline regression.
- **Hashed bundles (`/dist/*-[hash].js`) note:** immutable by content-hash, so `cacheFirst` is also safe+faster (a new deploy = new hash = cache-miss = fresh fetch). PO directive = network-first for bundles too (belt-and-suspenders / guaranteed) — spec'd above; if latency matters, flip `/dist/` back to `cacheFirst` with ZERO freshness loss (the network-first HTML shell already guarantees the new hashes are requested). **Recommend: shell+nav network-first is the essential fix; `/dist/` cacheFirst is the faster equivalent — PO's call; both reach the client.**

**Banner (`RbUpdateBanner` 18ebf760 impl-edits):** `checkForUpdate` → periodic (60s + focus/visibility), compare `/api/config` version to `__BUILD_VERSION__`; `showBanner` one-click → `SKIP_WAITING` (if waiting) then `location.reload()` (now network-first → fresh). `pollForWorkerUpdate` (f1456992) + `claimClients` (406e1e33) unchanged. Deploy-atomic per R30.28.

## Handoff
req folds NETWORK-FIRST-SHELL into R30.14's AC (+ the network-first UC/method) → I derive-confirm against R30.14 (ServiceWorker navigation-strategy + RbUpdateBanner impl-edits; markers) → PO build-go → expert (sw.js + banner + version-bump atomic) → tester DET (left-open deploy → prompt ≤60s → one-click, no hard reload) + Tron. **R30.31/R30.32 unaffected.**
