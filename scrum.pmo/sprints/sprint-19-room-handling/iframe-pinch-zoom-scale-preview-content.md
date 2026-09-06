<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# T-iframe-pinch: 2-finger pinch scales preview iframe content (0.25x-4x)

[task:uuid:3438e110-6035-4a07-840d-491583285977]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [ ] Done

## Task Description

Wrap iframe in .preview-zoom-container with touch-action:none. 2-touch → capture initialPinchDist, compute scale = currentScale * (newDist/initialDist), clamp [0.25,4], apply transform:scale on iframe. No snap-back. Single-touch pan preserved.

## Subtasks
