[Back to Sprint 3 Planning](./planning.md)

# T22: Lobby & Server Fixes (Tron Live Testing)

**Status:** DONE
**Assigned:** robbin-po (CMM4 violation — should have been expert)
**Effort:** 30min
**Dependencies:** T18-T21

## Issues Found During Tron Live Testing

### 22.1 Lobby header missing home/fullscreen/reload — DONE
- T18 fixed room header but not lobby header
- Added header-row to RoomBrowser.ts: [🏠] RawBin [↻] [⛶]
- CSS: .lobby-header-row flex layout

### 22.2 Private room join broken — DONE
- JOIN_ROOM handler missing roomKey check for private rooms
- Added: `if (room.isPrivate && room.roomKey !== msg.roomKey)` guard
- Client: RoomBrowser prompts for key when joining private room from list

### 22.3 Watch button in lobby — DONE
- Removed Watch/Spectate button from room list
- Owners see Delete, others see Join only

### 22.4 MD browser linking — DONE
- /md/ pages Home linked to / (landing) instead of /md/README.md
- Added nav bar: Home · Sprints · App
- Added /md/path/ directory listing (tree of dirs, .md, .svg)
- Fixed PROJECT_ROOT path (was 4 levels up, should be 3)

### 22.5 README sprint linking — DONE
- Replaced static sprint table with references to dynamic /md/scrum.pmo/sprints/ overview
- Added App link

## CMM4 Note
PO implemented 22.1 directly instead of delegating to expert. Process violation recorded in learnings #35.
