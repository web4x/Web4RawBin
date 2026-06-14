# T57: rb-avatar Fixes — Lobby DRY, Pinch-Zoom, Crop Position
[task:uuid:8975ff1f-c486-4f4d-be1b-750b70c2ec25]

## Status

- [x] Planned
- [x] In Progress
- [x] QA Review
- [x] Done

## Traceability

- up
  - [Sprint 7 Planning](./planning.md)
- down
  - None (atomic task)

## Acceptance Criteria

- [x] Lobby avatar is rb-avatar component (clickable, opens overlay)
- [x] Pinch-zoom works on iPhone Safari in overlay
- [x] Crop button saves zoom+pan position
- [x] Saved crop applied when rendering avatar everywhere
- [x] No actual image modification (only viewport transform)

## QA Audit & User Feedback

- 2026-05-24: Tron — avatar not clickable in lobby (DRY violation: inline img, not rb-avatar). Pinch-zoom doesn't work on iPhone. Add crop button that saves zoom+pan position.

## Subtasks

None (atomic task).
