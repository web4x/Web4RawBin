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

- [ ] **(invariant)** INVARIANT (Tron: clean releases, NO hard reloads): a version bump MUST auto-propagate to EVERY running client; a manual HARD-RELOAD must NEVER be required to receive the new version. A running client that only updates after a manual hard-reload is a HARD FAIL.
- [ ] **(network)** ROOT-CAUSE FIX (architect-measured): the SW fetch handler serves the app SHELL (index.html) + bundles NETWORK-FIRST - fetch fresh, fall back to cache ONLY when offline. The prior CACHE-FIRST shell served a STALE shell+bundle until a manual hard-reload and DEFEATED pollForWorkerUpdate + claimClients (they swapped the SW, but the cache-first shell kept serving the old bundle). Network-first is the missing piece that makes a deploy actually reach the running client.
- [ ] **(poll)** CONTINUOUS version poll: ServiceWorker.pollForWorkerUpdate periodically (setInterval ~60s + on visibilitychange/focus) reg.update() + /api/config version compare - detects a deploy without a navigation/hard-refresh.
- [ ] **(banner)** One-click 'New version - reload' banner is the auto-pickup UX (no surprise auto-reload mid-edit, never nuke unsaved merge state); ServiceWorker.claimClients (skipWaiting + clients.claim in the sw.js activate) gives reliable takeover so the pending version applies on the one tap.
- [ ] **(atomic)** ATOMIC deploy: sw.js + shell + bundles + the /api/config version flip land TOGETHER (R30.28, served==committed==HEAD) so a running client never fetches a MISMATCHED shell / bundle / version during the swap.
- [ ] **(gate)** GATE (verified on a REAL long-open running client, NOT a fresh navigation): deploy a new version -> the left-open client picks it up within <=60s with NO manual hard-reload (network-first shell serves the fresh bundle + poll detects + one-click banner) and then reports the new version. Confirm across a deploy; version-confirm/screenshot, NEVER DOM/element-count.

## Implementation

DONE 2026-07-14 (PO shipped/git-state): v0.7.25 gated 77/348. | RE-OPENED Done->QA-REVIEW (2026-07-18, clean-release CLEAN-RELEASE work past the original Done = served==gated pattern). R30.14 clean-release gated PASS: gate 9fd8ddbec v0.7.50 (deterministic v1->v2 mechanism + network-first shell present in LIVE sw.js + poll<=60s + served==committed==HEAD, verified on a REAL left-open client 2-deploy test); expert live-caught 0.7.49->0.7.50. CLEAN-RELEASE CHAIN (extends R30.14): UC serviceWorker.networkFirstShell a5dd44bc -> Method ServiceWorker.navigationStrategy f819f252 -> Impl 769bc9bc (designAhead=TRUE, expert PLACING marker) -> Test (tester WIRING). ⚠ NOT chain-complete yet (Impl marker + Test pending) — QA-Review reflects gate-GREEN + chain-completing. AWAITING Tron real-world confirm (his v0.7.48 client needs ONE bootstrap reload then auto forever, proven). On marker+Test land + Tron confirm -> DONE. | CHAIN-COMPLETE (2026-07-18): Test 7c2e9b41 'R30.14 ServiceWorker.navigationStrategy' status=pass wired onto Impl 769bc9bc (marker placed, designAhead->false); check-x5. Still QA-Review AWAITING Tron real-world bootstrap-reload confirm (v0.7.48 client: ONE reload then auto forever). On Tron confirm -> DONE.

## Subtasks

None (atomic task).
