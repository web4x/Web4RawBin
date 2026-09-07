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

- [ ] **(touch-device-only)** ★ DEVICE-ONLY (real iOS @390, Tron-verified, NEVER headless-green): touch is the primary surface — 1-finger drag pans, pinch zooms, double-tap resets/toggles. A headless browser SYNTHESIZES touch events and never exercises the real iOS gesture recognizer (no momentum, no passive-listener / touch-action conflict surfacing); this AC cannot be greened headless. Behaviour claim UNCHANGED — only the verification surface is made honest.
- [ ] **(mouse-parity)** Mouse-drag pans the drawer content, identical to 1-finger pan. (Gated HEADLESS @390 — automatable.)
- [ ] **(mouse-parity)** Scroll-wheel zooms the drawer content, identical to pinch-zoom (zoom toward the pointer). (Gated HEADLESS @390 — automatable.)
- [ ] **(mouse-parity)** Double-click resets/toggles the zoom, identical to double-tap. (Gated HEADLESS @390 — automatable.)
- [ ] **(parity)** Behaviour is identical across input types — no mouse-only or touch-only divergence in pan/zoom/reset. The MOUSE side is checkable headless; the mouse↔touch IDENTITY can only be fully confirmed on-device, since the touch half is device-only.
- [ ] **(verify-headless)** Verified live HEADLESS @390 for the MOUSE/pointer surface: mouse-drag pan, scroll-wheel zoom, double-click reset (AC-m1/m2/m3).
- [ ] **(device-only-390)** ★ DEVICE-ONLY: the TOUCH gestures (1-finger pan, pinch-zoom, double-tap — AC-t) verified on real iOS @390 on Tron's device, NEVER headless-green. Headless synthesizes touch and never exercises the real gesture recognizer — so the old single AC-v ('verified headless on both surfaces') was VACUOUSLY GREEN for touch since R22.2 shipped. Corrected to honest device-only per the R40.3/R40.20 template; the requirement is NOT weakened (behaviour unchanged, verification made truthful). Tester audit: test/visual/HEADLESS-ONLY-AC-AUDIT.md.

## Implementation

 ✓ TRON-ACCEPTED 2026-07-01 (Tron QA review pass) -> DONE (full-AC).

## Subtasks

None (atomic task).
