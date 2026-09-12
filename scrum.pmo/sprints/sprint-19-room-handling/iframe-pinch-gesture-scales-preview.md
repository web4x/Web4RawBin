<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# T-iframe-pinch-scale: a pinch gesture inside the preview iframe must SCALE the pre

[task:uuid:1cbad4ef-1428-4594-9a48-b7892ab36f48]

## Status
- [x] Planned
- [ ] In Progress
  - [ ] refinement (architect)
  - [ ] creating test cases
  - [x] implementing (expert — in flight)
  - [ ] testing (tester)
- [ ] QA Review
- [ ] Done

## Task Description

R19.85 fix: a pinch gesture inside the preview iframe must SCALE the preview content (zoom), not the page. Expert fix in flight. Singular-chain: ONE UseCase per Task; ONE Method per UseCase (learning #27).

## Acceptance Criteria

- [ ] **(gesture/scale)** A 2-finger pinch SCALES the preview content (CSS transform scale via RbPanZoom clamp+apply) — NOT just translate. This is the R19.85 bug fix: pinch=SCALE, pan is a separate gesture.
- [ ] **(architecture/single-path)** ALL preview surfaces use the ONE shared RbPanZoom via content-preview.ts fillPreviewPane — the @400px iframe pinch-zoom path is RETIRED (R21.9/v0.6.74). No per-surface bespoke pinch handler.
- [ ] **(gesture/bounds)** Zoom bounds (measured, corrects the stale 0.25-4x): MAX=8; non-grow MIN=0.25; grow-mode floor GROW_MIN=0.02 — repeated zoom-out grows the working canvas (R33.7.1 INV-Z1), bounded by the host MAX-CANVAS-PX cap, not a hard 0.25 floor.
- [ ] **(gesture/coexist)** Single-finger drag PANS at all scales and coexists with pinch-scale; no snap-back on release; double-tap resets/zooms to 2x.
- [ ] **(verify/device-physics)** A REAL 2-finger PINCH on a touch device is the ONE remaining un-mockable check. Headless is INCONCLUSIVE — synthetic touch events cannot reproduce true multi-touch physics. This is a Tron-DEVICE physics limit, NOT an unmocked coverage gap.

## Subtasks
