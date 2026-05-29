[Back to Sprint 13 Planning](./planning.md)

# T94: PWA Update Banner Not Appearing (PRIORITY)

[task:uuid:428edbf7-ae00-4979-a3b7-3e32eecdc496]

## Tron Requirement (literal)

> TRON DIRECTIVE: "i did also not see the version update bar any more."

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement (architect)
  - [x] implementing (expert)
  - [x] testing (tester)
- [ ] QA Review
- [ ] Done

## Implementation (robbin-expert, 2026-05-26, v0.5.4)
Design hardening (removes recurrence of the frozen-version bug; the operational fix = restart, already done across the deploys this session):
- **Per-request version (server.ts):** added `getVersion()` that reads `package.json` per request (falls back to the module-load `PKG_VERSION` on error). `/api/config` (line ~380) and `/api/health` (~387) now call `getVersion()` instead of the frozen `PKG_VERSION`. Drives AC1/AC3/UC-PV9 — `/api/config.version` always equals the on-disk/deployed version even if the node process isn't restarted.
  - WHY this is the real fix: `npm run dev` = `tsx watch src/ts/server/server.ts` — it only restarts when **server.ts** changes. A version-only `package.json` bump + client rebuild does NOT touch server.ts → process keeps serving the frozen startup version → device sees no version change → banner never fires. Per-request read closes that gap.
- **AC7 (banner on all pages):** VERIFIED already satisfied — `pageHead()` (server.ts:262) injects `<rb-update-banner>` + the banner script, and `/profile`, `/bug-report`, `/docs`, `/md` all render via `pageHead()`. `/app` + `/edit` load it via their bundles. No change needed.
- **AC4 (sw.js no-cache):** confirmed held (architect verified). **AC2 (Update Now reloads):** unchanged SW message path.
- v0.5.4, sw.js cache rawbin-v0.5.4, tsc + build clean. Server-only.

## Diagram
[pwa-update-workflow.svg](./diagrams/pwa-update-workflow.svg) ([source](./diagrams/pwa-update-workflow.puml)) — UC-PV2 (restart) + UC-PV3 (live version, not frozen) + UC-PV9 (no-stale guard) are the T94 targets.

## Root-Cause Findings (robbin-architect, 2026-05-26 — CONFIRMED, matches Tron/PO hypothesis)

**Root cause: stale server PROCESS — the version is frozen at startup.**

`server.ts:25`: `const PKG_VERSION = JSON.parse(readFileSync(package.json)).version` is read ONCE at module load. `/api/config` (line 357) and `/api/health` (line 364) return this frozen value forever.

Failure chain:
- Restarts deferred through v0.4.8/9/10 → the live process froze `PKG_VERSION` at ~v0.4.7.
- Builds wrote new hashed bundles + stamped `sw.js` CACHE_NAME `rawbin-v0.4.10` to disk.
- But `/api/config` still returns 0.4.7. The device stored `localStorage['rawbin-version']=0.4.7`; `checkForUpdate` (rb-update-banner.ts:38) compares 0.4.7 vs 0.4.7 → equal → **the version bar never fires** even though disk has newer code.
- Note: this is the `checkForUpdate` (version-check) path. The SW-update path (updatefound) is separate and produces a version-less banner; the missing "vX available" bar is specifically the version-check path broken by the stale version.

**This explains why every recent fix is invisible to Tron** — the device's update detection can't see them.

**Other chain links — verified OK (not the cause):** sw.js IS served no-cache (T-fix held); skipWaiting is message-only (v0.2.6 fix held); `<rb-update-banner>` is prepended on /app and /edit (app.ts:89, edit.ts:13).

**Fix direction:**
1. **OPERATIONAL (immediate, OPS/Tron owns the process):** clean server restart → `PKG_VERSION` re-reads 0.4.10 → device mismatch → bar fires → Update Now → new code. Verify: `curl -k https://localhost:4444/api/config` reports `version: 0.4.10` (currently 0.4.7).
2. **DESIGN HARDENING (drives AC1/AC3, removes recurrence):** stop freezing. In the `/api/config` + `/api/health` handlers, read the version per-request (inline `readFileSync(package.json)`, tiny file) OR derive from `build-manifest.json` (rewritten every build). Then `/api/config.version` always equals the served bundle without a restart (UC-PV9).
3. AC7 (banner on ALL pages): /profile + /bug-report are server-rendered inline HTML — confirm `<rb-update-banner>` is injected there too (currently only the bundled /app + /edit load it). If not, add the banner script to those server-rendered pages.

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

## PRIORITY FLAG

**This may mean Tron's device is not receiving updates at all.** If the update banner doesn't appear, the SW may be serving stale code indefinitely. Every bug fix we ship is invisible to Tron until this is resolved.

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

## Test Results (robbin-tester, 2026-05-26) — PASS (AC1-AC4,AC6,AC7; AC5 = device QA)
Mechanism (code review): `getVersion()` (server.ts:31-34) reads `package.json` per request (falls
back to `PKG_VERSION` only on error); `/api/config` (383) + `/api/health` (390) call it — so a
version-only bump (which `tsx watch` does NOT reload, since it watches server.ts) is reported
without a process restart. This closes the frozen-version root cause.

curl (live v0.5.4):
- AC3: `/api/config.version` == `/api/health.version` == package.json (0.5.4) ✓
- AC4: `GET /sw.js` → `Cache-Control: no-cache, must-revalidate` ✓
- AC7 (server-rendered): `/profile` + `/bug-report` HTML each contain `rb-update-banner` ✓

Browser — `test/e2e/update-banner.spec.ts` (3/3 PASS, 11.0s, desktop Chromium):
| AC | Check | Result |
|----|-------|--------|
| AC7 | `rb-update-banner` element present on `/app` and `/edit/README.md` (bundle-loaded) | PASS ✓ |
| AC1/AC6 | seed `localStorage.rawbin-version='0.0.1'` → reload → `checkForUpdate` (/api/config 0.5.4 vs 0.0.1) → shadow `#update-now` "Update Now" shows | PASS ✓ |
| AC2 | click `#update-now` → stores live version in `rawbin-version` + reloads → banner gone (no mismatch) | PASS ✓ |
- AC5 (iOS Safari standalone) cannot run in headless Chromium — Tron's iPhone QA covers it.
- No regression: full Playwright suite was 21/21 (T80); this session adds editor-back(4) + lobby-card(1) + multi-room(4) + contacts-ui(6) + update-banner(3) = 18 new E2E.

## QA Audit & User Feedback
- 2026-05-26: Tron directive — "i did also not see the version update bar any more." CRITICAL: may indicate SW serving stale code; architect audits update path end-to-end before fix. Awaiting refinement, then Tron QA.

## Subtasks
None (atomic task).
