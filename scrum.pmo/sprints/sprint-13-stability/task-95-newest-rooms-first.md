<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# T95: Lobby Rooms Ordered Newest-First

[task:uuid:1c6c4aa1-7201-4ca8-a8b3-d4491f52ef35]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement (architect)
  - [x] implementing (expert)
  - [x] testing (tester — TS1 1/1 + room-order.test 10/10, 073b027)
- [ ] QA Review
- [ ] Done

## Traceability

- up
  - [Sprint 13 Planning](./planning.md)
  - Tron directive 2026-05-26 — newest rooms first
- down
  - None (atomic task)
- chain
  - **use case:** UC-RM5/RM6 in [diagrams/rooms-workflow.puml](./diagrams/rooms-workflow.puml)
  - **class/method:** `server.ts enrichRoomList()` (sort), consumes `RoomInfo.createdAt` (Room.ts:224)
- depends
  - Builds on T93 (`roomListFor`/owner-aware list) — already landed.

## Acceptance Criteria

- [ ] AC1: In the lobby, rooms are ordered newest-first (highest `createdAt` at the top)
- [ ] AC2: Creating a new room makes it appear at the TOP of the list for all clients on the next ROOM_LIST
- [ ] AC3: Ordering is stable across server restart (rooms reload with persisted `createdAt`; order does not reshuffle)
- [ ] AC4: Rooms with a missing/legacy `createdAt` sort deterministically to the bottom (no error, no reshuffle)
- [ ] AC5: Owner-aware list (T93) still includes the owner's own private/empty rooms — ordering does not drop any room
- [ ] AC6: `npm run build` succeeds; version bumped + sw.js cache (user-facing change)

## QA Audit & User Feedback

- 2026-05-26: Tron directive — newest rooms at top of lobby. Impl v0.5.5 (3748f0e); tester-verified TS1 1/1 + room-order.test 10/10 (073b027). Awaiting Tron QA.
- 2026-05-26: TS1 flooded prod with 3 test rooms → proper fix is [T100](./task-100-test-data-isolation.md) (DATA_DIR isolation); tester afterAll cleanup separate/immediate.

## Subtasks

None (atomic task).
