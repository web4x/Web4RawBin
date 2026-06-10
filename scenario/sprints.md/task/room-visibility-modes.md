# T-visibility: Room visibility modes (public/by-invite/private)
[task:uuid:164d8114-3008-4683-93e8-c96d40cd93cc]

## Status

- [ ] Planned
- [x] In Progress
  - [x] refinement
  - [ ] creating test cases
  - [x] implementing (commit 7d975b74 v0.5.127 — visibility enum + setVisibility + RoomVisibility type)
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Traceability

**UseCases:**
- [🔗 room.enforceVisibility](../usecase/room-enforcevisibility.md)


## Task Description

Room visibility = PUBLIC | BY-INVITE | PRIVATE(password). PRIVATE rooms listed only for owners. Singular-chain by design: ONE UseCase per Task, ONE Method per UseCase.

## Subtasks


