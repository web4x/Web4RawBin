[Back to Sprint 1 Planning](./planning.md)

# Task 3: Create Room.ts from GameRoom.ts

[task:uuid:606277ca-dd09-4409-a460-fa91fa334893]

**Status:** DONE
**Assigned:** robbin-expert (implement), robbin-tester (verify)
**Estimated effort:** 2h expert + 1h tester
**Priority:** 3 (CRITICAL — blocks all room-related work)
**Depends on:** Task 2 (architecture approved)
**Created:** 2026-05-22
**Completed:** 2026-05-22


## Traceability
- up
  - [sprint-1-rawbin-foundation Planning](./planning.md)
- down
  - None
## Goal

Fork `GameRoom.ts` into `Room.ts` — strip all game logic, rename to RawBin conventions.

## Source

`workspaces/UpDown/qnd/src/ts/server/GameRoom.ts` (864 lines)

## Target

`workspaces/Web4RawBin/src/ts/server/Room.ts` (~300 lines)

## Requirements

### 3.1 Expert: Create Room.ts

**From GameRoom, KEEP:**
- Room identity: id, name, hostId, maxMembers, isPrivate, roomKey
- Room state: `'active' | 'archived'` (was 5 game states)
- Creator lifecycle: creatorToken, creatorClientId, setCreator() (BR-015 pattern)
- Members map (was players): addMember, removeMember, broadcast
- Spectators map: addSpectator, removeSpectator, promoteSpectator
- Chat: chatHistory array
- Room info: info() → RoomInfo
- createdAt timestamp

**From GameRoom, REMOVE:**
- Card deck (SUITS, VALUES, Card interface, shuffle, deal)
- Game state machine (waiting/countdown/revealing/exchange/finished)
- Round management (startGame, nextRound, resolveRound, forceNextRound)
- Player game state (score, streak, alive, currentGuess, specialCard, inventory, frozen, roundsPlayed)
- Countdown timer (countdownEnabled, countdownTimer, countdownSeconds)
- Bot integration (bots Map, addBot, bot scheduling)
- Special cards (playSpecialCard, inventory management)
- Score recording (leaderboard generation, gameOverCallback)
- Auto-start (lobby countdown, minPlayers, autoStart)
- Preset rooms (createPresetRooms, autoRecreate)

**RENAME:**
- `GameRoom` → `Room`
- `RoomPlayer` → `RoomMember` (strip game fields: score, streak, alive, currentGuess, specialCard, inventory, frozen, roundsPlayed)
- `RoomState` → `'active' | 'archived'`
- `players` → `members`
- `findPlayerRoom` → `findMemberRoom`
- `hostId` stays (room owner)

**RoomMember interface (target):**
```typescript
export interface RoomMember {
  id: string;
  ws: WebSocket;
  name: string;
  avatarUrl: string;
  playerToken: string;
  disconnected: boolean;
}
```

**RoomInfo interface (target):**
```typescript
export interface RoomInfo {
  id: string;
  name: string;
  hostId: string;
  hostConnected: boolean;
  memberCount: number;
  maxMembers: number;
  isPrivate: boolean;
  state: RoomState;
  createdAt: number;
}
```

**RoomManager (strip game callbacks):**
- No `createPresetRooms()` — all rooms user-created
- No `setGlobalGameOverCallback()` — no game
- No `autoRecreate` logic
- Keep: createRoom, getRoom, removeRoom, listRooms, findMemberRoom, findSpectatorRoom, cleanupStale

**NEW: File-backed persistence:**
- Save room state to `data/rooms/<room-id>.json` on create/modify/delete
- Load rooms from disk on server startup
- In-memory Map + file sync (same pattern as profiles.json)

### 3.2 Expert: Add archive() method
- `room.archive()` sets state to 'archived', notifies members, persists to disk
- Archived rooms appear in room list but can't be joined

### 3.3 Tester: Verify Room.ts
- Unit tests in `test/vitest/room.test.ts`
- Test cases:
  - Create room → verify RoomInfo
  - Add/remove member → verify member count
  - Creator lifecycle → verify only creator can delete
  - Archive room → verify state change + can't join
  - Broadcast → verify all members receive message
  - Chat → verify chatHistory append + limit
  - File persistence → verify save/load cycle
  - Spectator → verify add/remove/promote


## Subtasks
None (atomic task).
## Acceptance Criteria
- [x] Room.ts compiles with no TypeScript errors
- [x] No imports from game files (BotPlayer, SpecialCards, CardUtils, ScoreCalculator)
- [x] All vitest tests pass
- [x] File persistence works (create room, restart, room still exists)
- [x] ~300 lines or less
