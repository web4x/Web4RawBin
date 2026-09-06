<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# T-tree-room-mode: add room data-mode to rb-trace-tree with setItems API, delete RoomView duplicate

[task:uuid:b8da64a1-9939-4de9-b47d-73f489a8258a]

## Status
- [ ] Planned
- [ ] In Progress
- [ ] Done

## Task Description

R19.90: rb-trace-tree gains data-mode=room + setItems(roots: TreeNode[]). RoomView replaces all renderRoomTree*/diffRenderItems with tree.setItems([membersRoot, filesRoot]). Delete duplicate imperative tree code. iOS init fixed by construction.

## Subtasks
