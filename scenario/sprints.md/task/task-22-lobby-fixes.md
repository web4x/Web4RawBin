# T22: Lobby & Server Fixes (Tron Live Testing)
[task:uuid:bea3af94-9de9-4f12-9c7c-4fc526a6c157]

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
  - [sprint-3-e2e-hardening Planning](./planning.md)
- down
  - None

## QA Audit & User Feedback

- 2026-05-23 UTC: Tron QA REJECT — private room join STILL broken. Server line 672 reads `if (room.isPrivate)` which blocks ALL private room joins unconditionally. Should be `if (room.isPrivate && room.roomKey !== msg.roomKey)` to allow joins with correct key. The fix from T22.2 was overwritten or never applied correctly.

## Subtasks

None (atomic task).
