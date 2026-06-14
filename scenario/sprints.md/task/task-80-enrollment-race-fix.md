# T80: Fix Enrollment Race — Second PROFILE_UPDATED Re-Renders Dialog
[task:uuid:b4f1c2a8-9e3d-4a17-bc52-1f8e7d6a0c44]

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
  - [Sprint 9 Planning](./planning.md)
- down
  - None (atomic task)

## Acceptance Criteria

- [x] `ProfileEditor.ts` clears `this.onSave` before invoking it (one-shot pattern)
- [x] `device-enrollment.spec.ts` PASSES (wrong code → error, correct code → keys stored, reload auto-auths)
- [x] `new-user.spec.ts` PASSES (not flaky — ran 3× consecutively, all green)
- [x] Full E2E suite reaches **21/21**
- [x] `npm run build` succeeds
- [x] No regression: full suite green incl. profile-editor, room-lifecycle, mobile-viewport

## QA Audit & User Feedback

- Pending Tron QA review.
- 2026-05-26 (robbin-tester): INDEPENDENT GATE CONFIRMED ✓ — `npx playwright test --reporter=line` against live server (HEAD 057d491) = **21/21 PASS** (1.3m, exit 0). device-enrollment(1), editor(9), mobile-viewport(1), negative-cases(1), new-user(1), profile-editor(1), room-identity(6), room-lifecycle(1). The one-shot `onSave` fix holds; device-enrollment + new-user both green (prior 2/6 room-identity failure was STALE pre-helper-fix output, not current code). Suite is the gate before Tron QA.

## Subtasks

None (atomic task for this sprint).
