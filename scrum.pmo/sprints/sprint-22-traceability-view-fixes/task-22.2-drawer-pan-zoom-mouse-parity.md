<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 22.2: Drawer pan/zoom — full mouse parity (touch-first)

[task:uuid:fe78d550-ba22-4c4b-b80b-e1011ce0a1ba]

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
    - [Sprint 22 Planning](./planning.md)
    - Requirement R22.2 `[requirement:uuid:b7000fa1-01d6-4757-a211-b24051eea7eb]`
  - down
    - [UC-VF.2: drawer.panZoomMouseParity](./planning.md#uc-vf2) `[uc:uuid:ada54a0e-0eef-4f16-a393-8c30c6bdd06d]`

## Task Description

The drawer pan/zoom is touch-first (touch is the primary design surface) but MUST work identically with a mouse: mouse-drag pans (mirrors 1-finger pan), scroll-wheel zooms toward the pointer (mirrors pinch-zoom), and double-click resets/toggles (mirrors double-tap). Mouse mirrors the touch behaviour exactly.

## Context

Traceability browser detail drawer. Touch gestures were complete; mouse-drag/scroll-wheel/double-click parity was the gap (architect-measured: dblclick → double-tap toggle was the single missing path).

## Intention

Tron: "the drawer works well on touch and it shall be touch first, but it shall also work the same way with mouse."

## Acceptance Criteria

- [x] Touch remains the primary surface: 1-finger drag pans, pinch zooms, double-tap resets/toggles (unchanged)
- [x] Mouse-drag pans the drawer content, identical to 1-finger pan
- [x] Scroll-wheel zooms the drawer content, identical to pinch-zoom (zoom toward the pointer)
- [x] Double-click resets/toggles the zoom, identical to double-tap
- [x] Behaviour is identical across input types (no mouse-only or touch-only divergence)
- [x] Verified live (headless) — tester RED→GREEN v0.6.75→v0.6.76 (RED baseline cb8d3eceb; impl 073378b7d); GREEN DET-3x

## Implementation

 ✓ TRON-ACCEPTED 2026-07-01 (Tron QA review pass) -> DONE (full-AC).

## Subtasks

None (atomic task).
