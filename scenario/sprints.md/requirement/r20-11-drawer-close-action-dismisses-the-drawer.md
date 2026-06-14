### R20.11: Drawer close action dismisses the drawer.

<details><summary>Tron directive</summary>

> The detail drawer MUST have a CLOSE ACTION that dismisses/hides the drawer entirely (e.g. tap X button, swipe-down dismiss). This is the close() method behavior — the drawer transitions from visible to hidden. Distinct from R19.33 (553be449 = the close AFFORDANCE stays STICKY, which is the CSS visual positioning of the X button, not the close ACTION itself). Method: close() (91efe513, rb-detail-drawer.ts:107).

</details>

## Traceability

**UseCases:**
- [🔗 detailDrawer.close](../usecase/detaildrawer-close.md)
