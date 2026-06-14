# T82: vCard Button Visibility + ProfileSheet Avatar DRY
[task:uuid:e8d3a7b2-5c61-4f08-a3d9-2b7c4e1f9a06]

## Status

- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing (robbin-tester — TS1-TS4)
- [ ] QA Review
- [ ] Done

## Traceability

- up
  - [requirement:uuid:b252bd78-7ee5-4ccf-8c74-818d1c6e6b4a](./requirements.md) — R10.2 vCard button visibility + avatar DRY
  - [Sprint 10 Planning](./planning.md)
- down
  - None (atomic task)
- follows
  - [T81](./task-81-member-click-vcard.md) — member-click landed (v0.4.9); T82 fixes follow-on sheet defects

## Acceptance Criteria

- [x] AC1: "Download vCard" button is VISIBLE in the joined-user sheet (readable text, distinct from "Link Account")
- [x] AC2: "Link Account" button remains visible and unchanged
- [x] AC3: Clicking "Download vCard" invokes the vCard builder (produces a .vcf blob) — behavior unchanged from existing `downloadVCard()`
- [x] AC4: The sheet's avatar is an `<rb-avatar>` element (NOT a bare `<img>` built inline in ProfileSheet)
- [x] AC5: The sheet avatar shows the joined user's picture (loaded from `/api/avatar/<their-token>`), or the initial-letter fallback if none
- [x] AC6: The sheet avatar is `readonly` — tapping it does NOT open the upload/crop editor overlay
- [x] AC7: Lobby `.btn-secondary` buttons (dark background, e.g. "Refresh") remain visible/unchanged — the CSS override is scoped to `.user-sheet` only
- [x] AC8: `npm run build` succeeds; no new tsc errors in changed files (expert)
- [x] AC9: Served bundle reflects the bump — live `/api/health` + `/api/config` now v0.5.4 (advanced past v0.5.0)
- [x] AC10: All existing E2E specs still pass (no regression) + new test passes
- [x] AC11: `ProfileSheet.open(profile, opts?: { isSelf?, onEdit? })` signature exists (verified in source ProfileSheet.ts:24); `{}` opts → `[Download vCard][Link Account]`; `isSelf` branch (`#us-edit`) wired by T83; ProfileSheet does NOT import ProfileEditor

## QA Audit & User Feedback

- Pending PO refinement review, then Tron QA.

## Subtasks

None (atomic task for this sprint).
