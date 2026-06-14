# T37: Hotfixes — Private Room + Version Bar
[task:uuid:d37f0e04-7f80-4d6e-b102-004455667788]

## Status

- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] implementing
  - [x] testing
- [x] QA Review
- [x] Done

## Traceability

- up
  - [Sprint 5 Planning](./planning.md)
- down
  - None (atomic task)

## Task Description

- PO: Three Tron QA findings from live testing.

## Acceptance Criteria

- [x] Private room with key can be joined (correct key accepted, wrong key rejected)
- [x] Join-private section visible on mobile viewport
- [x] Version reads from package.json (not hardcoded)
- [x] Update bar is RED
- [x] /api/health shows new version

## QA Audit & User Feedback

- 2026-05-23: Tron — join private room still broken (blocks all private joins)
- 2026-05-23: Tron — join private section CSS is off-screen on mobile
- 2026-05-23: Tron — version must increment on each update, update bar must be RED not green

## Subtasks

None (atomic task).
