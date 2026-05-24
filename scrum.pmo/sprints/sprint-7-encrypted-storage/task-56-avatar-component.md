[Back to Sprint 7 Planning](./planning.md)

# T56: `<rb-avatar>` Web Component — Clickable Photo with Fullscreen Overlay

[task:uuid:g56b0c02-ad23-4e4f-c567-007788990011]

## Status
- [ ] Planned
- [ ] In Progress
- [ ] QA Review
- [ ] Done

## Traceability
- up
  - [Sprint 7 Planning](./planning.md)
- down
  - None (atomic task)

## QA Audit & User Feedback
- 2026-05-24: Tron — circular photo area should be a clickable web component opening fullscreen zoomable overlay with upload button bottom-left and close button bottom-right.

## Requirements

### 56.1 `<rb-avatar>` Web Component
- Circular photo display (configurable size via attribute: `size="80"`, `size="24"`)
- Shows avatar from `src` attribute (`/api/avatar/<token>` URL)
- Fallback to first-letter initial when no src or load error
- Clickable — tap opens fullscreen overlay

### 56.2 Fullscreen Overlay
- Photo displayed large, centered, pinch-to-zoom (CSS touch-action: pinch-zoom, or transform scale)
- Dark backdrop (rgba(0,0,0,0.9))
- Bottom-left: "Upload" button — opens file picker, POSTs to /api/avatar
- Bottom-right: "Close" button — dismisses overlay
- Safe-area-inset-bottom padding for iPhone home indicator

### 56.3 Replace all avatar usage
- ProfileEditor: replace inline avatar preview with `<rb-avatar size="80">`
- rb-member-badge: replace inline img/fallback with `<rb-avatar size="24">`
- Lobby: replace avatar display with `<rb-avatar>`
- Profile page: use `<rb-avatar>` in server-rendered HTML

## Acceptance Criteria
- [ ] Tapping avatar anywhere opens fullscreen zoomable overlay
- [ ] Upload button in overlay uploads + replaces avatar
- [ ] Close button dismisses overlay
- [ ] Pinch-to-zoom works on iPhone
- [ ] Works at all sizes (24px badge, 80px editor, fullscreen overlay)
- [ ] Safe-area padding on overlay buttons

## Subtasks
None (atomic task).
