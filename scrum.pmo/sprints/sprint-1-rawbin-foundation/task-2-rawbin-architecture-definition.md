[Back to Sprint 1 Planning](./planning.md)

# Task 2: RawBin Architecture Definition

[task:uuid:19442916-8dac-490a-bdc1-61f2c1e27da8]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [ ] QA Review
- [ ] Done


## Traceability
- up
  - [sprint-1-rawbin-foundation Planning](./planning.md)
- down
  - None
## Source: QnD Codebase Audit

Total: 7,549 lines across 23 TypeScript files + 3 HTML + 2 CSS + manifest + package.json

### File Inventory (23 .ts files)

| File | Lines | Category | Decision |
|------|-------|----------|----------|
| **Server** | | | |
| `server.ts` | 1,680 | Server + TUI + HTTP routes + WS handlers | **KEEP + STRIP** |
| `GameRoom.ts` | 864 | Game room + RoomManager | **FORK → Room.ts** |
| `BotPlayer.ts` | 126 | Bot AI for card game | **REMOVE** |
| `SpecialCards.ts` | 164 | Special card resolution | **REMOVE** |
| **Shared** | | | |
| `MessageTypes.ts` | 73 | WS message type enum | **KEEP + STRIP** |
| `CardUtils.ts` | 18 | Card numeric value mapping | **REMOVE** |
| `ScoreCalculator.ts` | 11 | Score/diamond calculation | **REMOVE** |
| `SpecialCardInfo.ts` | 24 | Card catalog + info map | **REMOVE** |
| **Client** | | | |
| `WebSocketClient.ts` | 227 | WS connection + event bus | **KEEP + RENAME** |
| `LobbyUI.ts` | 410 | Room list + join/create UI | **KEEP + STRIP** |
| `MultiplayerUI.ts` | 880 | Game rendering + interaction | **REMOVE** |
| `GameUI.ts` | 264 | Single-player game UI | **REMOVE** |
| `GameModel.ts` | 118 | Game state model | **REMOVE** |
| `Card.ts` | 63 | Card display component | **REMOVE** |
| `main.ts` | 124 | PWA entry + game-board import | **KEEP + STRIP** |
| `multiplayer.ts` | 46 | Multiplayer entry point | **FORK → app.ts** |
| **Components** | | | |
| `Header.ts` | 59 | Header bar component | **KEEP + REBRAND** |
| `game-board.ts` | 1,141 | Lit game board web component | **REMOVE** |
| `game-card.ts` | 172 | Card flip animation component | **REMOVE** |
| `game-controls.ts` | 300 | Up/Down/Equal buttons | **REMOVE** |
| `game-stats.ts` | 146 | Score/streak display | **REMOVE** |
| `keyboard-shortcuts.ts` | 137 | Game keyboard shortcuts | **REMOVE** |
| `player-notification.ts` | 502 | Toast notifications (Lit) | **KEEP** |

### Line Count Summary

| Category | QnD Lines | RawBin Lines (est.) | Decision |
|----------|-----------|---------------------|----------|
| KEEP + STRIP | ~2,436 | ~1,200 | server, MessageTypes, WebSocketClient, LobbyUI, main |
| KEEP AS-IS | ~561 | ~561 | Header, player-notification |
| FORK + REWRITE | ~910 | ~400 | GameRoom→Room, multiplayer→app |
| REMOVE | ~3,642 | 0 | All game logic + game UI |
| **Total** | **7,549** | **~2,161** | **71% removed** |

---

## Question 1: Server Routes — KEEP vs REMOVE

### HTTP Routes (server.ts handleRequest)

| Route | Lines | Decision | Reason |
|-------|-------|----------|--------|
| `POST /api/bug-status` | 273-291 | **KEEP** | Bug report lifecycle management |
| `GET /api/bugs` | 293-303 | **KEEP** | Aggregated bug view for PO |
| `GET /api/leaderboard` | 306-321 | **REMOVE** | Game-specific scoring |
| `GET /api/config` | 325-329 | **KEEP** | Client config (domain, port, version) |
| `/docs` + `/docs/*.md` | 336-357 | **KEEP** | Markdown documentation viewer |
| `/md/*.md` | 358-371 | **KEEP** | Project-root markdown viewer (sprint planning!) |
| `/` + `/index.html` | 377-378 | **KEEP** | Landing page (rebrand to RawBin) |
| `/js` + `/ts` | 379-382 | **REMOVE** | Single-player game entry points |
| `/mp` + `/multiplayer` | 383-384 | **RENAME → /app** | Multiplayer entry → RawBin main app |
| `/bug-report` | 385-447 | **KEEP** | Bug report form page |
| `/profile` | 449-512 | **KEEP + STRIP** | Profile page — remove game stats (gamesPlayed, wins, bestScore, bestStreak, diamonds) |
| `/leaderboard` | 514-546 | **REMOVE** | Game leaderboard page |
| Static file serving | 549-576 | **KEEP** | Core infrastructure |

