[Back to Sprint 13 Planning](./planning.md)

# T93: All User Rooms Load from Disk and Appear in Lobby

[task:uuid:a7b8c9d0-e1f2-4a3b-4c5d-6e7f80910093]

## Tron Requirement (literal)

> TRON DIRECTIVE: "i created more than one room. but only one showes up in the lobby. when a user connects all his rooms should show up in the lobby and being loaded from disk."

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement (architect)
  - [x] implementing (expert)
  - [ ] testing (tester)
- [ ] QA Review
- [ ] Done

## Implementation (robbin-expert, 2026-05-26, v0.5.2)
Addresses both architect causes. Key constraint discovered: legacy `PersistedRoom` (data/rooms/*.json) has NO `creatorToken` field (only `creatorId`), so owner-aware listing can't match legacy-loaded rooms until creatorToken is populated from the per-user room.json (`ownerToken`).

- **Cause 1 (per-user load + creatorToken).** Kept legacy `loadFromDisk()` first, then per-user pass over `scanAllRooms()`: if a room id is already loaded (legacy), BACKFILL `existing.creatorToken = data.ownerToken` IN PLACE; else register fresh via createRoom. Chose backfill over reordering because re-creating loaded rooms would hit `uniqueNameGenerate` → rename colliding names → persist drift on every restart. Backfill avoids that entirely.
- **IDENTIFY (UC-RM.4).** Added per-user `scanUserRooms(token)` (new RoomKeys export — scans one user's dir, not all, per NFR-2). On owner connect: register any unregistered on-disk rooms + backfill creatorToken on existing, then `broadcastRoomList()`. So a user's FULL room set loads/advertises when they connect (AC3).
- **Cause 2 (owner-aware listing).** New `roomListFor(playerToken)` = public `listRooms()` ∪ `listRoomsForOwner(playerToken)` (dedup by id). `broadcastRoomList()` now sends PER-CLIENT (each gets public + their own private/empty rooms). `LIST_ROOMS` handler uses the caller's token. Others still get the public-filtered view (AC4 when owner connected; private/dormant hidden from others).
- AC1 (3 rooms → all show): owner's own all surface via listRoomsForOwner merge. AC2 (restart reload): startup per-user pass. AC5 (delete one, others stay): unaffected. AC6 (count==disk): owner's lobby = listRoomsForOwner = their on-disk rooms.
- Files: server.ts (startup, IDENTIFY, roomListFor, broadcastRoomList, LIST_ROOMS), RoomKeys.ts (scanUserRooms). v0.5.2, sw.js cache rawbin-v0.5.2. tsc + build clean. Server-only (no client bundle change).
- NOTE: behavior change (intended per UC-RM.4) — empty rooms now gated on owner-connected (creatorToken populated), where before empty legacy rooms (no creatorToken) showed to everyone. This is the Sprint 9 dormant-room semantics, now actually working.

## Diagram
[rooms-workflow.svg](./diagrams/rooms-workflow.svg) ([source](./diagrams/rooms-workflow.puml)) — UC-RM2/RM3 (enumerate ALL + register each) + UC-RM5 (no over-filter) are the T93 targets.

## Root-Cause Findings (robbin-architect, 2026-05-26 — evidence-backed)

**CONFIRMED: two compounding causes.**

**Cause 1 — no per-user room load (the dominant one).** `RoomManager.loadFromDisk()` (Room.ts:330-345) reads ONLY `this.persistDir` (default `data/rooms` — flat dir; server.ts constructs `new RoomManager(ROOMS_DIR=data/rooms)`). It does `readdirSync(data/rooms).filter(.json)` — it NEVER walks `data/users/<token>/rooms/<uuid>/room.json`. Sprint 9 introduced per-user room persistence (createRoomHome/writeRoomJson under the user dir, with `.ssh/`), but that path is **write-only** — there is no symmetric read that loads those per-user rooms back. So on restart/connect, per-user rooms are not loaded; only whatever sits in the flat `data/rooms` reloads. Hence "only one shows."

**Cause 2 — `listRooms()` filter hides owned rooms (Room.ts:378-386).** Even for loaded rooms: line 381 `if (r.isPrivate) return false` hides ALL private rooms (including the owner's own), and an empty room with a `creatorToken` only shows when `connectedOwners.has(creatorToken)`. So an owner's empty/private rooms can be filtered out of their own lobby.

**Fix direction (drives AC1-AC6):**
1. Add a per-user load path: on server start AND on IDENTIFY, enumerate `data/users/<token>/rooms/*/room.json` and register EACH in RoomManager (loop, not first-match). This is UC-RM2 + UC-RM3.
2. Reconcile the two persistence locations — Sprint 9 per-user dir should be the source of truth; the flat `data/rooms` is legacy. Either migrate-and-read per-user, or have loadFromDisk walk the per-user tree.
3. Owner-aware listing: the owner must see ALL their own rooms (incl. empty + private). Use `listRoomsForOwner(ownerToken)` (Room.ts:389) merged into the owner's ROOM_LIST so their private/empty rooms aren't filtered (UC-RM5). Other users keep the public filter.
4. Verify count(lobby) == count(disk rooms for owner) (UC-RM7).

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
