[Back to Sprint 3 Planning](./planning.md)

# T21: Tron Live Feedback Fixes

**Status:** PLANNED
**Assigned:** robbin-expert
**Effort:** 2h expert
**Dependencies:** T18-T20

## Issues Reported by Tron (2026-05-23)

### T21.1 Profile page needs editor button
- `/profile` page (inline HTML in server.ts) has no link/button to open the user editor
- Add "Edit Profile" button that navigates to `/app` and triggers ProfileEditor
- Or add inline editing directly on the profile page

### T21.2 Profile editor lacks picture upload
- ProfileEditor.ts has fields for name/phone/url/secretCode but avatar upload is missing or broken
- QnD had: file upload input (accept image/*), stored as dataURL in localStorage, sent via IDENTIFY
- Port avatar upload from QnD LobbyUI.ts (file input, FileReader, 200KB limit, dataURL)

### T21.3 QR code invite button missing in room
- T20 stubbed the QR invite (shareOrCopy only, no QR popup)
- Need: QR code popup showing room URL as scannable code
- Import `qrcode` npm package (already in dependencies from QnD)
- Generate QR as canvas/dataURL, show in popup overlay
- URL format: `https://home.donges.it:4444/app?room=<roomId>`

## Acceptance Criteria
- [ ] Profile page has "Edit Profile" button
- [ ] ProfileEditor supports avatar/picture upload with preview
- [ ] QR code invite popup shows scannable room URL
