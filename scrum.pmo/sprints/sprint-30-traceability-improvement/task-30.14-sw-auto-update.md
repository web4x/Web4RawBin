<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.14: Service-Worker auto-update (visible deploys)

[task:uuid:e4dc9a19-1029-44b0-b892-49166a86c80c]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [ ] Done

## Traceability

  - up
    - [Sprint 30 Planning](./planning.md)
    - Requirement R30.14 `[requirement:uuid:76512c5f-3e87-4e4f-99aa-113312458e07]`
  - down
    - [UC](./planning.md) `[uc:uuid:ba7b15ab-c785-4c94-a8fe-936016b0023c]`

## Task Description

Service-Worker auto-update so a new deploy is visible without a manual hard-reload: SW detects a new version and refreshes the app.

## Context

Covers R30.14 (76512c5f). Class RbDiffEditor.

## Intention

S30 diff/merge editor completion (R30.14). Minted for #126 traceability (was requirement-only).

## Acceptance Criteria

- [x] (detect) ServiceWorker.pollForWorkerUpdate: while the app is open, periodically (setInterval ~60s + on visibilitychange-visible / focus, debounced) calls registration.update() AND re-runs the /api/config version compare -> a new deploy triggers updatefound / the version-mismatch -> the EXISTING banner, WITHOUT a hard-refresh.
- [x] (takeover) ServiceWorker.claimClients: the sw.js activate handler calls self.clients.claim() (after old-cache cleanup) so the newly-activated SW controls open pages -> the existing controllerchange -> location.reload() fires (with the existing SKIP_WAITING = reliable takeover).
- [x] (reuse) The existing flow is reused UNCHANGED (markers stay): registerServiceWorker updatefound wiring, showBanner + SKIP_WAITING post, controllerchange->reload, the sw.js SKIP_WAITING handler; checkForUpdate re-scoped to be callable periodically (impl-edit); ignoreSearchNav/flushAndReload untouched.
- [x] (ux) Primary UX = the existing one-tap banner ('New version - reload') — no surprise reload mid-edit. (Auto-reload-on-idle is a flagged nice-to-have follow-up, NOT in this scope.)
- [x] (verify) Tron deploy-visibility re-check: after a deploy, the banner appears within the poll interval WITHOUT a hard-refresh; DET-3x on the poll/claim behavior.

## Implementation

DONE 2026-07-14 (PO shipped/git-state): v0.7.25 gated 77/348. | RE-OPENED Done->QA-REVIEW (2026-07-18, clean-release CLEAN-RELEASE work past the original Done = served==gated pattern). R30.14 clean-release gated PASS: gate 9fd8ddbec v0.7.50 (deterministic v1->v2 mechanism + network-first shell present in LIVE sw.js + poll<=60s + served==committed==HEAD, verified on a REAL left-open client 2-deploy test); expert live-caught 0.7.49->0.7.50. CLEAN-RELEASE CHAIN (extends R30.14): UC serviceWorker.networkFirstShell a5dd44bc -> Method ServiceWorker.navigationStrategy f819f252 -> Impl 769bc9bc (designAhead=TRUE, expert PLACING marker) -> Test (tester WIRING). ⚠ NOT chain-complete yet (Impl marker + Test pending) — QA-Review reflects gate-GREEN + chain-completing. AWAITING Tron real-world confirm (his v0.7.48 client needs ONE bootstrap reload then auto forever, proven). On marker+Test land + Tron confirm -> DONE.

## Subtasks

None (atomic task).
