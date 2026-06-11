# T81: Member Click → Profile Sheet → vCard Download
[task:uuid:c7e2d6f1-3a84-4b29-9d05-6e1f2a8b4c70]

## Status

- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing (robbin-tester — TS1/TS2/TS4/TS5; TS3 superseded by T83)
- [ ] QA Review
- [ ] Done

## Traceability

**UseCases:**
- [🔗 contacts.memberClick](../usecase/contacts-memberclick.md)


## Traceability

- up
  - [requirement:uuid:99897fb4-6876-4047-9849-bbdaa840e110](./requirements.md) — R10.1 member-click → profile sheet → vCard
  - [Sprint 10 Planning](./planning.md)
- down
  - None (atomic task)

## Acceptance Criteria

- [x] AC1: Tapping a joined member's **name** opens their profile sheet (`.user-sheet` visible)
- [x] AC2: Tapping a joined member's **avatar** opens their profile sheet (NOT the avatar editor overlay)
- [x] AC3: Tapping a joined member's **status dot** opens their profile sheet
- [x] AC4: The opened sheet shows the member's name and avatar
- [x] AC5: "Download vCard" button is present in the sheet and clicking it invokes the vCard builder (produces a .vcf blob)
- [~] AC6: Tapping OWN badge opens ProfileEditor — **SUPERSEDED by [T83](./task-83-self-click-profile.md)**: self-tap now opens the read-only ProfileSheet (verified in T83 TS1). The old assertion was replaced, not kept.
- [x] AC7: Exactly ONE `GET_USER_INFO` WS message is sent per tap (no listener stacking) — verified after navigating room→lobby→room twice (WS frame count == 1)
- [x] AC8: Lobby avatar (RoomBrowser) and ProfileEditor avatar remain editable (tapping them opens the editor overlay — readonly NOT applied there)
- [x] AC9: `npm run build` succeeds (expert; live server now v0.5.4, well past v0.4.9)
- [x] AC10: All existing E2E specs still pass (no regression) + new test passes
- [x] AC11: Served bundle reflects the bump — live `/api/health` + `/api/config` now report v0.5.4 (advanced past v0.4.9 via subsequent deploys; PWA update path exercised by T94)

## QA Audit & User Feedback

- Pending PO refinement review, then Tron QA.

## Subtasks

None (atomic task for this sprint).
