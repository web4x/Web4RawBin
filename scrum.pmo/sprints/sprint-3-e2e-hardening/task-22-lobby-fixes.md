[Back to Sprint 3 Planning](./planning.md)

# T22: Lobby & Server Fixes (Tron Live Testing)

[task:uuid:bea3af94-9de9-4f12-9c7c-4fc526a6c157]

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
  - [sprint-3-e2e-hardening Planning](./planning.md)
- down
  - None
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

## QA Audit & User Feedback
- 2026-05-23 UTC: Tron QA REJECT — private room join STILL broken. Server line 672 reads `if (room.isPrivate)` which blocks ALL private room joins unconditionally. Should be `if (room.isPrivate && room.roomKey !== msg.roomKey)` to allow joins with correct key. The fix from T22.2 was overwritten or never applied correctly.

## Subtasks
None (atomic task).
