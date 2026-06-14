### R19.90: In-room tree REUSES rb-trace-tree component — delete duplicate RoomView tree implementation.

<details><summary>Tron directive</summary>

> DRY + OOP audit result: the in-room tree DUPLICATES the working /trace rb-trace-tree (non-DRY: 2 tree implementations, 2 item-creation paths, 2 collapse handlers; non-OOP: RoomView owns item lifecycle it shouldn't). ROOT FIX: in-room REUSES the existing rb-trace-tree component with a new 'room' mode and a setItems(members, files) API. DELETE the duplicate RoomView renderRoomTree*/diffRenderItems/manual event delegation. rb-trace-tree already handles item init, collapse, drawer-open, drag correctly — reusing it fixes the iOS init race by construction (no more hand-rolled custom-element lifecycle in RoomView). Supersedes the approach in R19.83 (file lifecycle mirror), R19.88 (whenDefined gate), R19.88.A (innerHTML diff) — all were patches on the duplicate impl instead of eliminating the duplication.

</details>

## Traceability

**Tasks:**
- [🔗 T-tree-room-mode: add room data-mode to rb-trace-tree with setItems API, delete RoomView duplicate](../task/tree-room-mode-setitems-delete-roomview-duplicate.md)
