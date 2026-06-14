### R19.84: Drawer nudge DRAG-RESIZES the drawer height, not just swipe-dismiss.

<details><summary>Tron directive</summary>

> BUG: the drawer nudge handle LOOKS draggable (R19.79) but dragging it does NOT resize the drawer — it only triggers swipe-dismiss. FIX: dragging the nudge handle up/down MUST resize the drawer height (from some minimum up to 95vh per R19.80). This is a real drag-resize interaction, not just a CSS max-height. The nudge touch/mouse handler must track drag delta and update the drawer height in real-time. Swipe-dismiss remains on fast downward swipe; slow drag = resize.

</details>

## Traceability

**Tasks:**
- [🔗 T-drawer-drag-resize: the drawer nudge/grab-handle must DRAG-RESIZE the drawer hei](../task/drawer-nudge-drag-resizes-height.md)

**UseCases:**
- [🔗 detailDrawer.dragResize](../usecase/detaildrawer-dragresize.md)
