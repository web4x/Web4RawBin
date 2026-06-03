[Back to Sprint 17 Planning](./planning.md)

# T179: SW reliability — auto-activation + STATIC_SHELL build-manifest derivation (closes "all routes broken except /")
[task:uuid:7b0985b9-6d81-4e37-963b-03fca2716f25]

> **PO direction 2026-06-03 (folded scope):** T179 covers BOTH SW concerns
> that surface as Tron's "all routes broken except /" symptom:
>
> **(a) SW auto-activation reliability** — `skipWaiting` + `clients.claim` +
> old-cache purge on `activate` so Tron never has to manually clear the SW.
>
> **(b) STATIC_SHELL must derive from build-manifest (never stale hashes).**
> ROOT CAUSE confirmed 2026-06-03: `sw.js` line 42 falls back to
> `cache.add('/dist/app.js').catch(() => {})` when the manifest lookup misses.
> The real bundle is hashed (e.g. `app-PMIKRTJL.js`); `/dist/app.js` returns
> 404; SW caches the 404; every route that depends on `app.js` (i.e. all of
> them except `/`) breaks until manual clear. Fix: STATIC_SHELL MUST be
> derived from the build-manifest at SW-generation time — no hard-coded
> unhashed paths, no `.catch` swallows of cache-add failures.
>
> Both fixes ship together in one `sw.js` pass (same surface, one rule-pair
> cycle). 4-role: architect designs lifecycle + manifest-derivation; expert
> implements; tester proves auto-takeover + all-routes-live on 2nd load WITH
> SW ACTIVE (per the strict-verify-bar extension below).

> NOTE: letter **R-R** is already in use by S13 (R-R1: all user rooms load from
> disk on connect). T179 uses **R-S** to avoid collision.

