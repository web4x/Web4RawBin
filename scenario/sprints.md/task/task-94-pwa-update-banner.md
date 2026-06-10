# T94: PWA Update Banner Not Appearing (PRIORITY)
[task:uuid:428edbf7-ae00-4979-a3b7-3e32eecdc496]

## Status

- [x] Planned
- [x] In Progress
  - [x] refinement (architect)
  - [x] implementing (expert)
  - [x] testing (tester)
- [ ] QA Review
- [ ] Done

## Traceability

**UseCases:**
- [🔗 pwa.updateBanner](../usecase/pwa-updatebanner.md)


## Traceability

- up
  - [requirement:uuid:5b6122fe-75f1-4a33-9b2f-63fcaeb4323f](./requirements.md) — R-V1: Update bar must appear
  - [Sprint 13 Planning](./planning.md)
  - Sprint 5 T33 (auto-reconnect), Sprint 5 T35 (iOS PWA), Sprint 7 v0.2.6 PWA cache review
- down
  - None (atomic task)
- chain
  - **requirement:** R-V1 in [requirements.md](./requirements.md)
  - **class/method:** `app.ts` checkForUpdate() + showUpdateBanner() + SW registration, `sw.js` CACHE_NAME + install/activate, `server.ts` GET /api/config (version), `build.mjs` (CACHE_NAME stamp)

## Task Description

**Bug:** The version update banner no longer appears when a new version is deployed. The banner was working as of v0.2.6 (Sprint 5 review confirmed the flow).

**The update flow (designed in Sprint 5, reviewed in v0.2.6):**
1. `build.mjs` stamps `CACHE_NAME = 'rawbin-v<version>'` in sw.js from package.json
2. Browser detects new sw.js (because sw.js is served no-cache) → SW install fires
3. New SW install → `SKIP_WAITING` only via message handler (not unconditional — fixed in v0.2.6)
4. `app.ts checkForUpdate()` fetches `/api/config` → compares version with `localStorage rawbin-version`
5. Version mismatch → `showUpdateBanner()` → user clicks "Update Now" → `reg.waiting.postMessage('SKIP_WAITING')` → controllerchange → reload

**Investigation needed by architect — check each link in the chain:**
1. Is `sw.js` being served with `no-cache`? (Was fixed in v0.2.6 — may have regressed)
2. Does the browser detect sw.js changes? (Check: `reg.addEventListener('updatefound')` in app.ts)
3. Does `/api/config` return the current version? (Check PKG_VERSION reading)
4. Is `localStorage rawbin-version` being set correctly? (First visit sets it — subsequent visits compare)
5. Is `checkForUpdate()` being called? (It's at the bottom of app.ts — does it run?)
6. iOS Safari PWA: does the SW update check fire in standalone mode? (iOS has known limitations)
7. Is `<rb-update-banner>` present in the DOM on all pages?

## Acceptance Criteria

- [x] AC1: Deploying a new version (package.json bump + build) → update banner appears on next visit
- [x] AC2: Clicking "Update Now" reloads with the new version
- [x] AC3: `/api/config` returns the current package.json version
- [x] AC4: sw.js served with `Cache-Control: no-cache, must-revalidate`
- [~] AC5: Works on iOS Safari standalone (PWA installed on home screen) — NOT testable in headless Chromium; defer to Tron's iPhone QA
- [x] AC6: Works on desktop Chrome/Firefox
- [x] AC7: Banner appears on ALL pages (/app, /profile, /bug-report, /edit) not just /app

## QA Audit & User Feedback

- 2026-05-26: Tron directive — "i did also not see the version update bar any more." CRITICAL: may indicate SW serving stale code; architect audits update path end-to-end before fix. Awaiting refinement, then Tron QA.

## Subtasks

None (atomic task).
