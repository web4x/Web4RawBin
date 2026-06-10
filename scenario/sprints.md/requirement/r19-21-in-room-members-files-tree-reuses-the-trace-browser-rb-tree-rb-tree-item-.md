### R19.21: In-room Members/Files tree reuses the trace browser rb-tree + rb-tree-item components.

<details><summary>Tron directive</summary>

> The Members/Files tree inside a room MUST be rendered by the SAME rb-tree component used in /trace, and each tree item MUST be rendered by the SAME rb-tree-item component (Lucide icon, speaky name, word-wrap description, drag, tap-to-collapse/expand, > expander). The current inline tree in RoomView (T-room-ui v0.5.129, commit 529d5c42) does not satisfy this — re-implement using the shared components.

</details>

## Traceability

**Tasks:**
- [🔗 T-room-ui-shared: in-room tree REUSES /trace rb-tree + rb-tree-item with Members/Files data adapters](../task/room-ui-shared-rb-tree-reuse-members-files-adapters.md)

**UseCases:**
- [🔗 room.mountTraceTree](../usecase/room-mounttracetree.md)
