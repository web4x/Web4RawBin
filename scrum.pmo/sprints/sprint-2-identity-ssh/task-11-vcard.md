[Back to Sprint 2 Planning](./planning.md)

# T11: vCard Download for Other Users

[task:uuid:db9091a2-9cc9-4b2f-967a-b37355b9fc88]

**Status:** DONE
**Assigned:** robbin-expert (implement), robbin-tester (verify)
**Effort:** 1.5h expert + 0.5h tester
**Dependencies:** T7 (profile fields + member click handler)
**Created:** 2026-05-23
**Completed:** 2026-05-23


## Traceability
- up
  - [sprint-2-identity-ssh Planning](./planning.md)
- down
  - None
## Goal

Clicking another user's name in the room member list shows a profile sheet with vCard download. Port from QnD MultiplayerUI.ts lines 486-542.

## Requirements

### 11.1 Client: ProfileSheet.ts (~120 lines)

Bottom-sheet overlay showing another user's public profile:
- Avatar (image or fallback icon)
- Name
- "Download vCard" button → generates and downloads .vcf
- "Link Account" button → reuses existing CONSOLIDATE flow (secret code prompt)
- Close button + touch-drag-to-dismiss

### 11.2 Client: vCard generation

Port from QnD (lines 513-533). Build vCard V3.0:
```
BEGIN:VCARD
VERSION:3.0
FN:<name>
TEL:<phone>
URL:<url>
PHOTO;ENCODING=b;TYPE=<type>:<base64>
NOTE:RawBin User
END:VCARD
```
Create Blob with type `text/vcard`, trigger download as `<name>.vcf`.

Only include TEL if phone is non-empty. Only include URL if url is non-empty. Only include PHOTO if avatar starts with `data:image/`.

### 11.3 Client: RoomView.ts wiring

Wire the other-user click handler (stubbed in T7):
- Send `GET_USER_INFO` with the clicked member's `playerToken`
- On `USER_INFO` response → open ProfileSheet with the returned data

### 11.4 Tester: Tests

- vCard string generation with all fields
- vCard string generation with missing optional fields (no phone, no url, no avatar)
- GET_USER_INFO returns public fields only
- .vcf download creates valid file


## Subtasks
None (atomic task).
## Acceptance Criteria
- [x] Clicking another user's name opens profile sheet
- [x] Download button generates valid .vcf file
- [x] vCard opens correctly in iOS/Android contacts app
- [x] Profile sheet dismissable (close button + drag)
- [x] Link Account button shows secret code prompt (CONSOLIDATE)
- [x] All tests pass
