# Task 2: Define RawBin Architecture (Fork from QnD Stack)

[task:uuid:b1a959d9-0388-4f9e-97fb-991dc73b4441]

**Status:** DONE
**Assigned:** robbin-po, robbin-architect
**Created:** 2026-05-22
**Completed:** 2026-05-22


## Traceability
- up
  - [sprint-1-rawbin-foundation Planning](./planning.md)
- down
  - None
## Goal

Define what RawBin keeps, removes, and renames from the QnD (UpDown card game) stack. RawBin is an AI-driven server management interface, not a game.

## Source Stack: QnD (workspaces/UpDown/qnd/)

**Tech:** TypeScript ESM, Node.js HTTPS server, WebSocket (ws), Lit components, PWA, esbuild, vitest, tsx
**Server:** 1681-line monolith (server.ts) + GameRoom.ts (864), BotPlayer.ts (126), SpecialCards.ts (164)
**Client:** Lit web components — LobbyUI, MultiplayerUI, GameUI, GameModel, Card + 7 components
**Data:** profiles.json (per-token profiles with devices, stats, bug reports)

## KEEP (reuse with minimal changes)

### Server Infrastructure
- HTTPS + HTTP server core (self-signed SSL, cert generation)
- WebSocket server setup + client tracking
- TUI (terminal UI with keyboard commands)
- `.env` manual parser
- Local IP detection
- MIME types, static file serving, directory traversal protection
- Graceful shutdown handlers
- Periodic cleanup interval pattern

### Routes
| Route | Purpose |
|-------|---------|
| `/` | Landing page (rewrite for RawBin) |
| `/profile` | User profile page (strip game stats) |
| `/bug-report` | Bug report page (reuse as-is) |
| `/docs` + `/docs/*.md` | Docs directory browser |
| `/md/*.md` | Project-wide markdown renderer |
| `/api/config` | Client config endpoint |
| `/api/bug-status` | Bug report status API |
| `/api/bugs` | Bug list API |

### WebSocket Messages (keep)
- `IDENTIFY` — user/device registration + profile create/update
- `TOKEN_REDIRECT` — consolidated profile redirect
- `PROFILE` — send profile to client
- `CONSOLIDATE` — account linking via secret code
- `UPDATE_SECRET_CODE` — change 4-digit code
- `BUG_REPORT` / `BUG_REPORT_OK` — bug pipeline
- `PAIR_BUG_REPORT` / `PAIR_OK` — agent pairing
- `SERVER_CONFIG` — push config to client
- `ERROR` — error messages
- `CHAT_MESSAGE` — room chat (keep for RawBin rooms)
- `CREATE_ROOM` / `JOIN_ROOM` / `LEAVE_ROOM` / `DELETE_ROOM` / `LIST_ROOMS` — room lifecycle
- `ROOM_LIST` / `ROOM_JOINED` / `ROOM_LEFT` / `ROOM_DELETED` — room events

### Data Model (keep, modify)
- `PlayerProfile` → `UserProfile` (strip game fields)
- `DeviceInfo` — keep as-is
- `ClientSession` / `WebSocketClient` — keep

### Client
- `WebSocketClient.ts` — reuse
- `Header.ts` — reuse/rebrand
- `LobbyUI.ts` — heavy refactor (becomes room browser, no game)
- `player-notification.ts` — reuse
- PWA manifest + service worker — rebrand
- `multiplayer.html` → `index.html` (single entry point)
- `styles.css` + `multiplayer.css` — keep base, rebrand colors

## REMOVE (game-only, no RawBin equivalent)

### Server Files (delete entirely)
- `BotPlayer.ts` — game bots
- `SpecialCards.ts` — game mechanic

### Shared Files (delete entirely)
- `ScoreCalculator.ts`, `CardUtils.ts`, `SpecialCardInfo.ts` — game math

### Client Files (delete entirely)
- `GameUI.ts`, `GameModel.ts`, `Card.ts` — game UI
- `game-board.ts`, `game-card.ts`, `game-controls.ts`, `game-stats.ts` — game components
- `keyboard-shortcuts.ts` — game shortcuts
- `main.ts` — single-player entry (keep multiplayer.ts as base)
- `index.html`, `index-js.html`, `index-ts.html` — old entry points
- `js/game.js` — vanilla JS game

### Routes (remove)
| Route | Reason |
|-------|--------|
| `/leaderboard` | Game scoring |
| `/api/leaderboard` | Game scoring |
| `/js`, `/ts` | Old game entry points |
| `/mp`, `/multiplayer` | Rename to `/` |

### WebSocket Messages (remove)
- `START_GAME`, `PLAY_CARD`, `PLAY_SPECIAL` — game actions
- `ADD_BOT`, `TOGGLE_COUNTDOWN`, `FORCE_NEXT_ROUND`, `PLAY_AGAIN` — game control
- `ROUND_START`, `COUNTDOWN`, `CARD_PLAYED`, `ROUND_RESULT`, `GAME_OVER` — game events
- `SPECIAL_CARD_PLAYED`, `BOTS_FILLED`, `LOBBY_COUNTDOWN*`, `AUTO_START`, `ROOM_RESET` — game events
- `SPECTATE*`, `JOIN_NEXT_GAME` — spectator system (game-specific)
- `GET_LEADERBOARD`, `LEADERBOARD` — game stats
- `COUNTDOWN_SETTING` — game setting

