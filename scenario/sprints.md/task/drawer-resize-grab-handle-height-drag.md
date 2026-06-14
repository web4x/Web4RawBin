# T-drawer-resize: grab-handle drag sets drawer height (min 120px to 95vh)
[task:uuid:ec187a1f-8e12-41ea-973c-49042d15b170]

## Traceability

**UseCases:**
- [🔗 drawer.dragResize](../usecase/drawer-dragresize.md)


## Task Description

Replace translateY swipe-dismiss on grab handle with real height-drag. touchStart on .drawer-handle captures startY+startHeight. touchMove clamps [120, 95vh]. touchEnd < 120 = close. Off-handle swipe-dismiss preserved.

## Subtasks


