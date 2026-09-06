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

See requirement unit 21e792e0-0431-4ffd-a4d4-c8d85df23299 (architect-refined AC + gateable test scenarios).

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
