[Back to Sprint 10 Planning](./planning.md)

# T83: Self-Click Opens Profile Sheet, Not Profile Editor

[task:uuid:e9a3b7c2-5f16-4d80-b3a9-2c7e4f1d6058]

## Tron Requirement (literal)

> "when i am in a room clicking on my users item, i want the profile to open. not the profile editor."

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement (architect)
  - [ ] implementing (expert)
  - [ ] testing (tester)
- [ ] QA Review
- [ ] Done

## Traceability
- up
  - [Sprint 10 Planning](./planning.md)
  - Tron directive 2026-05-25
- down
  - None (atomic task)
- changes
  - [T81](./task-81-member-click-vcard.md) AC6 — T81 set self-click → ProfileEditor; T83 supersedes it with self-click → read-only ProfileSheet

## Task Description

**Reverses T81 AC6.** T81 AC6 stated: "Tapping OWN badge opens ProfileEditor (self-edit path preserved, NOT the read-only sheet)." Tron now wants the opposite — self-click should open the same read-only ProfileSheet that other-user clicks open.

**Current behavior (T81 AC6):** Clicking your own name in the room member list opens the ProfileEditor (edit mode with input fields for name, phone, url, secret code). Code: `RoomView.ts` lines 60-64, `if (isSelf) → profileEditor.open(...)`.

**Required behavior:** Clicking your own name opens the ProfileSheet (read-only view with avatar, name, Download vCard — same as clicking another user's name). The `isSelf` branch should call `profileSheet.open(ownProfile)` instead of `profileEditor.open(...)`.

**Code location:** `RoomView.ts` constructor, `rb-member-click` event handler (lines 60-70).

## OPEN QUESTIONS (awaiting Tron confirmation via PO)

**Q1: Where does a user edit their own profile?**
If self-click no longer opens ProfileEditor, the remaining entry points for profile editing are:
- Lobby: tapping the `<rb-avatar>` (size=48) in the name row opens the avatar editor overlay — but NOT the full ProfileEditor with name/phone/url/secretCode fields
- `/profile` page: has an "Edit Profile" link (`/app?editProfile=1`) that opens ProfileEditor on the /app page
- `/app?editProfile=1`: query param triggers ProfileEditor in gate-like mode on app load

**Is this sufficient, or should we add an "Edit" button to the self ProfileSheet?** Options:
- **Option A:** Self ProfileSheet shows an additional "Edit Profile" button that opens ProfileEditor (two-step: view → edit)
- **Option B:** No edit from room at all — user goes to /profile page or lobby avatar to edit
- **Option C:** ProfileSheet gets inline editing for self (name/phone/url fields become editable) — larger scope change

**PO: confirm with Tron which option before architect refines.**

## Acceptance Criteria
- [ ] AC1: Self-click in member list opens ProfileSheet (read-only view), not ProfileEditor
- [ ] AC2: ProfileSheet shows own avatar, name, vCard download
- [ ] AC3: ProfileEditor still accessible via lobby avatar and /profile page edit button
- [ ] AC4: No regression: clicking OTHER users still opens ProfileSheet as before
- [ ] AC5: (pending Q1 answer) Edit path from self ProfileSheet — TBD

## QA Audit & User Feedback
- 2026-05-25: Tron directive — "clicking on my users item, i want the profile to open, not the profile editor." Renumbered from T81 collision (planner). Awaiting architect refinement (+ Q1 answer), then Tron QA.

## Subtasks
None (atomic task).
