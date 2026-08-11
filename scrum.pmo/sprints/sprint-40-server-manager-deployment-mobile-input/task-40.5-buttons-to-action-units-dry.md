<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.5: Detail/feature-view EXTRA action buttons de-duplicated onto the shared action bar (editor chrome UNCHANGED)

[task:uuid:a10c3329-9249-423a-9643-17efc7bdced9]

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

QA-Review (planner flip 2026-08-11 — ★ THE CAMPAIGN PAYOFF: Tron -> ZERO held verdicts). chain-complete-to-Test DURABLE ON ORIGIN, quad-verified (my both-dir origin measure + PO both-dir + tester + req). ★ BORROWED-CREDIT CORRECTED AT SOURCE (RULE #4): R40.5 now has its OWN distinct-intent chain — UC detailView.assertNoBespokeDuplication 325e2e1b -> Method findBespokeDuplicates ca5b10b4 -> Impl 1beb8fb0 (DetailBespokeActionsGuard dedup lint; sharedByTasks=[a10c3329 ONLY]; markerPending=false; marker @check-detail-bespoke-actions.ts:33) <-> Test 8d1f4a70 (r405-dedup-facet-gate.mjs) status=pass, implementations[]=[1beb8fb0] + ownerIor=1beb8fb0. Does NOT ride the shared ffd44b17 (R34.7's universalActionBar) and does NOT reuse cbdb3210 (R34.7's bar test) — the borrowed credit that held this verdict back is gone. Expert extract behavior-preserving (983d3dfe4), req strict-AST flip (6408a9074), r405 GREEN DET-3x post-extract (46b07e604). verify-owner-first PASSED. ★ This task was REFUSED-to-flip TWICE (cross-credit, then local-only) — both refusals correct; now flips on OWN-earned + DURABLE evidence. AC-DEVICE/VISUAL @390 = Tron. Awaiting Tron QA verdict. 0 Done till Tron.

## Traceability

  - up
    - [Sprint 40 Planning](./planning.md)
    - Requirement R40.5 `[requirement:uuid:e152177d-d016-45eb-a41f-75ffe3dc9a64]`
  - down
    - None (atomic task)

## Task Description

R40.5 (Tron QA v0.8.70, SCOPE-CORRECTED ac147a82d: 'the editor actions can stay the same regarding ux ... but all in-room detail views have additional buttons shall become actions and feature views/details views have additional action buttons that are extra and not DRY'). The DETAIL-VIEW FAMILY (in-room detail views + feature/detail views) accumulated EXTRA bespoke action buttons that DUPLICATE the same logical actions per view (not DRY). Each such additional button becomes an action UNIT on the ONE shared universalActionBar (R35.1). ★ The point is DE-DUPLICATION (no logical action implemented more than once across detail/feature views), NOT uniformity for its own sake. ⛔ OUT OF SCOPE: the EDITOR CHROME keeps its UX EXACTLY as-is (Code/Open-Diff/Save/Files-Editor-Preview-footer/header-Back — Tron is happy with that UX; do NOT migrate/restyle/relocate it). Reuse R35.1 universalActionBar, NO fork. Scenario-first: req mints R40.5 + ACs; architect designs; expert implements; tester gates. (slug kept stable; scope lives in name/desc/ACs.)

## Acceptance Criteria

- [ ] [AUTOMATABLE, source] A GREP-DRIVEN INVENTORY of the ADDITIONAL action buttons across ALL in-room detail views + feature/detail views is produced at build; the EDITOR CHROME (Code/Open-Diff/Save/Files-Editor-Preview-footer/header-Back) is EXPLICITLY EXCLUDED and that exclusion is RECORDED (not silently dropped).
- [ ] [AUTOMATABLE, source] Each IN-SCOPE (detail/feature-view additional) button becomes an action UNIT rendered by the shared universalActionBar (R35.1 mechanism 54acc696/ffd44b17), NOT bespoke per-view markup.
- [ ] [AUTOMATABLE] Per-surface actionSets declared as DATA (config units), not hardcoded.
- [ ] [AUTOMATABLE, source, stub-must-fail] The invariant: NO logical action is implemented more than once across the detail/feature views (DE-DUPLICATION, not uniformity). A grep-zero-bespoke lint SCOPED to the detail/feature-view surfaces ONLY — it must NOT fire on the editor chrome, and it must FAIL if a NEW bespoke detail-view button appears (plant one -> RED).
- [ ] [DEVICE/VISUAL @390 - Tron] The migrated detail/feature-view bars render @390 unchanged-or-better (pixel; Tron final visual, esp. any owner-gated surface a non-owner cannot load).

## Subtasks

None (atomic task).
