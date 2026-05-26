[Back to Sprint 13 Planning](./planning.md)

# T95: Lobby Rooms Ordered Newest-First

[task:uuid:c9d0e1f2-a3b4-4c5d-6e7f-809100000095]

## Tron Requirement (literal)

> TRON DIRECTIVE: newest rooms should appear at the top of the lobby.

## Status
- [ ] Planned
- [ ] In Progress
  - [x] refinement (architect)
  - [ ] implementing (expert)
  - [ ] testing (tester)
- [ ] QA Review
- [ ] Done

## Diagram
[rooms-workflow.svg](./diagrams/rooms-workflow.svg) ([source](./diagrams/rooms-workflow.puml)) — UC-RM5 (list)/RM6 (render) — ordering is applied at the list-build seam.

## createdAt Finding (robbin-architect — NO new field needed)

The room model ALREADY carries a creation timestamp; nothing to add to the schema.

- `Room.createdAt: number = Date.now()` — set at construction (Room.ts:83).
- Persisted to `room.json` (Room.ts:282) and restored on load (`fromPersisted`, Room.ts:314: `room.createdAt = data.createdAt`).
- Exposed in `RoomInfo` (Room.ts:27) and returned by `info()` (Room.ts:224) — so every room-list entry already has `createdAt`.

**Deterministic across restart:** `createdAt` is restored from disk (not regenerated), so it's stable — sorting by it does NOT reshuffle on every restart.

**Legacy fallback (rooms with no `createdAt`):** a pre-existing `room.json` written before the field would deserialize to `createdAt === undefined`. The sort uses `(createdAt || 0)`, which places such legacy rooms deterministically at the BOTTOM and never reshuffles them. No migration required. (Optional nicety: backfill `createdAt = 0` for missing values in `fromPersisted`; not required — the `|| 0` in the comparator is sufficient.)

## Design

### Where to sort — single seam: `enrichRoomList()` (server.ts:1322)

Every room-list broadcast/response flows through `enrichRoomList()`:
- `roomListFor(playerToken)` (server.ts:1331, the T93 owner-aware builder) returns `enrichRoomList(...)` → used by `broadcastRoomList()` (1344) and the direct send at 1015.
- The welcome path (server.ts:863) calls `enrichRoomList(roomManager.listRooms(...))` directly.

Sorting inside `enrichRoomList` guarantees newest-first for EVERY client and EVERY call path, with one change. (Sorting in `listRooms`/`listRoomsForOwner` alone would miss the merge in `roomListFor`; sorting in `enrichRoomList` covers all.)

**Change — `enrichRoomList()` (server.ts:1322):** sort DESC by `createdAt` after mapping:
```typescript
function enrichRoomList(rooms: any[]): any[] {
  return rooms
    .map(r => ({
      ...r,
      ownerName: r.ownerToken ? (userProfiles.get(r.ownerToken)?.name || 'Unknown') : '',
    }))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));  // newest-first; legacy (no ts) sink to bottom, stable
}
```

That is the entire change — server-only, one function. No client change (RoomBrowser renders the array in received order).

### Why not sort client-side
Sorting server-side in the shared seam means newest-first is identical for every client and every entry point (welcome, broadcast, owner-aware merge) — no divergence, no per-client logic. The client just renders the order it receives.

## Acceptance Criteria
- [ ] AC1: In the lobby, rooms are ordered newest-first (highest `createdAt` at the top)
- [ ] AC2: Creating a new room makes it appear at the TOP of the list for all clients on the next ROOM_LIST
- [ ] AC3: Ordering is stable across server restart (rooms reload with persisted `createdAt`; order does not reshuffle)
- [ ] AC4: Rooms with a missing/legacy `createdAt` sort deterministically to the bottom (no error, no reshuffle)
- [ ] AC5: Owner-aware list (T93) still includes the owner's own private/empty rooms — ordering does not drop any room
- [ ] AC6: `npm run build` succeeds; version bumped + sw.js cache (user-facing change)

## Test Scenario (tester)

### TS1 — Newest room is first (E2E)
```
1. Client A: ensureLobby(page, 'OrderUser')
2. Create room "Alpha"; wait for it in the room list
3. Create room "Bravo"; wait for it in the room list
4. Create room "Charlie"; wait for it in the room list
5. Read the rendered room-card order in #room-list (top → bottom)
6. Assert order is ["Charlie", "Bravo", "Alpha"] (newest-first)
7. (restart-stability, optional) restart server, reconnect, re-read order → still ["Charlie","Bravo","Alpha"]
```

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

## QA Audit & User Feedback
- 2026-05-26 robbin-architect: design + createdAt finding (field already exists, no schema change). Single-seam sort in enrichRoomList. Ready for PO review.

## Subtasks
None (atomic task).
