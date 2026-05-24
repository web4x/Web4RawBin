[Back to Sprint 5 Planning](./planning.md)

# T38: iOS Safe Area Inset for Room Header

[task:uuid:e38f0e05-8a91-4e7f-c213-005566778899]

## Status
- [ ] Planned
- [ ] In Progress
- [ ] QA Review
- [ ] Done

## Traceability
- up
  - [Sprint 5 Planning](./planning.md)
- down
  - None (atomic task)

## Task Description
- PO: On iPhone 15 in standalone PWA mode, room header buttons are behind the iOS status bar (clock/battery notch). Add safe area padding.

## QA Audit & User Feedback
- 2026-05-24: Tron — iPhone 15 PWA standalone mode, header buttons unreachable behind iOS status bar. Profile confirms iPhone device.

## Requirements
- Add `padding-top: env(safe-area-inset-top)` to `.room-header` in app.css
- Also add to `.lobby-header` for the lobby view
- Ensure `viewport-fit=cover` is set in app.html meta viewport (enables safe area insets)
- Test: header buttons must be below the iPhone notch/dynamic island

## Acceptance Criteria
- [ ] Room header buttons clickable on iPhone 15 in standalone PWA mode
- [ ] Lobby header buttons clickable on iPhone 15 in standalone PWA mode
- [ ] No regression on non-notch devices (padding is 0 when no inset)

## Subtasks
None (atomic task).
