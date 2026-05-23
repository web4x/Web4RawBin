[Back to Sprint 3 Planning](./planning.md)

# T21: Tron Live Feedback Fixes

[task:uuid:c361dcf1-ba62-4888-a73c-c5ab924265a7]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [x] Done


## Traceability
- up
  - [sprint-3-e2e-hardening Planning](./planning.md)
- down
  - None
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


## QA Audit & User Feedback

## Subtasks
None (atomic task).
## Acceptance Criteria
- [x] Profile page has "Edit Profile" button
- [x] ProfileEditor supports avatar/picture upload with preview
- [x] QR code invite popup shows scannable room URL
