[Back to Sprint 13 Planning](./planning.md)

# T93: All User Rooms Load from Disk and Appear in Lobby

[task:uuid:a7b8c9d0-e1f2-4a3b-4c5d-6e7f80910093]

## Tron Requirement (literal)

> TRON DIRECTIVE: "i created more than one room. but only one showes up in the lobby. when a user connects all his rooms should show up in the lobby and being loaded from disk."

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement (architect)
  - [ ] implementing (expert)
  - [ ] testing (tester)
- [ ] QA Review
- [ ] Done

## Traceability
- up
  - [requirement:uuid:c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f](./requirements.md) — R-R1: All rooms appear in lobby
  - [Sprint 13 Planning](./planning.md)
  - Sprint 9 UC-RM.2 (room.persist) + UC-RM.4 (room.advertise) — these specified the behavior that is now failing
- down
  - None (atomic task)
- chain
  - **requirement:** R-R1 in [requirements.md](./requirements.md)
  - **use case:** UC-RM.2 room.persist, UC-RM.4 room.advertise (Sprint 9 requirements)
  - **class/method:** `RoomManager.loadFromDisk()` in Room.ts, `server.ts` IDENTIFY handler (room advertise logic), `server.ts` WS connect (room list broadcast)

## Task Description

**Bug:** User creates multiple rooms, but only one appears in the lobby. Sprint 9 specified per-user room persistence and advertisement (UC-RM.2 + UC-RM.4), but the implementation only loads/advertises one room.

**Investigation needed by architect:**
1. Does `RoomManager.loadFromDisk()` scan `data/users/*/rooms/*/room.json`? Or only `data/rooms/`?
2. On IDENTIFY, does the server scan the user's `rooms/` directory for ALL rooms, or just one?
3. Is the room advertise logic (making dormant rooms active on owner connect) running for all rooms or just the first match?
4. Does `listRooms()` return all active rooms or filter in a way that hides some?

## Acceptance Criteria
- [ ] AC1: Creating 3 rooms → all 3 appear in lobby room list
- [ ] AC2: After server restart → all 3 rooms reload from disk
- [ ] AC3: After owner reconnects → all 3 rooms appear in ROOM_LIST
- [ ] AC4: Other users see all 3 rooms in their lobby
- [ ] AC5: Deleting one room leaves the other 2 visible
- [ ] AC6: Room count in lobby matches actual rooms on disk for each user

## QA Audit & User Feedback
- 2026-05-26: Tron directive — "i created more than one room. but only one shows up in the lobby… all his rooms should show up… loaded from disk." Awaiting architect refinement, then Tron QA.

## Subtasks
None (atomic task).
