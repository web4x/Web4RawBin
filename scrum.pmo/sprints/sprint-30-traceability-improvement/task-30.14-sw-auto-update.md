<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.14: Service-Worker auto-update (visible deploys)

[task:uuid:e4dc9a19-1029-44b0-b892-49166a86c80c]

## Status
- [x] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
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

- [ ] (detect) ServiceWorker.pollForWorkerUpdate: while the app is open, periodically (setInterval ~60s + on visibilitychange-visible / focus, debounced) calls registration.update() AND re-runs the /api/config version compare -> a new deploy triggers updatefound / the version-mismatch -> the EXISTING banner, WITHOUT a hard-refresh.
- [ ] (takeover) ServiceWorker.claimClients: the sw.js activate handler calls self.clients.claim() (after old-cache cleanup) so the newly-activated SW controls open pages -> the existing controllerchange -> location.reload() fires (with the existing SKIP_WAITING = reliable takeover).
- [ ] (reuse) The existing flow is reused UNCHANGED (markers stay): registerServiceWorker updatefound wiring, showBanner + SKIP_WAITING post, controllerchange->reload, the sw.js SKIP_WAITING handler; checkForUpdate re-scoped to be callable periodically (impl-edit); ignoreSearchNav/flushAndReload untouched.
- [ ] (ux) Primary UX = the existing one-tap banner ('New version - reload') — no surprise reload mid-edit. (Auto-reload-on-idle is a flagged nice-to-have follow-up, NOT in this scope.)
- [ ] (verify) Tron deploy-visibility re-check: after a deploy, the banner appears within the poll interval WITHOUT a hard-refresh; DET-3x on the poll/claim behavior.

## Implementation

STOOD UP (planning) — status Planned; was requirement-only, minted for #126 traceability. Status to be advanced per PO/architect hop-signals (some R30.1x may already be shipped/gated — verify).

## Subtasks

None (atomic task).
