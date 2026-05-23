[Back to Sprint 1 Planning](./planning.md)

# Task 5: Create RoomUI Client Components

[task:uuid:4e4f3530-db7c-479f-902b-a5aefefba3e6]

**Status:** DONE
**Assigned:** robbin-expert (implement), robbin-tester (verify)
**Estimated effort:** 2h expert + 1h tester
**Priority:** 5 (HIGH — user-facing)
**Depends on:** Task 3 (Room.ts), Task 4 (stripped server.ts)


## Traceability
- up
  - [sprint-1-rawbin-foundation Planning](./planning.md)
- down
  - None
## Goal

Create the client-side Room UI: room browser (lobby) and room view (inside a room). Strip all game UI, reuse Lit component patterns.

## Source

- `workspaces/UpDown/qnd/src/public/ts/LobbyUI.ts` (410 lines)
- `workspaces/UpDown/qnd/src/public/ts/MultiplayerUI.ts` (880 lines — for chat pattern)
- `workspaces/UpDown/qnd/src/public/ts/WebSocketClient.ts` (227 lines)

## Target

- `workspaces/Web4RawBin/src/public/ts/RoomBrowser.ts` (~250 lines)
- `workspaces/Web4RawBin/src/public/ts/RoomView.ts` (~200 lines)
- `workspaces/Web4RawBin/src/public/ts/RawBinClient.ts` (~200 lines)
- `workspaces/Web4RawBin/src/public/ts/app.ts` (~30 lines)

## Requirements

### 5.1 Expert: Create RawBinClient.ts (from WebSocketClient.ts)

- Rename class: `WebSocketClient` → `RawBinClient`
- Strip game-specific event handlers (ROUND_START, CARD_PLAYED, GAME_OVER, etc.)
- Keep: connect, reconnect, IDENTIFY, PROFILE, ROOM_LIST, ROOM_JOINED, ROOM_LEFT, CHAT_MESSAGE, ERROR, SERVER_CONFIG, TOKEN_REDIRECT, CONSOLIDATE_OK/FAILED, BUG_REPORT_OK, SECRET_CODE_OK/FAILED, MEMBER_JOINED/LEFT/DISCONNECTED, HOST_CHANGED
- Add: event bus for new MEMBER_* events (was PLAYER_*)

### 5.2 Expert: Create RoomBrowser.ts (from LobbyUI.ts)

**KEEP from LobbyUI:**
- Room list display (name, member count, private/public indicator)
- Create room form (name, max members, optional room key)
- Join room (click to join, room key prompt for private rooms)
- Profile link, bug report link

**REMOVE from LobbyUI:**
- Game-specific room info (round number, game state indicator)
- Spectate button (keep if spectator pattern retained — YES per architect)
- Game-specific styling

**ADD:**
- Room state indicator: active / archived
- Owner badge on rooms you created
- Delete button for rooms you own

### 5.3 Expert: Create RoomView.ts (NEW)

This is the inside-a-room view. In QnD this was the game board — in RawBin it's a workspace.

**Components:**
- Member list sidebar (name + avatar, online/offline indicator, host badge)
- Chat panel (reuse chat pattern from MultiplayerUI)
- Room settings panel (for host: rename, max members, privacy, archive, delete)
- Leave room button

**Chat from MultiplayerUI (reuse):**
- Message input with send button
- Message history display (sender name, timestamp, text)
- 200 char limit per message, 50 message history

### 5.4 Expert: Create app.ts entry point

- `app.ts` replaces `multiplayer.ts`
- Import RawBinClient, RoomBrowser, RoomView
- Connection logic: connect WS, show RoomBrowser, switch to RoomView on join
- Handle IDENTIFY on connect (localStorage token + deviceId)

### 5.5 Expert: Update app.html (from multiplayer.html)

- Rename title: "RawBin"
- Update script src: `dist/app.js`
- Keep PWA meta tags, update theme-color if brand decided

### 5.6 Expert: Update esbuild config

In package.json scripts:
- `build`: change `multiplayer.ts` → `app.ts`, output `app.js`
- Keep `main.ts` → `main.js` for PWA entry

### 5.7 Tester: Verify client UI

- App loads in browser at `/app`
- Room list displays correctly
- Can create a room
- Can join a room
- Inside room: member list, chat, settings visible
- Chat works (send/receive messages)
- Can leave room (returns to browser)
- Owner can delete room
- Profile and bug-report links work


## Subtasks
None (atomic task).
## Acceptance Criteria
- [x] `npm run build` succeeds (esbuild bundles app.js)
- [x] App loads in browser with no console errors
- [x] Full room lifecycle works (create → join → chat → leave → delete)
- [x] No references to game concepts in client code
- [x] Responsive on mobile (PWA)
