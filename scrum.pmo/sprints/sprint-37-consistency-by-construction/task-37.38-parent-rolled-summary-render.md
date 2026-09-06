<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.38: Coordination-root parent renders a ROLLED summary of children (weakest-link + per-child mini-state), not its empty checklist [R37.35, AXIS-3 RENDER-half]

[task:uuid:22560ea2-316c-4bc7-b89e-985b85de4edc]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

STOOD UP Planned (2026-09-06) on req R37.35 8a06ba80 = AXIS-3 RENDER-half. OWNER=EXPERT. queuePriority=LOW/ENHANCEMENT — BELOW resolver-half (T37.20.1) + the SLICE-A ship-gate; the leaf-pin already shows real state (6e3b320c6), so this is polish not a blocker. Pairs T37.36 (lint half, tester). useCases=[] — req wires on 3-pt verify (their lane). Seeds the 'no state at all' defect as a RED. 0 Done till Tron.

## Task Description

The RENDER half of the AXIS-3 family (T37.36 993b3f2d = the LINT half, tester-owned; this = the render, EXPERT-owned; crossRef-linked = ONE concern, 2 owner-appropriate reqs). Fixes the exact Tron defect 'why is there no state of the current task AT ALL': a coordination-root parent pin (e.g. T37.20 with 6 slice children) renders its own empty stored checklist because the rollup is status-ENUM-only (render-time, weakest-link, never persisted) with NO rolled-CHECKLIST render. This task adds the rolled-summary render. NEVER hand-persist the rolled value (standing law — a rolled value is a RENDER, persisting fabricates a 2nd source). OWNER = EXPERT.

## Context

Covers R37.35 8a06ba80 (AXIS-3 RENDER-half sibling of R37.34 LINT-half). crossRef R40.1-CR4 18ebe066 (rollup status-enum derivation this renders), T37.36 993b3f2d (lint pairing), R37.12 view-bus (live re-render), R40.18 pin. parent S37 b86b53cc.

## Intention

A coordination-root parent shows its real rolled state (weakest-link + per-child mini-state) live, never a blank checklist while children carry state.

## Acceptance Criteria

- [ ] AC-parent-renders-rolled-summary: a coordination-root parent pin/detail RENDERS a rolled summary of its children — (a) weakest-link status (the parent's derived-status enum, R40.1 CR-4) AND (b) a per-child mini-state list — NOT its own empty stored checklist.
- [ ] AC-no-blank-parent-with-stateful-children (failable 1->0): a coordination-root parent NEVER renders 'no state at all' while any child carries state (the exact Tron defect); seed a parent with stateful children whose pin renders blank -> RED; render the rolled summary -> GREEN.
- [ ] AC-render-live-via-view-bus: the rolled summary re-renders LIVE when a child's state changes (via the ONE VIEW BUS, R37.12) — no reload; a child advancing updates the parent's rolled render in place.

## Subtasks

None (atomic render task).