### WebSocket Message Handlers (handleGameMessage)

| Message | Lines | Decision | Reason |
|---------|-------|----------|--------|
| `CREATE_ROOM` | 776-796 | **KEEP** | User-created rooms (already has creator pattern) |
| `JOIN_ROOM` | 799-832 | **KEEP** | Room joining with dedup |
| `LEAVE_ROOM` | 835-854 | **KEEP** | Room leaving with cleanup |
| `DELETE_ROOM` | 856-866 | **KEEP** | Creator-only room deletion |
| `REMOVE_ROOM` | 869-888 | **KEEP** | Host/empty room removal |
| `LIST_ROOMS` | 891-893 | **KEEP** | Room listing |
| `START_GAME` | 896-903 | **REMOVE** | Game start command |
| `TOGGLE_COUNTDOWN` | 905-911 | **REMOVE** | Game countdown toggle |
| `FORCE_NEXT_ROUND` | 914-920 | **REMOVE** | Game round forcing |
| `PLAY_AGAIN` | 923-932 | **REMOVE** | Game replay |
| `PLAY_CARD` | 934-940 | **REMOVE** | Up/Down/Equal guess |
| `PLAY_SPECIAL` | 942-947 | **REMOVE** | Special card play |
| `ADD_BOT` | 950-956 | **REMOVE** | Bot player injection |
| `SPECTATE_ROOM` / `SPECTATE` | 959-968 | **KEEP** | Spectator/observer pattern |
| `LEAVE_SPECTATE` | 971-977 | **KEEP** | Leave spectator mode |
| `JOIN_NEXT_GAME` | 980-986 | **RENAME** | Promote spectator → join room |
| `CHAT_MESSAGE` | 989-1001 | **KEEP** | Room chat |
| `GAME_STATE` | 1004-1009 | **REMOVE** | Game state query |
| `IDENTIFY` | 1012-1056 | **KEEP** | Token-based identity + device tracking |
| `GET_LEADERBOARD` | 1058-1074 | **REMOVE** | Leaderboard query |
| `CONSOLIDATE` | 1077-1135 | **KEEP** | Account linking/merge |
| `UPDATE_SECRET_CODE` | 1138-1149 | **KEEP** | Secret code management |
| `BUG_REPORT` | 1151-1179 | **KEEP** | Bug submission pipeline |
| `PAIR_BUG_REPORT` | 1181-1189 | **KEEP** | Agent pairing for bug reports |

### Server Infrastructure (KEEP all)

| Component | Lines | Notes |
|-----------|-------|-------|
| .env loading | 33-39 | Manual parse, no deps |
| Local IP detection | 43-51 | Network interface scan |
| MIME types | 63-76 | Static file serving |
| Client session tracking | 82-106 | IP + UA tracking |
| PlayerProfile interface | 120-139 | **STRIP** game stats fields |
| Profile load/save | 143-167 | JSON persistence |
| Bug report forwarding | 174-189 | otmux → PO pane pipeline |
| Avatar fetch | 649-660 | thispersondoesnotexist.com |
| SSL certificate generation | 581-600 | Self-signed cert |
| HTTP/HTTPS server setup | 605-644 | Dual-protocol |
| WebSocket server setup | 666-737 | WS lifecycle |
| TUI (help/status/clients/log) | 1212-1680 | Terminal UI (rebrand branding) |

---

## Question 2: GameRoom → Room

**Yes. GameRoom should become Room with no game state.**

### What GameRoom currently does (864 lines)

**Infrastructure (KEEP — ~300 lines):**
- Room identity: id, name, hostId, maxPlayers, isPrivate, roomKey
- Player management: addPlayer, removePlayer, broadcast
- Spectator management: addSpectator, removeSpectator, promoteSpectator
- Chat: chatHistory array
- Creator lifecycle: creatorToken, creatorClientId, setCreator
- Room info: info() method returning RoomInfo
- RoomManager: createRoom, getRoom, removeRoom, listRooms, findPlayerRoom, findSpectatorRoom, cleanupStale

