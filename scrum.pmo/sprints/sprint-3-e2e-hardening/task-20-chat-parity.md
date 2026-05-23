[Back to Sprint 3 Planning](./planning.md)

# T20: Room Chat Parity with UpDown

[task:uuid:8e980a4c-8abc-4a35-a5cf-abc76d944f31]

**Status:** DONE
**Assigned:** robbin-expert
**Effort:** 3h expert
**Dependencies:** None
**Created:** 2026-05-23
**Completed:** 2026-05-23


## Traceability
- up
  - [sprint-3-e2e-hardening Planning](./planning.md)
- down
  - None
## Problem

RawBin chat is either broken or renders as a flat inline panel. UpDown had a polished bottom-sheet chat drawer with drag handle, WS status indicator, message peek preview, QR invite popup, and transform animations. The chat was the primary interaction surface — losing it breaks the core UX.

## Requirements

### 20.1 Bottom sheet pattern
Port from QnD `MultiplayerUI.ts` lines 266-277, `multiplayer.css` lines 387-456:
- Fixed-position sheet at bottom of screen
- Collapsed state: shows handle bar + last message peek (52px visible)
- Expanded state: full chat with messages + input
- Transform animation: `translateY(calc(100% - 52px))` ↔ `translateY(0)`
- Backdrop blur (10px) on dark background (`rgba(20, 20, 40, 0.95)`)

### 20.2 Drag handle
- Visual bar at top of sheet (40px × 4px rounded, centered)
- Touch drag to expand/collapse (touchstart/touchmove/touchend)
- Click to toggle expanded/collapsed
- Passive touch listeners for scroll performance

### 20.3 Chat messages
- Scrollable message list
- Sender name in cyan (`#4dd0e1`), bold
- Message text with `white-space: pre-wrap`
- Auto-scroll to bottom on new message
- 200 char input limit
- Send button + Enter key to send

### 20.4 Message preview peek
When chat is collapsed and a new message arrives:
- Show sender name + first 40 chars as a peek notification
- Auto-hide after 3 seconds
- Tap peek to expand chat

### 20.5 WebSocket status indicator
- Green dot: connected
- Red dot: disconnected
- Orange dot: reconnecting
- Click to manually reconnect
- Position: in chat header area

### 20.6 Chat invite with QR
Port from QnD lines 403-407:
- `📨 Invite` button in chat header
- Opens popup with QR code for room share URL
- URL format: `https://home.donges.it:4444/app?room=<roomId>`
- Uses existing `qrcode` npm dependency

### 20.7 Verify chat actually works end-to-end
- CHAT_MESSAGE sent via WS
- Server broadcasts to all room members
- Messages appear in chat for all participants
- Chat history preserved on rejoin

## Source Reference
- QnD: `MultiplayerUI.ts` lines 266-277 (HTML), 394-447 (logic), `multiplayer.css` lines 387-456 (styling)


## Subtasks
None (atomic task).
## Acceptance Criteria
- [x] Chat renders as bottom sheet (collapsed by default)
- [x] Drag handle expands/collapses sheet
- [x] Messages display with colored sender names
- [x] Send works (Enter + button)
- [x] Message peek preview on new message while collapsed
- [x] WS status indicator (green/red/orange)
- [x] QR invite popup works
- [x] Chat works between multiple users in same room
- [x] Chat history preserved on rejoin
- [x] Mobile-friendly (touch drag, responsive)
