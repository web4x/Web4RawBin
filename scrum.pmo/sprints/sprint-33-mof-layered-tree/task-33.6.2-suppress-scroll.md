<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 33.6.2: Suppress browser page-scroll during element drag; diagram edge-autoscroll ONLY when the element is dragged slightly outside the diagram boundary

[task:uuid:04c64bad-d785-4711-b993-fe41017a8622]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

Machine-gated GREEN DET-3x v0.8.23 (suppress page-scroll + edge-autoscroll, Test b826d2a9, chain-complete). QA-Review awaiting Tron @390.

## Traceability

  - up
    - [Sprint 33 Planning](./planning.md)
    - Requirement R33.6.2 `[requirement:uuid:570b77c7-1679-4827-ba8e-9673fba5994c]`
  - down
    - None (atomic task)

## Task Description

Tron item-2 (interaction polish). When a diagram element is SELECTED + MOVED, the browser PAGE must NOT scroll. The ONLY autoscroll preserved is the DIAGRAM's own edge-pan, and ONLY when the dragged element crosses SLIGHTLY OUTSIDE the diagram boundary (edge-pan to reveal off-canvas space). Inside the boundary: no autoscroll at all. Disambiguate page-scroll (suppress) from diagram-edge-autoscroll (keep, bounded). Reuse the existing drag + RbPanZoom mechanics, NO fork.

## Acceptance Criteria

- [x] While a selected element is being dragged/moved, the browser PAGE does not scroll (the drag is captured by the diagram canvas - preventDefault / touch-action:none on the active drag). @390 a touch-drag of an element does NOT scroll the page.
- [x] The DIAGRAM edge-autoscroll (auto-pan) fires ONLY when the dragged element crosses SLIGHTLY OUTSIDE the diagram boundary; while the element stays inside the diagram bounds there is NO autoscroll. The autoscroll is bounded to the diagram viewport, never the page.
- [x] GATE @390 (screenshot/pixel + planted bite): drag a selected element within bounds -> page fixed, no autoscroll; drag the element just past the diagram edge -> the DIAGRAM edge-pans (page still fixed). planted-defect: page scrolls during drag = RED.

## Subtasks

None (atomic task).
