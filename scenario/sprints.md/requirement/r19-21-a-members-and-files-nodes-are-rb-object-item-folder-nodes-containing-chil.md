### R19.21.A: Members and Files nodes are rb-object-item folder nodes containing child items, not bespoke section headers.

<details><summary>Tron directive</summary>

> The 'Members' and 'Files' nodes in the in-room tree MUST be THEMSELVES rb-object-item instances of folder/collection type — NOT bespoke section headers with custom styling. They contain member items / file items as expandable/collapsible children (folder semantics, same item model as /trace). This fixes the black-on-black contrast issue (bespoke headers become real items with proper theming) and enforces the R19.21 component-identity constraint at the structural level: every node in the room tree is an rb-object-item, including the two root folders.

</details>

## Traceability

**Tasks:**
- [🔗 T-room-ui-shared: in-room tree REUSES /trace rb-tree + rb-tree-item with Members/Files data adapters](../task/room-ui-shared-rb-tree-reuse-members-files-adapters.md)

**UseCases:**
- [🔗 room.folderNodeRender](../usecase/room-foldernoderender.md)
