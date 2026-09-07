<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.42: Diagram has ONE scroll/pan authority — no ne

[task:uuid:2b7356ac-eb0f-4a6b-8082-142a96abed2b]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Task Description

Deliver + verify requirement R40.42 (Diagram has ONE scroll/pan authority — no ne). Retroactive task unit minted scenario-first from the existing requirement (#126 gap: the req existed, its Task unit was never minted). Covers R40.42; status derived from reality, staged by planner.

## Acceptance Criteria

- [ ] **(structural)** The diagram has EXACTLY ONE scroll/pan authority = the RbPanZoom surface; NO nested scroll container competes for the gesture and NO inner diagram scrollbar is visible at all (the inner ~99pct scrollbar is removed, not merely hidden — by construction, e.g. overflow handled by the pan-transform not a scroll container). A grep/DOM check PROVES no second scrollable element inside the diagram viewport.
- [ ] **(functional)** Drag-pan moves BOTH axes: dragging the diagram background changes the pan position UP/DOWN as well as LEFT/RIGHT (the current vertical-dead defect is fixed — the gesture reaches the one authority, not a 99pct inner container).
- [ ] **(functional)** Wheel behaviour is DEFINED and CONSISTENT — the architect analysis STATES which (zoom vs scroll-pan) and it is the same everywhere; NOT left ambiguous. Whichever is chosen, a gate asserts it (no accidental nested-scroll capture of the wheel).
- [ ] **(functional)** @390 AUTOMATABLE (headless real-WebKit): a pointer drag-pan on the diagram moves BOTH axes and the page does not scroll; no nested scrollbar present. (The physical two-finger/pinch is split to the device AC below.)
- [ ] **(device)** [DEVICE-ONLY @390 pixel — Tron on phone, un-mockable, NEVER headless-green, TRON-ONLY] On real iOS: two-finger pan moves the diagram BOTH axes and pinch zooms, as ONE consistent gesture surface (real-WebKit vs Chromium emulation caveat — a synthetic gesture can false-green; Tron's device verify). The 'consistent UX feeling' Tron asked for is confirmed on-device.
- [ ] **(functional)** No page-scroll leakage while interacting with the diagram (crossRef R33.6.2 — may be phase-2 of it): panning/zooming the diagram never scrolls the surrounding page/drawer. GATE (stub-must-fail): a planted nested scroll container OR a vertical-pan-dead state OR page-scroll-during-diagram-interaction -> RED.

## Subtasks
