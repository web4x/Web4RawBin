[Back to Sprint 7 Planning](./planning.md)

# T56: `<rb-avatar>` Web Component — Clickable Photo with Fullscreen Overlay

[task:uuid:dc1149a4-f639-4b52-9ae2-7634a3a7321e]

## Status
- [x] Planned
- [x] In Progress
- [x] QA Review
- [x] Done

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
- [x] Tapping avatar anywhere opens fullscreen zoomable overlay
- [x] Upload button in overlay uploads + replaces avatar
- [x] Close button dismisses overlay
- [x] Pinch-to-zoom works on iPhone
- [x] Works at all sizes (24px badge, 80px editor, fullscreen overlay)
- [x] Safe-area padding on overlay buttons

## Subtasks
None (atomic task).
