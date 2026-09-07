<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# T21.9: File detail reorder + pan/zoom

[task:uuid:f86f7003-f0fe-4b5d-97e6-528c2166a58b]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement (architect — req+architecture.md)
  - [x] AC + test scenarios (in requirement unit)
  - [x] implementing (expert — shipped)
  - [x] architect PDCA Check
  - [ ] testing (tester DET gate)
- [ ] QA Review
- [ ] Done

## Traceability

- up
  - requirement:uuid:21e792e0-0431-4ffd-a4d4-c8d85df23299 (R-unit, architect-refined AC/TS)
  - Sprint 21 Planning
- chain
  - use case: uc:uuid:5826ca42-e01a-4ab5-8cd9-67bfb02b2e67
- context
  - Sprint 21 shipped without scenario-first planning (no planner on WODA.prod); tasks backfilled by architect per PO directive 2026-06-29.

## Task Description

rb-file-detail reorder: action buttons TOP -> 75vh in-flow rb-preview-pane MIDDLE -> metadata BOTTOM. RbPanZoom transform handler (translate+scale, zoom-about-point, clamp/recenter, scale[1,8]): desktop wheel-zoom/drag-pan, touch 1-finger-pan/pinch/double-tap with pinch-release guard (touches===0). DRY across room+trace surfaces; iframe pointer-events:none mid-gesture (touch+desktop).

## Acceptance Criteria

- [ ] **(reorder)** Action buttons (open-in-preview, open-in-new-tab) render at the TOP of the file detail view.
- [ ] **(reorder)** The preview pane renders BELOW the buttons at height 75vh with overflow:hidden.
- [ ] **(reorder)** Metadata (.dv-fields: name/size/type/scenario) renders BELOW the preview (last).
- [ ] **(reorder)** Order is reversed from the current layout (was: metadata top, preview+buttons bottom at 400px).
- [ ] **(reorder)** The 75vh preview pane is an in-flow block (NOT position:fixed) so it never intercepts taps outside its own box.
- [ ] **(transform)** Pan/zoom is applied as CSS transform: translate(tx,ty) scale(s) with transform-origin:0 0 on .pz-content inside .pz-viewport.
- [ ] **(transform)** scale is clamped to [1, 8] (MIN..MAX).
- [ ] **(transform)** Zoom-about-a-point keeps the cursor/pinch-midpoint point stationary: tx'=px-f*(px-tx), ty'=py-f*(py-ty), f=newScale/oldScale.
- [ ] **(transform)** tx,ty are clamped after every gesture so content cannot be dragged fully out of view; recenters when scale==1.
- [ ] **(desktop)** Mouse wheel zooms about the cursor position (offsetX/offsetY); the handler is passive:false and preventDefaults the wheel.
- [ ] **(desktop)** Mouse drag pans the content only when scale>1; cursor shows grab/grabbing.
- [ ] **(touch)** One-finger drag pans when scale>1; when scale==1 it does NOT hijack page scroll.
- [ ] **(touch)** Two-finger pinch zooms about the midpoint and pans by the midpoint delta.
- [ ] **(touch)** Double-tap toggles reset (scale 1, tx/ty 0) <-> 2x zoom at the tap point.
- [ ] **(correctness)** The double-tap detector requires touchend with touches.length===0 AND a single-finger touchstart AND duration<250ms AND movement<10px AND gap<300ms — so a pinch release (two touchend, changedTouches.length===1 each) never misfires a reset.
- [ ] **(correctness)** Hit-testing during touch uses e.target, never document.elementFromPoint.
- [ ] **(correctness)** Gesture listeners are attached to the .pz-viewport element ONLY, not the detail/drawer root.
- [ ] **(correctness)** destroy() removes all listeners; on re-render (ViewBus) the old controller is torn down before a new one attaches (no leaked/stacked listeners).
- [ ] **(correctness)** While a gesture is active, an iframe preview gets pointer-events:none (re-enabled on idle) so drags pan instead of being swallowed by the iframe.
- [ ] **(correctness)** State resets to {scale:1, tx:0, ty:0} whenever the previewed file changes.
- [ ] **(reuse)** RbPanZoom is content-type agnostic — works for image (img), text (pre), and iframe content.
- [ ] **(reuse)** DRY: the same RbPanZoom is reused by the room file view and content-preview.ts (no duplicate gesture code).

## Dependencies

- Requires: Sprint 21 requirement + UC/Class/Method chain seeds
- Enables: tester DET gate

## Definition of Done

- [ ] All req ACs met; chain resolves Req->UC->Class->Method->Impl->Test
- [ ] Tester DET gate PASS
- [ ] Tron QA approved

## QA Audit & User Feedback

Shipped: v0.6.73 c22083798 + DRY/e5 fix v0.6.74 2a1357a69. Architect PDCA: PDCA: f2/e5 gaps -> FIXED v0.6.74 (verified GREEN); e1 refinements optional.

## Subtasks

None (atomic task).
