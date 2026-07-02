<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 27.8: Detail drawer regression — X closes + minimized-on-open

[task:uuid:19700836-caa1-49c6-8dce-38ad832241eb]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [x] Done

## Traceability

  - up
    - [Sprint 27 Planning](./planning.md)
    - Requirement R27.8 `[requirement:uuid:a5da3f93-0341-4856-90eb-bb25954c72a2]`
  - crossRef
    - R25.4 (detail drawer grab-bar)
  - down
    - [UC: drawer.regressionFix](./planning.md) `[uc:uuid:3b6e58e3-f38b-4f88-9566-81c6be3e3a7b]`

## Task Description

Restore the detail drawer regression: X (top-right) CLOSES/collapses the drawer; the drawer opens MINIMIZED on first call (not expanded/empty); the pre-regression grab-bar/minimize behavior is restored (ties R25.4 drawer grab-bar).

## Context

Covers R27.8 drawer-regression (req a5da3f93, moved S30->S27 by req). crossRef R25.4 (drawer grab-bar). Set as pin nextBacklog per PO/Tron.

## Intention

Tron: drawer regression fix. Moved from S30->S27 (it's a regression of S27's drawer work) + set as the pin nextBacklog.

## Acceptance Criteria

- [x] (drawer) The detail drawer CLOSES/collapses when the X (top-right) is clicked - currently it does NOT.
- [x] (drawer) The drawer opens MINIMIZED on first call (not expanded/empty).
- [x] (drawer) The pre-regression grab-bar / minimize behavior is restored (ties R25.4 drawer grab-bar + X-minimize).

## Implementation

STOOD UP (planning) — status Planned; the pin's nextBacklog. Chain-build awaits architect UC-wire. ✓ DONE 2026-07-02 (PO): R27.8 GREEN DET-3x (038310a71 r278-drawer-close-minimize-gate.mjs — X closes/open-minimized/grab-bar+ESC+pan-zoom, 0 pollution). ⚠ chain-to-Test was INCOMPLETE (Impl e42b85e8 closeAndMinimize had 0 Test despite the GREEN gate) — I minted+wired the r278 Test unit fc9ed257 under e42b85e8 -> chain complete. behavior-live + gated. [test:uuid] marker on r278 file pending tester (scoreboard credit, like R27.3).

## Subtasks

None (atomic task).