### GameRoom.ts (gut, don't delete)
- Remove: deck, cards, rounds, scoring, bot management, spectators, game state machine
- Keep: room identity, player map, broadcast, chat, room lifecycle methods
- Rename: `GameRoom` → `Room`

## RENAME

| From | To | Notes |
|------|-----|-------|
| `updown-qnd` (package.json) | `rawbin` | |
| `GameRoom` class | `Room` | Strip game state |
| `RoomManager` | `RoomManager` | Strip game callbacks |
| `PlayerProfile` interface | `UserProfile` | Remove game stats fields |
| `recordGameResults()` | remove | |
| `createPresetRooms()` | remove | All rooms user-created |
| `RoomState` type | simplify: `'active' \| 'archived'` | No game states |
| `RoomPlayer` interface | `RoomMember` | Strip game fields |
| `upDownTeam` bug target | `robbinTeam` | |
| `UpDown` in all strings | `RawBin` | |
| theme colors `#667eea/#764ba2` | TBD (RawBin brand) | |

## KEY ARCHITECTURE DECISIONS

### 1. Room = Shared Workspace (owner-controlled)
- A room is a shared workspace: chat + monitoring + server control
- Robbin (AI assistant) joins rooms as a member
- No preset rooms — all user-created
- Owner can: create, rename, configure permissions, archive, delete
- Room persists until owner deletes — survives server restarts
- Room settings: name, max members, private/public, room key
- Storage: file-backed JSON per room (in-memory + disk persistence)

### 2. Privacy Boundary (strict per-user)
- Device list is NEVER shared — private to profile owner
- Other room members see: display name, avatar only
- Secret code stays for account linking (same mechanism)
- Bug reports are private (visible only to submitter + admin)
- IP addresses never exposed to other users

### 3. UserProfile (stripped from PlayerProfile)
**Keep:** token, name, avatar, phone, url, devices[], secretCode, consolidatedFrom[], redirectTo?, bugReports[]
**Remove:** gamesPlayed, wins, totalScore, totalDiamonds, bestScore, bestStreak, bestRank, lastPlayed
**Add (later):** role (in RawBin context), permissions, preferences

### 4. Project Structure (target)
```
rawbin/
├── package.json          # name: rawbin
├── tsconfig.json
├── vitest.config.ts
├── data/
│   └── profiles.json     # UserProfile[]
├── src/
│   ├── ts/
│   │   ├── server/
│   │   │   ├── server.ts   # Main server (stripped of game routes)
│   │   │   ├── Room.ts     # Room lifecycle (no game state)
│   │   │   └── .certs/
│   │   └── shared/
│   │       └── MessageTypes.ts  # Pruned message types
│   ├── public/
│   │   ├── index.html      # Single entry point
│   │   ├── styles.css
│   │   ├── manifest.json   # RawBin PWA
│   │   ├── sw.js
│   │   └── ts/
│   │       ├── main.ts     # Client entry
│   │       ├── RoomBrowser.ts    # Room listing + join
│   │       ├── RoomView.ts       # Inside-room UI
│   │       ├── WebSocketClient.ts
│   │       └── components/
│   │           ├── Header.ts
│   │           └── player-notification.ts
│   └── sh/
│       ├── rawbin.sh
│       └── stop.sh
├── docs/
├── spec/
└── test/
    └── vitest/
```

## Tron's Answers (2026-05-22)
1. **Room purpose:** All of the above — a room is a shared workspace: chat, monitoring dashboards, server control panels. Robbin (the AI) joins rooms as an assistant member. Think Discord server channels but for infrastructure.
2. **Persistence:** Yes, rooms MUST persist across restarts. Move to file-based storage — JSON files per room, per user profile. In-memory with file-backed persistence.
3. **Brand colors:** Decide later. Keep UpDown's color system for now, just swap the name.
4. **Git repo:** Already done — web4x/Web4RawBin on GitHub, cloned at workspaces/Web4RawBin/.

## Architect Analysis (co-signed)

Architect wrote detailed 458-line analysis at `task-2-rawbin-architecture-definition.md`.
Key additions merged into this plan:

1. **Data separation**: Split `profiles.json` (identity+bugs) from `devices.json` (device records with `ownerToken` FK). Enforces privacy at the storage layer, not just the API layer.
2. **Spectator pattern**: KEEP for room observers (useful for monitoring dashboards).
3. **Line count**: 23 → 12 files, 7,549 → ~2,161 lines (71% removed).
4. **Renamed client files**: `WebSocketClient.ts` → `RawBinClient.ts`, `multiplayer.ts` → `app.ts`, `/mp` → `/app`.
5. **Effort estimate**: ~8h expert work (Room.ts 2h, strip server.ts 3h, RoomUI.ts 2h, rebrand 1h) + tester verification.
6. **All npm deps survive** — no new deps needed for base fork.


## Subtasks
None (atomic task).
## Acceptance Criteria
- [x] PO + architect agree on keep/remove/rename lists
- [x] Tron approves architecture decisions (2026-05-22)
- [x] Task file committed to Web4RawBin repo