**Game logic (REMOVE — ~564 lines):**
- Card deck: SUITS, VALUES, Card interface, deck shuffle, dealing
- Game state machine: RoomState 'waiting'→'countdown'→'revealing'→'exchange'→'finished'
- Round management: startGame, nextRound, resolveRound, forceNextRound
- Player game state: RoomPlayer.score, streak, alive, currentGuess, specialCard, inventory, frozen
- Countdown timer: countdownEnabled, countdownTimer, countdownSeconds
- Bot integration: bots Map, addBot, bot scheduling
- Special cards: playSpecialCard, inventory management
- Score recording: leaderboard generation, gameOverCallback
- Auto-start: lobby countdown, minPlayers, autoStart
- Preset rooms: createPresetRooms, autoRecreate
- T83 fix: host elimination + countdown auto-enable

### Proposed Room.ts structure

```typescript
export type RoomState = 'active' | 'archived';

export interface RoomMember {
  id: string;           // clientId
  ws: WebSocket;
  name: string;
  avatarUrl: string;
  playerToken: string;
  disconnected: boolean;
}

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

export class Room {
  // Identity
  id: string;
  name: string;
  hostId: string;
  maxMembers: number;
  isPrivate: boolean;
  roomKey: string | null;
  state: RoomState = 'active';
  createdAt: number = Date.now();

  // Creator lifecycle (from BR-015 spec)
  creatorToken: string = '';
  creatorClientId: string = '';

  // Members
  members: Map<string, RoomMember> = new Map();
  spectators: Map<string, { id: string; ws: WebSocket; name: string }> = new Map();
  chatHistory: { senderId: string; senderName: string; text: string; timestamp: number }[] = [];

  // Methods (from GameRoom, stripped of game logic)
  addMember(id, ws, name, avatarUrl, playerToken): boolean
  removeMember(id): void
  addSpectator(id, ws, name): void
  removeSpectator(id): void
  promoteSpectator(id, name, avatarUrl): boolean
  broadcast(msg): void
  info(): RoomInfo
  setCreator(playerToken, clientId): void

  // NEW: Owner lifecycle control
  archive(): void        // state → 'archived', notify members
  // delete handled by RoomManager.removeRoom
}

export class RoomManager {
  // NO preset rooms, NO autoRecreate
  createRoom(name, hostId, maxMembers, roomKey): Room
  getRoom(id): Room | undefined
  removeRoom(id): void
  listRooms(): RoomInfo[]
  findMemberRoom(memberId): Room | undefined
  findSpectatorRoom(spectatorId): Room | undefined
  cleanupStale(): number
}
```

