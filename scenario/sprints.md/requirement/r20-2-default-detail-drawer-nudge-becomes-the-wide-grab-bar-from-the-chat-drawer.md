### R20.2: Default detail drawer nudge becomes the wide grab-bar from the chat drawer.

<details><summary>Tron directive</summary>

> The default DetailViewContainer (rb-detail-drawer) nudge is a tiny grey stub pill + X button (BAD UX — not discoverable as a drag handle). The chat drawer has a WIDE GRAB-BAR that is the correct reference. FIX: the default detail drawer nudge MUST render the SAME wide grab-bar as the chat drawer — visually identical, functionally identical (drag-resize per R19.84). One DRY nudge/grab-bar component shared across both drawers.

</details>

## Traceability

**Tasks:**
- [🔗 T-detail-drawer-grab-bar: default detail drawer nudge becomes the wide grab-bar (DRY with chat drawer)](../task/detail-drawer-wide-grab-bar-dry.md)
