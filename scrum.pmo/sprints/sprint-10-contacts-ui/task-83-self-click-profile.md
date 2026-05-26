[Back to Sprint 10 Planning](./planning.md)

# T83: Self-Click Opens Profile Sheet, Not Profile Editor

[task:uuid:e9a3b7c2-5f16-4d80-b3a9-2c7e4f1d6058]

## Tron Requirement (literal)

> "when i am in a room clicking on my users item, i want the profile to open. not the profile editor."

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement (architect)
  - [x] implementing (expert)
  - [x] testing (tester — TS1-TS5, old T81 TS3 REPLACED)
- [ ] QA Review
- [ ] Done

## Implementation (robbin-expert, 2026-05-26, v0.5.3)
T82 scaffold confirmed in tree (open(profile,opts), #us-edit markup branch, scoped CSS). Two changes:
- **Change A (RoomView.ts):** self-click branch now `profileSheet.open({name,phone,url,avatar,playerToken:this.client.playerToken}, { isSelf:true, onEdit:() => profileEditor.open({...,secretCode}, 'normal') })` — was `profileEditor.open(...)` (T81 AC6, now superseded). Other-member branch unchanged (GET_USER_INFO → open(msg.user), no opts → isSelf=false).
- **Change B (ProfileSheet.ts):** store `this.onEdit = opts.onEdit` in open(); in setupEvents wire `#us-edit` → `this.close(); this.onEdit?.()`. `#us-edit` only in DOM when isSelf so handler is inert for others. ProfileSheet still does NOT import ProfileEditor (decoupled via callback).
- AC1 (self→sheet), AC2 (own avatar+name via rb-avatar), AC3 (own vCard), AC4 (Edit→editor prefilled), AC5/AC6 (other = vCard+Link, no Edit), AC7 (lobby/`/profile` editor entry points untouched), AC8 (other-click unchanged).
- v0.5.3, sw.js cache rawbin-v0.5.3, tsc + build clean (bundle app-2SMD5C2R.js).
- ⚠️ Tester: T83 INVERTS T81 TS3 (self-tap was → #pe-name; now → .user-sheet). Replace that assertion, don't keep it.

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

## Design (robbin-architect — coherent with T82)

T82 and T83 reshape the SAME component, `ProfileSheet`. **T82 builds the scaffold** (visible secondary button via scoped CSS, `rb-avatar readonly`, and the `open(profile, opts)` button-row branch). **T83 fills the self branch and the routing.** T83 depends on T82's scaffold landing first.

### Shared seam (defined in T82, consumed here)
- `ProfileSheet.open(profile, opts?: { isSelf?: boolean; onEdit?: () => void })` — options object
- Button row already branches: `isSelf ? #us-edit : #us-link`. `#us-vcard` is common.
- ProfileSheet stays decoupled from ProfileEditor — it calls `opts.onEdit()`, it does not import ProfileEditor.

### Change A — RoomView self-click routing

**File:** `src/public/ts/RoomView.ts` — the `rb-member-click` handler (currently the `isSelf` branch opens ProfileEditor; T81 AC6).

Current (T81):
```typescript
if (isSelf) {
  const p = this.client.getProfile();
  this.profileEditor.open({ name: p?.name || ..., phone: ..., url: ..., avatar: ..., secretCode: ... }, 'normal');
}
```
Replace with — self-click opens the read-only sheet, Edit re-routes to the editor:
```typescript
if (isSelf) {
  const p = this.client.getProfile();
  this.profileSheet.open(
    { name: p?.name || '', phone: p?.phone || '', url: p?.url || '', avatar: p?.avatar || '', playerToken: this.client.playerToken },
    { isSelf: true, onEdit: () => this.profileEditor.open({ name: p?.name || '', phone: p?.phone || '', url: p?.url || '', avatar: p?.avatar || '', secretCode: p?.secretCode || '' }, 'normal') }
  );
}
```
The `else` (other-member) branch is unchanged — `GET_USER_INFO` → `profileSheet.open(msg.user)` (no opts → `isSelf=false`).

### Change B — ProfileSheet `#us-edit` wiring

**File:** `src/public/ts/ProfileSheet.ts` — in `setupEvents()`, add the self-only handler:
```typescript
document.getElementById('us-edit')?.addEventListener('click', () => {
  this.close();
  this.onEdit?.();   // onEdit captured from opts in open()
});
```
Store `this.onEdit = opts.onEdit` in `open()`. `#us-edit` only exists in the DOM when `isSelf` (T82 markup branch), so this handler is inert for other-user sheets.

### Change C — (covered by T82) button rendering branch

The `isSelf ? #us-edit : #us-link` markup is delivered by T82 Change 3. T83 does NOT re-author it — T83 only supplies the `isSelf:true` caller (Change A) and the `#us-edit` click handler (Change B).

### Dependency + sequencing
- **T82 must merge before T83** (T83 consumes T82's `open(profile, opts)` signature, the `#us-edit` markup, and the visible-secondary-button CSS).
- If T83 is implemented against a tree without T82, the `#us-edit` button won't exist and the self sheet's secondary button would be invisible. Expert: confirm T82 is in the working tree first.

### ⚠️ Tester flag — T83 INVERTS T81 TS3
T81's TS3 asserted: self-tap → ProfileEditor (`#pe-name` visible), NOT `.user-sheet`. **T83 reverses this.** The old T81 TS3 must be REPLACED, not kept — otherwise it will fail by design. New expected behavior: self-tap → `.user-sheet` visible with `#us-edit`; ProfileEditor opens only after tapping `#us-edit`.

## Acceptance Criteria
- [x] AC1: Self-click in member list opens ProfileSheet (read-only view), not ProfileEditor
- [x] AC2: Self ProfileSheet shows own avatar and name
- [x] AC3: Self ProfileSheet shows "Download vCard" button — downloads own .vcf
- [x] AC4: Self ProfileSheet shows "Edit" button — opens ProfileEditor with current profile data
- [x] AC5: Other-user ProfileSheet shows "Download vCard" + "Link Account" (unchanged)
- [x] AC6: Other-user ProfileSheet does NOT show "Edit" button
- [x] AC7: ProfileEditor still accessible via lobby avatar and /profile page edit button
- [x] AC8: No regression on other-user click flow (GET_USER_INFO → sheet)

## Test Results (robbin-tester, 2026-05-26) — PASS, AC1-AC8
Test: `test/e2e/contacts-ui.spec.ts` (6/6 PASS, 23.3s) against live server. The OLD T81 TS3
(self→ProfileEditor) was REPLACED — not kept — with the inverted behavior below.
| TS | Check | Result |
|----|-------|--------|
| TS1/AC1-2 | self-tap own badge → `.user-sheet` visible, `#pe-name` count 0 (editor NOT opened directly); name 'SelfUser'; one `rb-avatar` | PASS ✓ |
| TS1/AC4-6 | self sheet: `#us-vcard` + `#us-edit` visible, `#us-link` count 0 | PASS ✓ |
| TS2/AC4 | tap `#us-edit` → `#pe-name` visible, prefilled with own name, `.user-sheet` closed (one overlay) | PASS ✓ |
| TS3/AC3 | self `#us-vcard` → vCard blob contains `FN:VcardSelf` | PASS ✓ |
| TS4/AC5-6/AC8 | other-member (GuestB) sheet: `#us-vcard` + `#us-link` visible, `#us-edit` count 0 | PASS ✓ |
| TS5/AC7 | lobby avatar (editable) → ProfileEditor overlay opens (entry point untouched) | PASS ✓ |
No regression: contacts spec is additive; full suite was 21/21 (T80).

### Inversion fallout fixed (robbin-tester)
Per the expert's directive to "search existing specs for any 'self tap → #pe-name' assertion and update",
found a SECOND such spec: `test/e2e/profile-editor.spec.ts` (T13.4) clicked the own badge in a room and
waited for `#pe-name` — the pre-T83 behavior — so it began failing after the v0.5.3 deploy (it passed in
the T80 21/21 run earlier this session, before the deploy). Updated it to route through the sheet:
self-badge click → `.user-sheet` → `#us-edit` → `#pe-name` → save. Now passes. No product code touched —
the product (T83) is correct; the old test encoded superseded behavior.

## Test Scenarios (tester works from these directly)

### TS1 — Self-click opens read-only sheet (REPLACES T81 TS3)
```
1. ensureLobby(page, 'SelfUser'); create/enter a room
2. Tap own badge (name === 'SelfUser', is-self present)
3. Expect '.user-sheet' visible (NOT '#pe-name' — ProfileEditor must NOT open directly)
4. Assert sheet shows own name 'SelfUser' and an rb-avatar
5. Assert '#us-vcard' visible AND '#us-edit' visible
6. Assert '#us-link' NOT present (no Link-to-self)
```

### TS2 — Self Edit button opens ProfileEditor
```
1. From the open self sheet (TS1)
2. Tap '#us-edit'
3. Expect ProfileEditor overlay opens ('#pe-name' visible) prefilled with current name
4. Expect the sheet closed (one overlay at a time)
```

### TS3 — Self vCard download works
```
1. From the open self sheet (TS1)
2. Tap '#us-vcard' → no error; vCard blob built containing 'FN:SelfUser'
```

### TS4 — Other-member sheet unchanged (regression)
```
1. Client A 'OwnerA' creates room; Client B 'GuestB' joins
2. page1 taps GuestB badge → '.user-sheet' visible
3. Assert '#us-vcard' + '#us-link' visible; '#us-edit' NOT present
```

### TS5 — ProfileEditor still reachable elsewhere (regression)
```
1. Lobby: tap lobby avatar (editable rb-avatar) → ProfileEditor opens
2. (and/or) /profile page Edit button → ProfileEditor opens
   Confirms T83 only changed the in-room self-badge route, not other editor entry points
```

### ⚠️ Tester: DELETE/REPLACE the old T81 TS3
The T81 spec asserted self-tap → ProfileEditor. That assertion is now WRONG by design. Replace it with TS1 above. Search existing specs (e.g. member-vcard / room specs) for any "self tap → #pe-name" assertion and update.

## QA Audit & User Feedback
- 2026-05-25: Tron directive — "clicking on my users item, i want the profile to open, not the profile editor." Renumbered from T81 collision (planner).
- 2026-05-25 robbin-architect: design added (coherent with T82). Changes A (RoomView self-route), B (#us-edit handler), C (covered by T82). Dependency: T82 before T83. 5 test scenarios; flagged T81 TS3 inversion for tester.
- 2026-05-25: Q1 RESOLVED by Tron via PO — Option A confirmed: self ProfileSheet shows [Download vCard, Edit→ProfileEditor]. Self also gets own vCard download.

## Subtasks
None (atomic task).
