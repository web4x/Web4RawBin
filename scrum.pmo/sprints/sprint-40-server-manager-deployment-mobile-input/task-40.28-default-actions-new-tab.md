<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.28: Default actions Scenario + Edit ALWAYS open in a new tab (every surface the universalActionBar composes on), never navigate the current tab

[task:uuid:9f11a990-79bd-46e4-95e2-abe066f4b95b]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [ ] Done

## Remaining Issues

QA-Review (units-win; planner disk-verified BOTH directions, PO GO 2026-08-11): AC-6 chain-complete-to-Test — Impl 7557bd7c (RbDetailDrawer.onUniversalAction new-tab increment, markerPending=false) tests[]=[501f17ad] <-> Test 501f17ad.implementations[]=[7557bd7c] status=pass, GREEN DET-3x @390 real-WebKit served==0.8.84==HEAD, two-key 8eb8df077 on origin. DISTINCT 3rd increment on shared onUniversalAction (R30.11 no-re-credit, NOT re-crediting R34.1 005dbd3e). AC-7 = DEVICE-ONLY iOS sync-gesture (Tron real device, never headless-green). Done-gate [ ] = Tron (R40.10 approve-control).

## Traceability

  - up
    - [Sprint 40 Planning](./planning.md)
    - Requirement R40.28 `[requirement:uuid:cb9c222e-c61f-4396-96e5-d782c704e022]`
  - down
    - None (atomic task)

## Task Description

R40.28 (Tron device 2026-08-11: 'make sure the default action scenario edit always opens in a new tab'). The A1 DEFAULT actions Scenario and Edit — the two the universalActionBar composes on ALL usages — must ALWAYS open in a NEW TAB (never navigate the current one) from EVERY surface the bar appears on (trace/model/room/task detail/drawer); losing his place on a phone is the pain. Reuse the shared onUniversalAction handler (RbDetailDrawer), distinct 3rd increment, NO fork. Scenario-first: req mints R40.28 + ACs; architect chain shape; expert implements the increment; tester gates AC-6 @390 real-WebKit (AC-7 device-only Tron).

## Acceptance Criteria

- [ ] **(new-tab)** The A1 'Scenario' default action opens the scenario in a NEW TAB.
- [ ] **(new-tab)** The A1 'Edit' default action opens the editor in a NEW TAB.
- [ ] **(always-every-surface)** ★ 'ALWAYS' = from EVERY surface the universalActionBar is composed on (trace / model / room / task detail / drawer), not just the one currently in view. The word 'always' is part of the requirement — a per-surface exception is a defect.
- [ ] **(current-tab-preserved)** The CURRENT tab is NOT navigated away — the user keeps his place (losing context on a phone is the actual pain being fixed).
- [ ] **(no-reverse-regression)** The OTHER actions' behaviour is unchanged (no reverse regression).
- [ ] **(device-gate-result)** Device-gated @390 real-WebKit (iOS-parity, NOT chromium-emulation) asserting a NEW browsing context ACTUALLY OPENED — detected via the page/popup EVENT, NOT target=_blank-in-DOM (in-DOM != opened = the empty-container false-green). ★ AUTO-GATE-ABLE half (tester prove-the-prover: real sync tap fires a context 3/3).
- [ ] **(device-only-390)** ★ DEVICE-ONLY (real iOS Safari @390, Tron-verified, NEVER headless-green): the new-tab open MUST be SYNCHRONOUS in the tap/user-gesture handler (no await/fetch/resolve before window.open; open the tab first then point it). iOS Safari silently popup-blocks a non-sync open — the tab never appears, invisibly. ⚠ HEADLESS CANNOT VERIFY THIS (measured, tester prove-the-prover): headless Playwright-WebKit does NOT enforce the sync-gesture popup rule — an async-timeout AND async-promise open ALSO fire a context, so auto-gating AC-7 would FALSE-GREEN a broken async open. Therefore AC-7 is verified ONLY on Tron's real device; AC-6 (a context actually opens) is the auto-gate-able half. Do NOT headless-green AC-7 (R22.2 device-only precedent).

## Subtasks

None (atomic task).
