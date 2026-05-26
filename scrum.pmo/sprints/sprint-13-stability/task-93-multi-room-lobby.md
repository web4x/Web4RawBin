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

## Measured Evidence (robbin-expert, 2026-05-26, v0.4.10 deploy on iphone:0.1)
Captured during the authorized v0.4.10 server restart. Answers the architect's investigation questions with live measurements — architect owns refinement; this is evidence, not a fix.

**Disk inventory:**
- Legacy `data/rooms/*.json`: **191** files (full-UUID names)
- Per-user `data/users/*/rooms/*/room.json`: **173** files
- ID overlap (legacy ∩ per-user): **173** — i.e. EVERY per-user room ID also exists as a legacy file
- `/api/health` after restart: `rooms: 191` (= legacy count exactly)

**Startup load path (server.ts:190-209):**
1. `roomManager.loadFromDisk()` (line 193) loads LEGACY `data/rooms/` first → 191 rooms claim all IDs.
2. `scanAllRooms()` (line 197) iterates 173 per-user rooms but `if (roomManager.getRoom(roomId)) continue` (line 200) SKIPS every ID already loaded.
3. Because all 173 per-user IDs overlap the legacy set, `loaded === 0`. Confirmed: the `if (loaded > 0) console.log('Loaded N persistent room(s)')` line (208) did NOT print at startup.

**Q1 (does loadFromDisk scan per-user?):** No — it scans legacy `data/rooms/` only. The per-user scan is a separate block that is effectively dead at startup (shadowed).
**Q2/Q3 (advertise all rooms on IDENTIFY?):** server.ts:1080-1087 calls `listRoomsForOwner(token)` then just `broadcastRoomList()` + logs count. Live log showed `Owner f4798dae connected — 1 room(s) activated`. NOTE: this block does not change room state; the lobby filter lives in `broadcastRoomList()`/`listRooms()` (architect: trace what that filter includes — dormant vs active — this is the likely "only one shows" filter). **Q4 is the prime suspect.**

**AC bearing:**
- AC2 (rooms reload after restart): PASS in effect — 191 reload — but via the LEGACY path, NOT the Sprint 9 per-user path. The per-user persistence (T74/UC-RM.2 intent) contributes ZERO rooms at startup.
- AC6 (lobby count == disk per user): in-memory 191 ≠ per-user 173 (18 legacy-only rooms with no per-user dir).
- Root-cause hypothesis for the Tron bug ("only one shows"): not the load (all load) but the lobby LIST FILTER — only the owner's active/non-dormant room(s) surface. Architect to confirm in `listRooms()`/`broadcastRoomList()`.

**Migration risk (NFR-1):** legacy `data/rooms/` is still authoritative on load. Until `loadFromDisk()` is retired or de-conflicted with `scanAllRooms()`, the per-user SSH-identity rooms are not the source of truth.

## QA Audit & User Feedback
- 2026-05-26: Tron directive — "i created more than one room. but only one shows up in the lobby… all his rooms should show up… loaded from disk." Awaiting architect refinement, then Tron QA.
- 2026-05-26: robbin-expert added Measured Evidence section above from the v0.4.10 deploy verification.

## Subtasks
None (atomic task).
