### R19.33: Detail drawer close affordance stays sticky in view, never scrolls away.

<details><summary>Tron directive</summary>

> BUG: the detail drawer's close affordance (nudge handle / X button) scrolls out of view when the user scrolls down in the detail content. FIX: the close affordance MUST be position:sticky or position:fixed relative to the drawer viewport so it remains visible and tappable regardless of content scroll position.

</details>

## Traceability

**Tasks:**
- [🔗 T-sticky-drawer-close: sticky close button on detail drawer](../task/sticky-drawer-close-button.md)

**UseCases:**
- [🔗 detailDrawer.stickyClose](../usecase/detaildrawer-stickyclose.md)
