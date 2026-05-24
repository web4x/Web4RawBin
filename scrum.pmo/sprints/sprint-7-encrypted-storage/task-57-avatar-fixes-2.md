[Back to Sprint 7 Planning](./planning.md)

# T57: rb-avatar Fixes — Lobby DRY, Pinch-Zoom, Crop Position

[task:uuid:h57c0d03-be34-4f50-d678-008899001122]

## Status
- [ ] Planned
- [ ] In Progress
- [ ] QA Review
- [ ] Done

## QA Audit & User Feedback
- 2026-05-24: Tron — avatar not clickable in lobby (DRY violation: inline img, not rb-avatar). Pinch-zoom doesn't work on iPhone. Add crop button that saves zoom+pan position.

## Requirements

### 57.1 Lobby DRY fix
RoomBrowser.ts line has inline `<img id="lobby-avatar">` — replace with `<rb-avatar>` component. Same as member badges and editor.

### 57.2 iPhone pinch-zoom fix
CSS `touch-action: pinch-zoom` alone doesn't work in overlay context on iOS Safari. Implement JS-based pinch-zoom: track touchstart/touchmove with 2 fingers, calculate distance delta, apply CSS transform scale+translate on the image. Reset on close.

### 57.3 Crop/Position button (middle of overlay)
- Add "Crop" button centered between Upload (left) and Close (right)
- On tap: saves current zoom level (transform scale) + pan offset (translate) to the user's profile as `avatarCrop: { scale, x, y }`
- When rb-avatar renders the circular photo, applies the saved crop as CSS transform on the img
- Does NOT modify the actual image file — just saves viewport position
- Persist via UPDATE_PROFILE or separate WS message
- Server stores avatarCrop in UserProfile

## Acceptance Criteria
- [ ] Lobby avatar is rb-avatar component (clickable, opens overlay)
- [ ] Pinch-zoom works on iPhone Safari in overlay
- [ ] Crop button saves zoom+pan position
- [ ] Saved crop applied when rendering avatar everywhere
- [ ] No actual image modification (only viewport transform)

## Subtasks
None (atomic task).