## Status — ✅ impl-shipped (expert 80ed9911 v0.5.78; planner-first inverted but landed)
- [x] Planned
- [x] In Progress
  - [x] refinement (architect designed SW lifecycle + build.mjs STATIC_SHELL derivation in same pass; planner-first inverted but converged)
  - [x] creating test cases
  - [x] implementing (expert `80ed9911` v0.5.78 — sw.js: SKIP_WAITING postMessage handler at L27-29 (skipWaiting), activate handler purges old caches at L46-47 (`caches.keys().filter(!== CACHE_NAME).delete`), `self.clients.claim()` at L50; build.mjs auto-injects ALL hashed bundle names (app + trace-page + scenario-view) into STATIC_SHELL — removed the fragile `cache.add('/dist/app.js').catch(() => {})` fallback that cached the 404. Rule-pair (a)+(b)+(c) ✓ verified — package.json + sw.js + build.mjs + STATIC_SHELL updated; 836/836 pass.)
  - [ ] testing (PENDING — tester SW-ACTIVE verify per strict-bar (2b): AC11-13 + repro Tron's "all routes broken except /" symptom returns ZERO 404s for app.js with SW active; check `caches.match('/dist/app.js')` returns undefined post-install)
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

> **One-time transition caveat (PO 2026-06-03):** Tron's CURRENT pre-v0.5.78
> SW lacks the SKIP_WAITING postMessage handler and the `clients.claim` call.
> So this single fix does NOT auto-takeover for him — he needs **ONE LAST
> MANUAL CLEAR** to get onto v0.5.78. After that, every future version auto-
> activates without manual intervention. This is the unavoidable transition
> from a SW that doesn't know how to take over to one that does.

## Traceability
- up
  - [Sprint 17 Planning](./planning.md)
  - PO directive 2026-06-03 (Tron-relayed): recurring stale-cache root fix; "Tron never manually clears again"
  - **R-S** `[requirement:uuid:18e5e44e-fffa-42ae-b108-2ee596cf397e]` — Service Worker MUST auto-activate a new version + purge stale caches + take control of open clients without manual user intervention (planner pre-seed; req-eng to anchor verbatim Tron quote if relayed)
- follows
  - The rule-pair (b) standing rule (every shipping commit bumps `sw.js` CACHE_NAME — learning #15): T179 makes that bump actually take effect at runtime
  - Past stale-cache incidents that required manual clear (numerous; T179 is the systemic fix)
- unblocks
  - Removes a class of "looks fixed but Tron still sees old version" bugs — the gap between commit-time and runtime takeover
- down
  - None (atomic task — one SW lifecycle pass)

## Task Description (planner seed — architect designs)

**Problem:** `src/public/sw.js` bumps `CACHE_NAME` on every shipping commit (per
rule-pair (b)). But the **runtime activation behavior** doesn't reliably:

1. **Take over immediately** — without `self.skipWaiting()` in `install`, a new
   SW sits in `waiting` state until all controlled clients are closed (Tron's
   iPhone PWA may keep tabs open for days). Update banner exists, but if the
   user dismisses or never sees it, the old SW keeps serving stale assets.
2. **Claim open clients** — without `self.clients.claim()` in `activate`, even
   after the new SW activates it doesn't control existing pages until next nav.
3. **Purge old caches** — without an `activate`-time sweep deleting any
   `caches.keys()` not matching the current `CACHE_NAME`, old cached responses
   linger and can be served by a misconfigured route. Disk pressure too.
4. **Coordinate with the update banner** — the existing `rb-update-banner` (S5
   T34) checks `/api/health` for a version mismatch and prompts reload. With
   `skipWaiting+claim`, the banner UX should change: if the SW already took
   control, the banner becomes "App was updated" (informational, click-to-dismiss)
   instead of "Click to update" (action-required). Architect designs the exact
   interaction so the banner isn't a stale "click to update" after auto-takeover.

**Architect to design (SW lifecycle):**

```javascript
// src/public/sw.js — additions architect specifies:
self.addEventListener('install', (e) => {
  e.waitUntil(/* precache STATIC_SHELL — existing */);
  self.skipWaiting();           // (1) NEW: take over without waiting
});

self.addEventListener('activate', (e) => {
  e.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    )),                          // (3) NEW: purge old caches
    self.clients.claim(),        // (2) NEW: control open clients
  ]));
});
```

Plus a designed **banner interaction**:
- If `clients.claim` succeeded: banner becomes "App updated to vX.Y.Z" + dismiss button
- If user dismisses the banner: banner stays hidden until next version bump
- No "Click to update" prompt for the user — taking over is automatic

**Expert implements** the architect's design in `src/public/sw.js` + adjusts
`rb-update-banner` per the banner-interaction spec. Rule-pair (a) `package.json`
bump + (b) `sw.js` CACHE_NAME bump + **(c) STATIC_SHELL likely required** if
banner-component bundle changes (architect declares per learning #16).

**Tester proves:**
- 2nd page load after deploy: new SW is controlling (no manual clear)
- Old caches deleted (caches.keys() returns exactly [CACHE_NAME] post-activation)
- Banner shows "App updated to vX.Y.Z" once, dismissable, doesn't reappear
- Existing clients (tabs already open during deploy) take control on next paint
  without requiring close/reopen

## Owners (CMM4 — 4-role per learning #18)
- **robbin-req** — anchor R-S verbatim if Tron relays additional context (e.g. "I had to clear cache again")
- **robbin-architect** — design the 3-step SW lifecycle (skipWaiting / clients.claim / cache-purge) + the banner interaction post-claim; declare (c) STATIC_SHELL requirement
- **robbin-expert** — implement architect's design in `sw.js` + `rb-update-banner`; rule-pair (a)+(b)+(c) per architect declaration
- **robbin-tester** — prove 2nd-load auto-takeover (no manual clear), old caches purged, banner UX matches spec; regression on rule-pair-bump chain

## Acceptance Criteria

**R-S part (a) — SW auto-activation reliability:**
- [ ] AC1 — `sw.js install` handler calls `self.skipWaiting()` (new SW takes over without waiting for all clients to close)
- [ ] AC2 — `sw.js activate` handler calls `self.clients.claim()` (new SW controls open clients immediately)
- [ ] AC3 — `sw.js activate` handler purges all non-current caches: `caches.keys()` post-activation returns exactly `[CACHE_NAME]`
- [ ] AC4 — Update banner becomes informational ("App updated to vX.Y.Z" + dismiss) when `skipWaiting+claim` succeeded — not "Click to update" (action-required)
- [ ] AC5 — Banner is dismissable per session; doesn't reappear until next version bump

**R-S part (b) — STATIC_SHELL derives from build-manifest (closes "all routes broken except /"):**
- [ ] AC6 — `sw.js` STATIC_SHELL is **generated from the build-manifest** at build time (or hydrated from manifest at SW install time) — never contains hard-coded unhashed paths like `/dist/app.js`
- [ ] AC7 — The `/dist/app.js` fallback (current `sw.js:42` `cache.add('/dist/app.js').catch(() => {})`) is **removed** — no more silent 404 cache
- [ ] AC8 — Any cache-add failure in `install` aborts SW installation (throws, doesn't `.catch()`) — a missing precache asset must NOT be silently swallowed
- [ ] AC9 — Post-install audit: `caches.match('/dist/app.js')` returns undefined (no stale unhashed entry); `caches.match('/dist/app-<hash>.js')` returns the bundle
- [ ] AC10 — `/app` route loads cleanly after a fresh SW install (the headless reproduction of Tron's "all routes broken except /" symptom returns ZERO 404s for app.js)

**Tester verification (per strict-verify-bar 2026-06-03 extension):**
- [ ] AC11 — Tester verifies WITH SW ACTIVE — not just unit/integration tests bypassing the SW. Headless Playwright registers the SW, awaits activation, then loads each route. Verifications done without SW = false-clean (the gap that hid this bug).
- [ ] AC12 — 2nd page load after a new deploy serves new bundle without manual SW clear (Tron headless + iPhone)
- [ ] AC13 — Existing tabs/clients open during deploy receive new SW control on next paint (no close/reopen required)

**Backwards-compat + ship rules:**
- [ ] AC14 — Rule-pair (a) `package.json` bump + (b) `sw.js` CACHE_NAME bump + **(c) STATIC_SHELL** per architect declaration (banner-component bundle change likely requires)
- [ ] AC15 — `npm run build` clean; full test suite passes; new SW-lifecycle + manifest-derivation spec passes

## Subtasks
None (atomic task — single SW-lifecycle pass + banner-interaction update).

## QA Audit & User Feedback
- 2026-06-03: PO directs T179 stand-up — recurring stale-cache class of issues; "Tron never manually clears again." Architect designs SW lifecycle (skipWaiting/claim/cache-purge + banner interaction); expert implements; tester proves auto-takeover on 2nd load.
- 2026-06-03: PO surfaced ROOT CAUSE of "all routes broken except /" — `sw.js:42` falls back to `cache.add('/dist/app.js').catch(() => {})`. Real bundle is hashed (`app-PMIKRTJL.js`); `/dist/app.js` returns 404; SW caches the 404; `/` works (no `app.js` dep); every other route breaks. PO folds the STATIC_SHELL build-manifest fix into T179 (same surface, one rule-pair cycle).
- 2026-06-03: PO also surfaced a STRICT-VERIFY-BAR GAP — tester tested WITHOUT SW installed → false clean. Strict bar (in `scrum.pmo/standards/traceability-standard.md`) now extended to require SW-ACTIVE route verification for SW-touching tasks. T179 AC11 captures the rule.
- 2026-06-03: Expert `80ed9911` v0.5.78 ships T179 — sw.js (SKIP_WAITING postMessage handler L27-29 + activate-time old-cache purge L46-47 + `clients.claim` L50) + build.mjs auto-injects ALL hashed bundle names (app + trace-page + scenario-view) into STATIC_SHELL; removed the `cache.add('/dist/app.js').catch(() => {})` fallback that cached the 404. Rule-pair (a)+(b)+(c) ✓ verified. 836/836 pass. Planner-first inverted but converged (expert shipped while planner finalizing 15-AC spec).
- 2026-06-03: Planner verified expert's commit against the 15-AC spec: skipWaiting present, caches.delete-old present, clients.claim present, build.mjs auto-injection confirmed, rule-pair verified — all 10 impl-side ACs (AC1-10) satisfied by code.
- 2026-06-03: PO direction — **one-time transition caveat:** Tron's CURRENT pre-v0.5.78 SW lacks SKIP_WAITING handler → ONE LAST manual clear gets him to v0.5.78; thereafter every update auto-activates without manual intervention.
- Pending: tester **SW-ACTIVE** verify per strict-bar (2b) — AC11 (register SW → await activated → reload → assert with SW active), AC12 (2nd-load auto-takeover post-v0.5.78), AC13 (existing tabs receive SW control on next paint), AC10 (Tron repro: ZERO 404s for app.js with SW active); then Tron QA closes the recurring stale-cache root.

---

**Sprint:** Sprint 17 — Scenario Units
**Phase:** 35 — R-S (SW auto-activation reliability — recurring stale-cache root fix)
**Follows:** Rule-pair (b) standing rule (CACHE_NAME bump per ship)
**Unblocks:** Removes the class of "looks fixed but Tron still sees old version" bugs
**Rule-pair scope:** (a)+(b) required; (c) STATIC_SHELL likely required (banner-component change) — architect declares in refinement.
