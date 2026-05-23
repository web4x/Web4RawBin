[Back to Sprint 3 Planning](./planning.md)

# T18: Header Parity with UpDown

[task:uuid:676f309c-101a-4567-ba86-caa3077d6a01]

**Status:** DONE
**Assigned:** robbin-expert
**Effort:** 1h expert
**Dependencies:** None
**Created:** 2026-05-23
**Completed:** 2026-05-23


## Traceability
- up
  - [sprint-3-e2e-hardening Planning](./planning.md)
- down
  - None
## Problem

RawBin header only has "Leave" and "Invite" buttons. UpDown header had home button, fullscreen toggle, and reload — essential for PWA usage on mobile.

## Requirements

### 18.1 Home button
- `🏠` button linking to `/` (landing page)
- Left side of header, next to Leave button

### 18.2 Fullscreen toggle
- `⛶` button that calls `document.documentElement.requestFullscreen()` / `document.exitFullscreen()`
- Right side of header
- Toggle icon between `⛶` (enter) and `✕` (exit)
- Critical for mobile PWA: players need fullscreen to hide browser chrome

### 18.3 Reload button
- `↻` button that calls `location.reload()`
- Right side of header, next to fullscreen
- Recovery mechanism when WS disconnects

### 18.4 Header layout
Port from QnD MultiplayerUI.ts lines 227-237:
```
[← Leave] [🏠]     Room Name     [↻] [⛶]
```
- Left: Leave + Home
- Center: Room name (h2)
- Right: Reload + Fullscreen + Invite

### 18.5 CSS
- Header buttons: consistent sizing, touch-friendly (44px min tap target)
- Fullscreen CSS media query handling

## Source Reference
- QnD: `MultiplayerUI.ts` lines 227-237, `multiplayer.css` lines 158-163, 370-375


## Subtasks
None (atomic task).
## Acceptance Criteria
- [x] Home button navigates to /
- [x] Fullscreen toggle works on desktop + mobile
- [x] Reload refreshes the page
- [x] Header layout matches UpDown pattern
- [x] Touch-friendly button sizes (44px min)
