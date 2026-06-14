### R19.83: File items in room tree must survive re-render — collapse-to-icon and preview-drawer work like member items.

<details><summary>Tron directive</summary>

> BUG: file items in the in-room tree do not collapse to icons (R19.27) and do not open the preview drawer (R19.73) — member items work fully. Root cause: re-render destroys file item DOM nodes because there is no this.files[] / renderRoomTreeFiles() mirror of the members pattern (this.members[] / renderRoomTreeMembers()). FIX: file items must be managed with the same lifecycle pattern as member items — a persistent this.files[] array and a renderRoomTreeFiles() method that preserves/updates existing file item nodes on re-render instead of destroying and recreating them. All item interactions (collapse-to-icon, preview-drawer click, drag) must work identically on file items and member items.

</details>

## Traceability

**Tasks:**
- [🔗 T-room-file-item-rerender: file items in room tree survive re-render (mirror members lifecycle)](../task/room-file-item-rerender-lifecycle-mirror-members.md)
