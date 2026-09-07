<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.29: Diagram background-drag pans the viewport wi

[task:uuid:e7fe421d-0c1a-400a-8c8e-bdcaecc14c64]

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

Deliver + verify requirement R40.29 (Diagram background-drag pans the viewport wi). Retroactive task unit minted scenario-first from the existing requirement (#126 gap: the req existed, its Task unit was never minted). Covers R40.29; status derived from reality, staged by planner.

## Acceptance Criteria

- [ ] **(mouse-bg-pan)** Dragging the diagram BACKGROUND with a MOUSE pans the viewport.
- [ ] **(no-reverse-regression)** The existing TOUCH pan continues to work UNCHANGED — this is PARITY, not replacement (no reverse regression).
- [ ] **(no-hijack)** Background-drag does NOT hijack node drag / selection / text-selection — panning only on the background, not on a node.
- [ ] **(gate-asserts-result)** ★ The gate asserts the RESULT — the viewport POSITION actually CHANGED after a mouse drag — NOT that a listener/handler exists. A bound listener that moves nothing is the empty-container class.
- [ ] **(split-verify)** Desktop-MOUSE half = AUTOMATABLE-gated (viewport moved on mouse drag); the TOUCH half stays DEVICE-VERIFIED (real device).
- [ ] **(by-construction-pointer-events)** ★ BY-CONSTRUCTION: unify on POINTER events (pointerdown/pointermove/pointerup) — ONE handler covering mouse + touch + pen. Do NOT add a parallel mouse handler beside the touch one: two input paths for one behaviour is the two-sources disease and they WILL drift (one gets a fix the other does not — which is exactly how the finger/mouse gap arose). Also check whether this belongs to the EXISTING RbPanZoom component rather than a per-view handler (single-source the pan behaviour).

## Subtasks
