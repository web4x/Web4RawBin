[Back to Sprint 2 Planning](./planning.md)

# T8: Mandatory Profile Gate

**Status:** DONE
**Assigned:** robbin-expert (implement), robbin-tester (verify)
**Effort:** 2h expert + 1h tester
**Dependencies:** T7 (ProfileEditor must exist)

## Goal

New users MUST complete their profile before entering any room. No profile = no room access.

## Requirements

### 8.1 Server: Guard room entry

In `CREATE_ROOM` and `JOIN_ROOM` handlers, check the user's `profileCommitted`:
- Look up profile by playerToken (from tokenToClient map)
- If `!profile.profileCommitted` → respond `{ type: MSG.ERROR, message: 'Profile required' }`
- Return before processing the room action

### 8.2 Client: app.ts gate flow

Current flow: `init() → connect → browser.show()`

New flow:
```
init() → connect → IDENTIFY → receive PROFILE response
  if (!profile.profileCommitted)
    → show ProfileEditor in gate mode (no close, name required, "Continue")
    → on PROFILE_UPDATED → browser.show()
  else
    → browser.show()
```

### 8.3 Client: RawBinClient.ts profile tracking

- Store full profile object from PROFILE response
- Expose `isProfileCommitted(): boolean`
- Expose `getProfile(): UserProfile | null`

### 8.4 Client: ProfileEditor gate mode

When `gateMode: true`:
- No close/cancel/X button — cannot dismiss
- Name field has `required` attribute
- Submit button says "Continue" instead of "Save"
- Submit disabled if name is empty
- On successful PROFILE_UPDATED, calls `onCommit` callback (app.ts proceeds to browser)

### 8.5 Tester: Tests

- Gate flow: IDENTIFY → PROFILE with profileCommitted:false → editor shown
- Gate flow: name saved → profileCommitted:true → browser shown
- Server rejects CREATE_ROOM for uncommitted profile
- Server rejects JOIN_ROOM for uncommitted profile
- Returning user with profileCommitted:true skips gate

## Acceptance Criteria
- [x] First-time user sees editor immediately (no room list visible)
- [x] Editor has no close/skip button in gate mode
- [x] Name is required — submit disabled if empty
- [x] After commit, room browser appears
- [x] Returning user with committed profile goes straight to browser
- [x] Server rejects room create/join for uncommitted profiles with ERROR message
- [x] All tests pass