**Key differences from GameRoom:**
1. No deck, no cards, no rounds, no scoring
2. `players` → `members` (semantic: they're room members, not game players)
3. `RoomState` simplified: just `'active' | 'archived'` (no waiting/countdown/revealing/exchange/finished)
4. No preset rooms, no autoRecreate — all rooms user-created
5. No bots, no countdown, no auto-start
6. Creator lifecycle retained (BR-015 pattern: creatorToken, DELETE_ROOM)

---

## Question 3: Renamed Project Structure

```
rawbin/
├── package.json                    # name: "rawbin", no game keywords
├── tsconfig.json
├── vitest.config.ts
├── .env                            # BASE_DOMAIN, ADMIN_KEY
├── .gitignore
├── README.md                       # RawBin — AI Server Management
├── STRUCTURE.md                    # Updated architecture doc
│
├── data/
│   ├── profiles.json               # User profiles (stripped of game stats)
│   ├── bug-reports.json             # Bug report fallback storage
│   └── agent-pairing.json           # Bug report target pane
│
├── docs/                            # Markdown docs served at /docs
│
├── spec/                            # Specs and traceability
│
├── src/
│   ├── ts/
│   │   ├── server/
│   │   │   ├── server.ts            # HTTPS + WS + HTTP routes + TUI (rebranded)
│   │   │   └── Room.ts              # Room + RoomMember + RoomManager (no game)
│   │   └── shared/
│   │       └── MessageTypes.ts      # Stripped: only room/identity/chat/bug messages
│   │
│   ├── public/
│   │   ├── index.html               # Landing page (rebranded to RawBin)
│   │   ├── app.html                 # Main app (was multiplayer.html)
│   │   ├── styles.css               # Base styles (rebranded colors/branding)
│   │   ├── app.css                  # App styles (was multiplayer.css)
│   │   ├── manifest.json            # PWA manifest (name: "RawBin", categories: ["utilities"])
│   │   ├── dist/                    # esbuild output
│   │   │   ├── main.js              # PWA entry bundle
│   │   │   └── app.js               # Main app bundle (was multiplayer.js)
│   │   └── ts/
│   │       ├── main.ts              # PWA entry (stripped of game-board import)
│   │       ├── app.ts               # App entry (was multiplayer.ts — Lobby + Room)
│   │       ├── RawBinClient.ts      # WS client (was WebSocketClient.ts)
│   │       ├── LobbyUI.ts           # Room list + create (stripped of game join UX)
│   │       ├── RoomUI.ts            # Room view (NEW — chat + members + settings)
│   │       └── components/
│   │           ├── Header.ts         # Rebranded header
│   │           └── player-notification.ts  # Toast notifications (keep as-is)
│   │
│   └── sh/
│       ├── rawbin.sh                # Start script (was updown.sh)
│       └── stop.sh                  # Stop script
│
├── test/                            # Vitest tests
└── session/                         # Agent session data
```

### Files REMOVED entirely (not in tree above)

| Removed File | Reason |
|-------------|--------|
| `GameRoom.ts` | Replaced by Room.ts |
| `BotPlayer.ts` | No game, no bots |
| `SpecialCards.ts` | No game |
| `CardUtils.ts` | No cards |
| `ScoreCalculator.ts` | No scoring |
| `SpecialCardInfo.ts` | No special cards |
| `MultiplayerUI.ts` | Game UI, replaced by RoomUI.ts |
| `GameUI.ts` | Single-player game |
| `GameModel.ts` | Game state model |
| `Card.ts` | Card rendering |
| `game-board.ts` | Lit game board |
| `game-card.ts` | Card flip component |
| `game-controls.ts` | Up/Down/Equal buttons |
| `game-stats.ts` | Score display |
| `keyboard-shortcuts.ts` | Game shortcuts |
| `index-js.html` | JS game entry |
| `index-ts.html` | TS game entry |
| `multiplayer.html` | Replaced by app.html |
| `multiplayer.css` | Replaced by app.css |

---

## PlayerProfile: Privacy Boundary (STRICT separation)

PO directive: "User profile and device data strictly separated per user."

### Current QnD PlayerProfile (server.ts:120-139)

All profile data in one flat object. `GET /profile` + `MSG.PROFILE` send the entire object to the client including all devices.

### RawBin Change: Per-User Data Isolation

```typescript
interface PlayerProfile {
  token: string;
  name: string;
  avatar: string;
  secretCode: string;
  consolidatedFrom: string[];
  redirectTo?: string;
  bugReports: { date: string; text: string; status: string }[];
  // REMOVED: gamesPlayed, wins, totalScore, totalDiamonds, bestScore, bestStreak, bestRank, lastPlayed
  // REMOVED: phone, url (privacy — move to optional vCard)
}

interface DeviceRecord {
  deviceId: string;
  ownerToken: string;       // FK to PlayerProfile.token
  userAgent: string;
  ip: string;
  screenSize: string;
  platform: string;
  firstSeen: string;
  lastSeen: string;
  connectionCount: number;
}
```

**Separation rules:**
1. `profiles.json` stores only identity + bug reports (no device data)
2. `devices.json` stores device records keyed by `ownerToken`
3. `MSG.PROFILE` response NEVER includes another user's devices
4. `/profile` page only shows YOUR devices (current behavior, but now enforced by data separation)
5. Room member list shows name + avatar only — no token, no IP, no device info
6. CONSOLIDATE merges device ownership by updating `ownerToken` in device records

---

## MessageTypes: Stripped for RawBin

```typescript
export const MSG = {
  // Client → Server (Room lifecycle)
  CREATE_ROOM: 'CREATE_ROOM',
  JOIN_ROOM: 'JOIN_ROOM',
  LEAVE_ROOM: 'LEAVE_ROOM',
  LIST_ROOMS: 'LIST_ROOMS',
  DELETE_ROOM: 'DELETE_ROOM',
  REMOVE_ROOM: 'REMOVE_ROOM',

  // Client → Server (Room interaction)
  CHAT_MESSAGE: 'CHAT_MESSAGE',
  SPECTATE: 'SPECTATE',
  LEAVE_SPECTATE: 'LEAVE_SPECTATE',
  JOIN_ROOM_FROM_SPECTATE: 'JOIN_ROOM_FROM_SPECTATE',  // was JOIN_NEXT_GAME

  // Client → Server (Identity)
  IDENTIFY: 'IDENTIFY',
  CONSOLIDATE: 'CONSOLIDATE',
  UPDATE_SECRET_CODE: 'UPDATE_SECRET_CODE',
  BUG_REPORT: 'BUG_REPORT',
  PAIR_BUG_REPORT: 'PAIR_BUG_REPORT',

  // Server → Client (Room)
  ROOM_LIST: 'ROOM_LIST',
  ROOM_JOINED: 'ROOM_JOINED',
  ROOM_LEFT: 'ROOM_LEFT',
  ROOM_DELETED: 'ROOM_DELETED',
  MEMBER_JOINED: 'MEMBER_JOINED',    // was PLAYER_JOINED
  MEMBER_LEFT: 'MEMBER_LEFT',        // was PLAYER_LEFT
  MEMBER_DISCONNECTED: 'MEMBER_DISCONNECTED',  // was PLAYER_DISCONNECTED
  HOST_CHANGED: 'HOST_CHANGED',
  CHAT_HISTORY: 'CHAT_HISTORY',

  // Server → Client (Spectator)
  SPECTATE_JOINED: 'SPECTATE_JOINED',
  SPECTATE_LEFT: 'SPECTATE_LEFT',
  SPECTATOR_JOINED: 'SPECTATOR_JOINED',
  SPECTATOR_LEFT: 'SPECTATOR_LEFT',

  // Server → Client (Identity)
  SERVER_CONFIG: 'SERVER_CONFIG',
  ERROR: 'ERROR',
  PROFILE: 'PROFILE',
  TOKEN_REDIRECT: 'TOKEN_REDIRECT',
  CONSOLIDATE_OK: 'CONSOLIDATE_OK',
  CONSOLIDATE_FAILED: 'CONSOLIDATE_FAILED',
  SECRET_CODE_OK: 'SECRET_CODE_OK',
  SECRET_CODE_FAILED: 'SECRET_CODE_FAILED',
  BUG_REPORT_OK: 'BUG_REPORT_OK',
  PAIR_OK: 'PAIR_OK',
} as const;
```

**Removed messages (25):** START_GAME, PLAY_CARD, PLAY_SPECIAL, ADD_BOT, GAME_STATE, TOGGLE_COUNTDOWN, FORCE_NEXT_ROUND, PLAY_AGAIN, GET_LEADERBOARD, SPECTATE_ROOM, JOIN_NEXT_GAME, ROUND_START, COUNTDOWN, CARD_PLAYED, ROUND_RESULT, GAME_OVER, SPECIAL_CARD_PLAYED, BOTS_FILLED, LOBBY_COUNTDOWN, LOBBY_COUNTDOWN_CANCELLED, AUTO_START, ROOM_RESET, COUNTDOWN_SETTING, LEADERBOARD, PLAYER_JOINED/LEFT/DISCONNECTED (renamed)

---

## Dependencies (package.json)

| Dependency | QnD | RawBin | Reason |
|-----------|-----|--------|--------|
| `ws` | Yes | **KEEP** | WebSocket server |
| `marked` | Yes | **KEEP** | Markdown rendering for docs/sprint viewer |
| `node-fetch` | Yes | **KEEP** | Avatar fetch |
| `qrcode` | Yes | **KEEP** | Room sharing via QR |
| `lit` | Yes | **KEEP** | Web component framework (notifications) |
| `@types/ws` | Yes | **KEEP** | TypeScript types |
| `esbuild` | Yes | **KEEP** | Client bundling |
| `tsx` | Yes | **KEEP** | Dev server runner |
| `vitest` | Yes | **KEEP** | Testing |
| `@playwright/test` | Yes | **KEEP** | E2E testing |
| `@types/node-fetch` | Yes | **KEEP** | Types |

All deps survive. No new deps needed for the base fork.

---

## Summary for PO

| Metric | QnD | RawBin |
|--------|-----|--------|
| Total .ts files | 23 | 12 |
| Total lines | 7,549 | ~2,161 |
| Server files | 4 | 2 (server.ts, Room.ts) |
| Client files | 15 | 7 (app.ts, RawBinClient, LobbyUI, RoomUI, Header, notification, main) |
| Shared files | 4 | 1 (MessageTypes.ts) |
| WS messages | 46 | 31 |
| HTTP routes | 12 | 8 |
| npm deps | 11 | 11 (same) |


## QA Audit & User Feedback

## Subtasks
None (atomic task).
