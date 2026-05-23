[Back to Sprint 2 Planning](./planning.md)

# T7: User Editor Dialog

[task:uuid:988ca807-ee65-455b-adaf-b759bb277981]

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
  - [sprint-2-identity-ssh Planning](./planning.md)
- down
  - None
## Goal

Add in-room profile editing. Clicking YOUR OWN name in the member list opens a user editor dialog. Clicking ANOTHER user is a stub (wired in T11).

## Requirements

### 7.1 Server: Extend UserProfile

In `server.ts` line 79, extend the interface:

```typescript
interface UserProfile {
  token: string;
  name: string;
  phone: string;            // NEW
  url: string;              // NEW
  avatar: string;
  secretCode: string;
  profileCommitted: boolean; // NEW — true after first profile save with name
  consolidatedFrom: string[];
  redirectTo?: string;
  bugReports: { date: string; text: string; status: string }[];
}
```

Backfill existing profiles: `phone: ''`, `url: ''`, `profileCommitted: false`.

### 7.2 Server: UPDATE_PROFILE handler

New WS message handler:
- Validates inputs (name string, phone string, url string, secretCode `/^\d{4}$/`)
- Updates profile fields: name, phone, url, avatar, secretCode
- If name is non-empty: set `profileCommitted = true`
- Persists profile
- Responds with `PROFILE_UPDATED` containing updated profile

### 7.3 Server: GET_USER_INFO handler

New WS message handler:
- Takes `{ playerToken }` from message
- Looks up profile, returns PUBLIC subset only: `{ name, phone, url, avatar, playerToken }`
- Does NOT include secretCode, devices, bugReports, consolidatedFrom

### 7.4 MessageTypes.ts: Add 4 messages

```typescript
UPDATE_PROFILE: 'UPDATE_PROFILE',       // C→S
PROFILE_UPDATED: 'PROFILE_UPDATED',     // S→C
GET_USER_INFO: 'GET_USER_INFO',         // C→S
USER_INFO: 'USER_INFO',                 // S→C
```

### 7.5 Client: ProfileEditor.ts (~200 lines)

New file at `src/public/ts/ProfileEditor.ts`. Port from QnD `LobbyUI.ts` lines 90-259.

**Fields:**
- Name input (maxlength 20, required in gate mode)
- Phone input (tel type)
- URL input (url type)
- Avatar (file upload as dataURL)
- Secret code (4 digits, pattern `[0-9]{4}`)

**Modes:**
- Normal mode: opened from room, has close/cancel button, "Save" button
- Gate mode (T8): no close button, name required, "Continue" button

**Save action:** Sends `UPDATE_PROFILE` message. On `PROFILE_UPDATED` response, closes dialog and calls `onSave` callback.

**Style:** Mobile bottom-sheet pattern. Slides up from bottom on mobile, centered modal on desktop.

### 7.6 Client: RoomView.ts member click handlers

Add click handlers to member list items in `renderMemberList()`:
- If member `playerToken === client.playerToken` → open ProfileEditor (normal mode)
- If member `playerToken !== client.playerToken` → no-op for now (T11 will wire vCard)

### 7.7 Tester: Tests

- `test/vitest/profile.test.ts`:
  - UPDATE_PROFILE saves all fields and returns PROFILE_UPDATED
  - profileCommitted set to true when name is non-empty
  - GET_USER_INFO returns public subset only (no secretCode, no bugReports)
  - GET_USER_INFO for unknown token returns error
  - Secret code validation (must be 4 digits)
  - Backfill: existing profiles get phone:'', url:'', profileCommitted:false


## QA Audit & User Feedback

## Subtasks
None (atomic task).
## Acceptance Criteria
- [x] Clicking own name in member list opens editor dialog
- [x] Editor shows name, phone, url, avatar, secret code fields
- [x] Save sends UPDATE_PROFILE, receives PROFILE_UPDATED
- [x] Phone/url/avatar persist server-side across sessions
- [x] Clicking another user's name is a no-op
- [x] Mobile-responsive (bottom-sheet on mobile)
- [x] All tests pass
