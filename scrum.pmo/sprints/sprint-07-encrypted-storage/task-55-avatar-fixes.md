[Back to Sprint 7 Planning](./planning.md)

# T55: Avatar Fixes — Tron QA Findings

[task:uuid:f55a0b01-9c12-4d3e-b456-006677889900]

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
- 2026-05-24: Tron — random initial picture gone, only default R icon shown. Upload button not visible.

## Requirements

### 55.1 Backfill existing profiles with thispersondoesnotexist avatars
Existing profiles created before T48 have no encrypted avatar. On server startup or IDENTIFY, if profile.sshKeysGenerated && !hasAvatar(token), fetch from thispersondoesnotexist and encrypt+store. This gives all existing users a random face.

### 55.2 Make upload button visible and obvious
ProfileEditor has a hidden file input triggered by a label. The label may be unclear. Make the upload button prominent: show current avatar preview + "Change Photo" button below it. If no avatar, show the R fallback with "Add Photo" text.

### 55.3 Avatar consistently shown across app
Verify avatar img appears in: member badges (room), lobby (next to name), profile page, profile editor preview. All should use /api/avatar/<token> URL.

## Acceptance Criteria
- [x] Existing users get thispersondoesnotexist avatar on next connect
- [x] "Change Photo" / "Add Photo" button clearly visible in ProfileEditor
- [x] Avatar shown consistently in member badges, lobby, profile page, editor

## Subtasks
None (atomic task).
