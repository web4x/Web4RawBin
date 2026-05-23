[Back to Sprint 1 Planning](./planning.md)

# Task 4: Strip server.ts of Game Logic

[task:uuid:01df5b22-b485-40c4-b9fc-57a85676dfa5]

**Status:** DONE
**Assigned:** robbin-expert (implement), robbin-tester (verify)
**Estimated effort:** 3h expert + 1h tester
**Priority:** 4 (HIGH — largest single task)
**Depends on:** Task 3 (Room.ts exists)


## Traceability
- up
  - [sprint-1-rawbin-foundation Planning](./planning.md)
- down
  - None
## Goal

Strip all game-specific routes, WS handlers, and data model from server.ts. Import Room.ts instead of GameRoom.ts. Rebrand UpDown → RawBin.

## Source

`workspaces/UpDown/qnd/src/ts/server/server.ts` (1681 lines)

## Target

`workspaces/Web4RawBin/src/ts/server/server.ts` (~900 lines)

## Requirements

### 4.1 Expert: Strip HTTP routes

**KEEP (unchanged or minimal edits):**
- `POST /api/bug-status` (lines 273-291)
- `GET /api/bugs` (lines 293-303)
- `GET /api/config` (lines 325-329) — update version to "0.1.0", branch to "rawbin"
- `/docs` + `/docs/*.md` (lines 336-357)
- `/md/*.md` (lines 358-371)
- `/` + `/index.html` (lines 377-378)
- `/bug-report` (lines 385-447) — rebrand title/branding
- `/profile` (lines 449-512) — strip game stats (gamesPlayed, wins, bestScore, bestStreak, diamonds)
- Static file serving (lines 549-576)

**REMOVE:**
- `GET /api/leaderboard` (lines 306-321)
- `/js` + `/ts` routes (lines 379-382)
- `/leaderboard` page (lines 514-546)

**RENAME:**
- `/mp` + `/multiplayer` → `/app` (new main entry point)

### 4.2 Expert: Strip WS message handlers

**KEEP (handleGameMessage → handleMessage):**
- `CREATE_ROOM` — import from Room.ts, use RoomManager
- `JOIN_ROOM` — update to use RoomMember
- `LEAVE_ROOM` — simplify (no game state cleanup)
- `DELETE_ROOM` — keep creator-only check
- `REMOVE_ROOM` — keep host/empty check
- `LIST_ROOMS`
- `CHAT_MESSAGE` — keep room chat
- `SPECTATE` / `LEAVE_SPECTATE` — keep observer pattern
- `JOIN_ROOM_FROM_SPECTATE` (was JOIN_NEXT_GAME) — promote spectator to member
- `IDENTIFY` — keep profile/device tracking
- `CONSOLIDATE` — keep account linking
- `UPDATE_SECRET_CODE`
- `BUG_REPORT` / `PAIR_BUG_REPORT`

**REMOVE:**
- `START_GAME`, `TOGGLE_COUNTDOWN`, `FORCE_NEXT_ROUND`, `PLAY_AGAIN`
- `PLAY_CARD`, `PLAY_SPECIAL`
- `ADD_BOT`
- `GAME_STATE`
- `GET_LEADERBOARD`

### 4.3 Expert: Strip data model

**PlayerProfile → UserProfile:**
```typescript
interface UserProfile {
  token: string;
  name: string;
  avatar: string;
  secretCode: string;
  consolidatedFrom: string[];
  redirectTo?: string;
  bugReports: { date: string; text: string; status: string }[];
}
```

**Separate DeviceRecord storage:**
```typescript
interface DeviceRecord {
  deviceId: string;
  ownerToken: string;
  userAgent: string;
  ip: string;
  screenSize: string;
  platform: string;
  firstSeen: string;
  lastSeen: string;
  connectionCount: number;
}
```
- `profiles.json` → identity + bugs only
- `devices.json` → device records with ownerToken FK
- IDENTIFY handler: write to both files
- PROFILE response: only send requesting user's own devices
- CONSOLIDATE: update ownerToken in device records

### 4.4 Expert: Strip imports and globals

- Remove: `import { RoomManager } from './GameRoom.js'` → `import { RoomManager } from './Room.js'`
- Remove: `recordGameResults()` function
- Remove: `roomManager.createPresetRooms()` call
- Remove: `roomManager.setGlobalGameOverCallback()` call
- Update: `bugReportTarget` default from `upDownTeam:0.0` to `robbinTeam:0.0`
- Update: TUI branding strings: "UpDown" → "RawBin", game references → server management
- Update: package name in `/api/config`: version "0.1.0", branch "rawbin"

### 4.5 Expert: Update MessageTypes.ts

Strip to 31 messages per architect analysis. See `task-2-rawbin-architecture-definition.md` for exact list.

### 4.6 Tester: Verify stripped server

- Server starts without errors (`npm run dev`)
- All kept routes respond correctly
- Removed routes return 404
- WS connection works, IDENTIFY creates profile
- Room create/join/leave/delete works
- Chat works in room
- Bug report pipeline works
- Profile page shows no game stats
- TUI displays correctly with RawBin branding


## Subtasks
None (atomic task).
## Acceptance Criteria
- [x] Server compiles and starts
- [x] No references to game concepts (cards, deck, rounds, scoring, bots, leaderboard)
- [x] profiles.json and devices.json separated
- [x] PROFILE response only includes requesting user's devices
- [x] All vitest tests pass
- [x] ~900 lines or less
