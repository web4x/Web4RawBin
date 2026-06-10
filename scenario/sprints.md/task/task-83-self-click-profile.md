# T83: Self-Click Opens Profile Sheet, Not Profile Editor
[task:uuid:e9a3b7c2-5f16-4d80-b3a9-2c7e4f1d6058]

## Status

- [x] Planned
- [x] In Progress
  - [x] refinement (architect)
  - [x] implementing (expert)
  - [x] testing (tester — TS1-TS5, old T81 TS3 REPLACED)
- [ ] QA Review
- [ ] Done

## Traceability

**UseCases:**
- [🔗 contacts.selfClick](../usecase/contacts-selfclick.md)


## Traceability

- up
  - [requirement:uuid:30c3d4e5-f6a7-4b82-9c93-1d2e3f4a5b62](./requirements.md) — R10.3 self-click → read-only profile sheet
  - [Sprint 10 Planning](./planning.md)
  - Tron directive 2026-05-25
- down
  - None (atomic task)
- changes
  - [T81](./task-81-member-click-vcard.md) AC6 — T81 set self-click → ProfileEditor; T83 supersedes it with self-click → read-only ProfileSheet

## Task Description

**Reverses T81 AC6.** T81 AC6 stated: "Tapping OWN badge opens ProfileEditor (self-edit path preserved, NOT the read-only sheet)." Tron now wants the opposite — self-click should open the same read-only ProfileSheet that other-user clicks open.

**Current behavior (T81 AC6):** Clicking your own name in the room member list opens the ProfileEditor (edit mode with input fields for name, phone, url, secret code). Code: `RoomView.ts` lines 60-64, `if (isSelf) → profileEditor.open(...)`.

**Required behavior:** Clicking your own name opens the ProfileSheet (read-only view). Self gets an "Edit" button that opens ProfileEditor (one extra tap). The `isSelf` branch should call `profileSheet.open(ownProfile)` instead of `profileEditor.open(...)`.

**Code location:** `RoomView.ts` constructor, `rb-member-click` event handler (lines 60-70). `ProfileSheet.ts` — button rendering needs to vary by self vs other.

### ProfileSheet Button Matrix (Tron-confirmed)

| Viewer | Buttons shown |
|--------|--------------|
| **SELF** (own badge) | Download vCard, Edit (→ opens ProfileEditor) |
| **OTHER** (other member's badge) | Download vCard, Link Account |

### Changes Required

1. **RoomView.ts (lines 60-64):** Replace `if (isSelf) → profileEditor.open(...)` with `profileSheet.open(ownProfile, { isSelf: true })`
2. **ProfileSheet.ts:** Accept `isSelf` option. When `isSelf`:
   - Show "Edit" button instead of "Link Account"
   - "Edit" button opens `ProfileEditor` with current profile data
   - "Download vCard" still works (user can download their own vCard)
3. **ProfileSheet.ts:** When NOT `isSelf` (other user): existing behavior — "Download vCard" + "Link Account"

## Acceptance Criteria

- [x] AC1: Self-click in member list opens ProfileSheet (read-only view), not ProfileEditor
- [x] AC2: Self ProfileSheet shows own avatar and name
- [x] AC3: Self ProfileSheet shows "Download vCard" button — downloads own .vcf
- [x] AC4: Self ProfileSheet shows "Edit" button — opens ProfileEditor with current profile data
- [x] AC5: Other-user ProfileSheet shows "Download vCard" + "Link Account" (unchanged)
- [x] AC6: Other-user ProfileSheet does NOT show "Edit" button
- [x] AC7: ProfileEditor still accessible via lobby avatar and /profile page edit button
- [x] AC8: No regression on other-user click flow (GET_USER_INFO → sheet)

## QA Audit & User Feedback

- 2026-05-25: Tron directive — "clicking on my users item, i want the profile to open, not the profile editor." Renumbered from T81 collision (planner).
- 2026-05-25 robbin-architect: design added (coherent with T82). Changes A (RoomView self-route), B (#us-edit handler), C (covered by T82). Dependency: T82 before T83. 5 test scenarios; flagged T81 TS3 inversion for tester.
- 2026-05-25: Q1 RESOLVED by Tron via PO — Option A confirmed: self ProfileSheet shows [Download vCard, Edit→ProfileEditor]. Self also gets own vCard download.

## Subtasks

None (atomic task).
