# T-seed-ior-room: in-room tree uses data-seed-ior=roomUuid (proven /trace path)
[task:uuid:4aa7e19d-3ada-4023-b1dd-8c6211af0328]

## Traceability

**UseCases:**
- [🔗 roomView.seedIorTree](../usecase/roomview-seediortree.md)


## Task Description

R19.92: replace bespoke tree.items WS feed with data-seed-ior on rb-trace-tree. Template: <rb-trace-tree id='room-tree' data-seed-ior='${roomId}'></rb-trace-tree>. Delete updateRoomTree(), this.files[] tree plumbing. Live update on FILE_ADDED: re-trigger renderSeed. /api/trace/children already returns Room.files+members from scenario index.

## Subtasks


