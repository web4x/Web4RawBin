### R19.21.B: Drag preview shows the full item card, not just the icon.

<details><summary>Tron directive</summary>

> When dragging an rb-object-item (tree item), the drag image/ghost MUST render the FULL item card (icon + speaky name + word-wrap description) — not just the icon square. Applies to rb-object-item everywhere it appears: /trace browser AND in-room Members/Files tree. This is a component-level fix on rb-object-item's dragstart handler (setDragImage must clone the full item element, not just the icon).

</details>

## Traceability

**Tasks:**
- [🔗 T-room-ui-shared: in-room tree REUSES /trace rb-tree + rb-tree-item with Members/Files data adapters](../task/room-ui-shared-rb-tree-reuse-members-files-adapters.md)

**UseCases:**
- [🔗 objectItem.dragGhost](../usecase/objectitem-dragghost.md)
