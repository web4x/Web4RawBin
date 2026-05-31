# T38: iOS Safe Area Inset for Room Header
[task:uuid:f116160a-4026-41d8-b4c3-bcc807c9240b]

## Status

- [x] Planned
- [x] In Progress
- [x] QA Review
- [x] Done

## Traceability

- up
  - [Sprint 5 Planning](./planning.md)
- down
  - None (atomic task)

## Task Description

- PO: On iPhone 15 in standalone PWA mode, room header buttons are behind the iOS status bar (clock/battery notch). Add safe area padding.

## Acceptance Criteria

- [x] Room header buttons clickable on iPhone 15 in standalone PWA mode
- [x] Lobby header buttons clickable on iPhone 15 in standalone PWA mode
- [x] No regression on non-notch devices (padding is 0 when no inset)

## QA Audit & User Feedback

- 2026-05-24: Tron — iPhone 15 PWA standalone mode, header buttons unreachable behind iOS status bar. Profile confirms iPhone device.

## Subtasks

None (atomic task).
