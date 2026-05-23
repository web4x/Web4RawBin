[Back to Sprint 3 Planning](./planning.md)

# T13: Playwright E2E Test Suite

[task:uuid:7ab42153-9cb4-41e5-befe-8c7af894da9d]

**Status:** DONE
**Assigned:** robbin-expert (infrastructure), robbin-tester (test cases)
**Effort:** 4h expert + 2h tester
**Dependencies:** Port 4444 forwarded (Tron action)
**Created:** 2026-05-23
**Completed:** 2026-05-23


## Traceability
- up
  - [sprint-3-e2e-hardening Planning](./planning.md)
- down
  - None
## Goal

Verify the full RawBin stack end-to-end in a real headless browser. Every user journey from Sprint 1+2 must be tested.

## Requirements

### 13.1 Playwright Config

- `playwright.config.ts` at project root
- Base URL: `https://localhost:4444` (self-signed cert — `ignoreHTTPSErrors: true`)
- Browser: Chromium headless
- Test dir: `test/e2e/`
- Server startup: `webServer` config starts `npm run dev` before tests
- Timeout: 30s per test

### 13.2 Test: New User Journey

```
1. Navigate to /app
2. Expect: profile gate shown (no room list visible)
3. Name field is empty, Continue button disabled
4. Enter name "E2E-User-1"
5. Click Continue
6. Expect: room browser shown
7. Expect: no rooms listed initially
```

### 13.3 Test: Room Lifecycle

```
1. (continues from 13.2)
2. Create room "E2E-Room" (click create, enter name)
3. Expect: room view shown with member list (self as host)
4. Send chat message "hello e2e"
5. Expect: message appears in chat
6. Leave room
7. Expect: back to room browser
8. Room still listed (not deleted)
9. Re-join room
10. Expect: chat history preserved (contains "hello e2e")
11. Delete room (as owner)
12. Expect: room removed from list
```

### 13.4 Test: Profile Editor (self-click)

```
1. Join a room
2. Click own name in member list
3. Expect: profile editor opens
4. Edit phone field → "+49123456"
5. Edit url field → "https://example.com"
6. Click Save
7. Expect: editor closes
8. Reopen editor (click own name again)
9. Expect: phone and url fields persist
```

### 13.5 Test: Device Enrollment

```
1. New user completes profile gate
2. Expect: device enrollment dialog shown (secret code prompt)
3. Enter wrong code "0000"
4. Expect: error message
5. Enter correct code (read from profile)
6. Expect: enrollment succeeds, dialog closes
7. Check localStorage has rawbin-device-privateKey and rawbin-device-publicKey
8. Reload page
9. Expect: auto-authenticated (no enrollment prompt, straight to browser)
```

### 13.6 Test: vCard Download

```
1. User A creates room, User B joins (two browser contexts)
2. User B clicks User A's name in member list
3. Expect: profile sheet opens with avatar, name
4. Click "Download vCard"
5. Expect: .vcf file downloaded
6. Verify .vcf content: BEGIN:VCARD, FN:<name>, END:VCARD
```

### 13.7 Test: Negative Cases

```
1. Empty name in profile gate → Continue disabled
2. Profile gate → try navigating to room directly → redirected to gate
3. Wrong secret code during enrollment → DEVICE_ENROLL_FAILED
4. Non-owner tries to delete room → rejected
```

### 13.8 Test: Mobile Viewport

```
1. Set viewport to 375x812 (iPhone)
2. Run profile gate flow
3. Expect: bottom-sheet editor renders correctly
4. Create room, verify chat works on mobile
```

### 13.9 npm Scripts

Add to package.json:
```json
"test:e2e": "playwright test",
"test:all": "vitest run && playwright test"
```


## Subtasks
None (atomic task).
## Acceptance Criteria
- [x] All E2E tests pass in headless Chromium
- [x] Full user journey covered (gate → room → chat → profile → vCard)
- [x] Device enrollment + auto-auth verified
- [x] Mobile viewport tested
- [x] Server auto-starts before tests (webServer config)
- [x] Tests run with `npm run test:e2e`
