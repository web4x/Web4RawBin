[Back to Sprint 9 Planning](./planning.md)

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

## Assigned
**Owner:** robbin-expert (implement + verify)

## Traceability
- up
  - [Sprint 9 Planning](./planning.md)
- down
  - None (atomic task)

## Root Cause (diagnosed by robbin-architect)

The E2E suite is stuck at 19/21. Two specs fail: `device-enrollment.spec.ts` and `new-user.spec.ts`. Both fail because `#de-submit` stays `disabled` and `page.click('#de-submit')` times out.

### The mechanism

`ProfileEditor`'s `PROFILE_UPDATED` handler (`ProfileEditor.ts:21-27`) calls `this.onSave(msg.profile)` on **every** PROFILE_UPDATED message and **never clears `this.onSave`**.

The server sends **TWO** PROFILE_UPDATED messages when a new user commits their profile:
- `server.ts:1203` — synchronous response (has secretCode)
- `server.ts:1197` — second, async, after `fetchUniqueAvatar()` completes (avatar backfill)

### Failing sequence

1. New user saves profile → server sends PROFILE_UPDATED #1
2. `onSave` fires → `checkDeviceEnrollment()` → opens **DeviceEnrollDialog #1**
3. Test fills `#de-code`, clicks `#de-submit`
4. Avatar backfill completes → server sends PROFILE_UPDATED #2
5. `onSave` fires AGAIN (never cleared) → `checkDeviceEnrollment()` → `deviceEnroll.open()` → **closes dialog #1, opens fresh dialog #2** with a NEW `#de-submit` (hardcoded `disabled`) and EMPTY `#de-code`
6. The test's typed code is gone; the freshly-rendered button is disabled → click times out

Playwright evidence: `locator resolved to <button disabled id="de-submit">`.

### Why 19 tests pass

`ensureLobby` helper (`helpers.ts:37-47`) bypasses enrollment by injecting `e2e-bypass` keys into localStorage and reloading. The 2 failing specs test real enrollment with no bypass.

### Why new-user.spec is flaky

Timing. If `fetchUniqueAvatar()` is slow/fails, PROFILE_UPDATED #2 doesn't arrive during the test window → no re-render → passes. Fast avatar fetch → re-render mid-enrollment → fails.

## The Fix

In `src/public/ts/ProfileEditor.ts`, make `onSave` one-shot — clear it before invoking so the avatar backfill's second PROFILE_UPDATED cannot re-trigger enrollment:

```typescript
this.client.on(MSG.PROFILE_UPDATED, (msg) => {
  if (this.onSave && msg.profile) {
    const cb = this.onSave;
    this.onSave = null;        // clear BEFORE invoking — one-shot
    cb(msg.profile);
    if (msg.profile.name) localStorage.setItem('rawbin-name', msg.profile.name);
  }
  this.close();
});
```

This prevents the second (avatar backfill) PROFILE_UPDATED from re-running `checkDeviceEnrollment()` and re-rendering the dialog out from under the user.

## Acceptance Criteria
- [x] `ProfileEditor.ts` clears `this.onSave` before invoking it (one-shot pattern)
- [x] `device-enrollment.spec.ts` PASSES (wrong code → error, correct code → keys stored, reload auto-auths)
- [x] `new-user.spec.ts` PASSES (not flaky — ran 3× consecutively, all green)
- [x] Full E2E suite reaches **21/21**
- [x] `npm run build` succeeds
- [x] No regression: full suite green incl. profile-editor, room-lifecycle, mobile-viewport

## Future Work (note, not this task)

The deeper fix is to split the avatar-ready notification into its own message type (`AVATAR_UPDATED`) rather than overloading `PROFILE_UPDATED`. The server currently reuses PROFILE_UPDATED for the async avatar backfill, which has side effects the client doesn't expect (same class of bug as the Sprint 7 avatar race). A dedicated `AVATAR_UPDATED` message would let the client update only the avatar without re-running profile-commit logic. Defer to a future sprint — the one-shot `onSave` clear resolves the test failures with minimal change.

## QA Audit & User Feedback
- Pending Tron QA review.
- 2026-05-26 (robbin-tester): INDEPENDENT GATE CONFIRMED ✓ — `npx playwright test --reporter=line` against live server (HEAD 057d491) = **21/21 PASS** (1.3m, exit 0). device-enrollment(1), editor(9), mobile-viewport(1), negative-cases(1), new-user(1), profile-editor(1), room-identity(6), room-lifecycle(1). The one-shot `onSave` fix holds; device-enrollment + new-user both green (prior 2/6 room-identity failure was STALE pre-helper-fix output, not current code). Suite is the gate before Tron QA.

## Subtasks
None (atomic task for this sprint).
