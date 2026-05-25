[Back to Sprint 10 Planning](./planning.md)

# T81: Member Click → Profile Sheet → vCard Download

[task:uuid:c7e2d6f1-3a84-4b29-9d05-6e1f2a8b4c70]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [ ] testing (handed to robbin-tester — TS1-TS5)
- [ ] QA Review
- [ ] Done

## Implementation (robbin-expert, v0.4.9)
- Change 1 (BLOCKER): RoomView.ts `msg.profile`→`msg.user` in USER_INFO handler. Verified server.ts:1218 sends `user:{name,phone,url,avatar,playerToken}` — shapes match ProfileSheet.open().
- Change 2: rb-avatar.ts — added `readonly` to observedAttributes + circle-click guard (returns early, no stopPropagation, no overlay when readonly). rb-member-badge.ts:22 avatar now `readonly`.
- Change 3: moved rb-leave/rb-delete/rb-member-click container listeners from render() into constructor (container ref stable) — attach exactly once, no stacking.
- R3 audit: exactly 3 rb-avatar usages — member-badge (readonly), RoomBrowser lobby size=48 (editable), ProfileEditor size=80 (editable). ProfileSheet renders its own avatar HTML (no rb-avatar). No other usage. AC8/TS5 editable paths intact.
- Version bumped to v0.4.9, sw.js cache → rawbin-v0.4.9. esbuild build clean. (tsc: only pre-existing unrelated qrcode @types error in rb-qr-popup.ts, not my files.)

## Traceability
- up
  - [Sprint 10 Planning](./planning.md)
- down
  - None (atomic task)

## Assigned
**Owner:** robbin-expert (implement), robbin-tester (verify)
**This file is the single source of truth.** Expert and tester work from this file alone — no chat clarification.

---

## Problem Statement

Tron reports: clicking a joined user in a room does NOTHING. The vCard feature code exists (ProfileSheet.ts) but is unreachable. The goal: tap a joined member anywhere on their badge → their profile card opens → "Download vCard" produces a .vcf.

---

## Root Cause (diagnosed, evidence-backed)

Full click→event→request→response→open chain traced. It breaks at the response-handling step (step 6), with two secondary issues that also block "tap anywhere."

| Step | Location | Status |
|------|----------|--------|
| 1. Tap name → badge click listener fires | rb-member-badge.ts:30 | ✅ works |
| 2. Dispatch `rb-member-click` (bubbles:true, detail {playerToken,isSelf}) | rb-member-badge.ts:32 | ✅ works |
| 3. Bubble through light DOM to container listener | RoomView.ts:93 | ✅ works |
| 4. Send `GET_USER_INFO {playerToken}` | RoomView.ts:101 | ✅ works |
| 5. Server emits `{type:USER_INFO, **user**:{...}}` | server.ts:1218 | ✅ works |
| 6. Client handler checks `if (msg.**profile**)` | RoomView.ts:99 | ❌ **`msg.profile` is undefined — server sent `msg.user` — `profileSheet.open()` never called** |

**Primary root cause:** key mismatch — server sends payload under `user`, client reads `msg.profile`. Response round-trips successfully but is silently dropped.

**Secondary issue A — avatar click-hijack:** rb-avatar's circle click handler calls `e.stopPropagation()` then opens its own upload/crop overlay (rb-avatar.ts:89). Tapping the avatar region of a badge opens the avatar editor instead of bubbling `rb-member-click`. So even after the key fix, tapping the avatar part of a joined contact won't open their card.

**Secondary issue B — listener stacking:** RoomView.ts:91-93 attaches `rb-leave`/`rb-delete`/`rb-member-click` listeners on `this.container` inside `render()`, which runs on every ROOM_JOINED and show(). Repeated renders stack duplicate listeners → N duplicate `GET_USER_INFO` per tap.

---

## Design

### Change 1 — Fix the key mismatch (BLOCKER)

**File:** `src/public/ts/RoomView.ts` line 99

Current:
```typescript
const h = (msg: any) => { this.client.off(MSG.USER_INFO, h); if (msg.profile) this.profileSheet.open(msg.profile); };
```
Change to:
```typescript
const h = (msg: any) => { this.client.off(MSG.USER_INFO, h); if (msg.user) this.profileSheet.open(msg.user); };
```

`ProfileSheet.open(profile)` expects `{ name, phone, url, avatar, playerToken }` (ProfileSheet.ts:4-10). The server's `msg.user` (server.ts:1218) is exactly `{ name, phone, url, avatar, playerToken }`. Shapes match — no other change needed in ProfileSheet.

**Do NOT** change the server to send `profile` instead of `user` — `USER_INFO` deliberately uses `user` to distinguish a public third-party view from the self `PROFILE`/`PROFILE_UPDATED` messages. Fix the client read.

### Change 2 — rb-avatar `readonly` attribute (tap-anywhere)

**File:** `src/public/ts/components/rb-avatar.ts`

Add `readonly` to observed attributes (line 29):
```typescript
static get observedAttributes() { return ['src', 'size', 'name', 'token', 'crop', 'readonly']; }
```

Guard the circle click handler (line 89). Current:
```typescript
this.shadow.querySelector('.circle')?.addEventListener('click', (e) => { e.stopPropagation(); this.openOverlay(); });
```
Change to:
```typescript
this.shadow.querySelector('.circle')?.addEventListener('click', (e) => {
  if (this.hasAttribute('readonly')) return;   // let click bubble to host (e.g. member badge)
  e.stopPropagation();
  this.openOverlay();
});
```

When `readonly` is present: do NOT stopPropagation, do NOT open the editor overlay — the click bubbles up through the badge so `rb-member-click` fires.

**File:** `src/public/ts/components/rb-member-badge.ts` line 22

Add `readonly` to the inner avatar so member-badge avatars never open the editor:
```typescript
<rb-avatar size="24" src="${avatarUrl}" name="${name}" token="${token}" crop='${this.getAttribute('avatar-crop') || ''}' readonly></rb-avatar>
```

This applies to BOTH self and other badges. Self-avatar editing is NOT done from the badge — it is done via the self-click → ProfileEditor path (RoomView.ts:95-97), which opens ProfileEditor where the editable (non-readonly) rb-avatar lives. Confirm: the lobby avatar (RoomBrowser) and ProfileEditor avatar must remain WITHOUT `readonly` so they stay editable.

**rb-avatar usage audit (R3 — complete enumeration).** All `<rb-avatar>` element instances in the codebase (verified via grep 2026-05-25):

| # | File:line | Size | Context | readonly? |
|---|-----------|------|---------|-----------|
| 1 | `rb-member-badge.ts:22` | 24 | member badge (self + others) | **ADD `readonly`** (this task) |
| 2 | `RoomBrowser.ts:50` | 48 | lobby own-avatar | **NO readonly** — stays editable (guarded by AC8/TS5) |
| 3 | `ProfileEditor.ts:46` | 80 | profile editor (id=`pe-avatar`) | **NO readonly** — stays editable (guarded by AC8) |

No other `<rb-avatar>` instances exist. (`RawBinClient.ts:97,101` reference the `rb-avatar-updated` EVENT, not element instances — not affected.) Only usage #1 changes; #2 and #3 are explicitly left editable. No regression surface beyond these three.

### Change 3 — Listener-stacking guard

**File:** `src/public/ts/RoomView.ts`

Move the three container listeners (`rb-leave`, `rb-delete`, `rb-member-click`, currently RoomView.ts:91-103) out of `render()` so they attach exactly once. Recommended: attach them in the constructor (the container reference is stable), OR add a private `private listenersAttached = false;` guard and skip re-attaching.

Constraint: the `rb-member-click` handler references `this.roomId`/`this.client` which are stable on the instance, so moving to constructor is safe — it reads current `this.*` at event time, not at attach time.

### Change 4 — Version bump (R2 — required for the fix to reach the device)

Without a version bump the PWA update-detection has nothing to detect and the fix never reaches Tron's iPhone (hard-won SW-versioning rule).

**File:** `package.json` — bump `"version"` from `0.4.8` → **`0.4.9`**.

**File:** `src/public/sw.js` — bump the cache version. NOTE: `build.mjs` already stamps `CACHE_NAME` from `package.json` version on every build (it rewrites `const CACHE_NAME = 'rawbin-v<version>'`). So bumping `package.json` to 0.4.9 + running `node build.mjs` propagates the cache name automatically. Verify the built `sw.js` shows `rawbin-v0.4.9` after build; if the auto-stamp is absent for any reason, set it manually.

Result: `/api/config` and `/api/health` report `version: 0.4.9`; the client's update banner detects the new version and prompts reload, delivering the fix.

---

## Acceptance Criteria

- [ ] AC1: Tapping a joined member's **name** opens their profile sheet (`.user-sheet` visible)
- [ ] AC2: Tapping a joined member's **avatar** opens their profile sheet (NOT the avatar editor overlay)
- [ ] AC3: Tapping a joined member's **status dot** opens their profile sheet
- [ ] AC4: The opened sheet shows the member's name and avatar
- [ ] AC5: "Download vCard" button is present in the sheet and clicking it invokes the vCard builder (produces a .vcf blob)
- [ ] AC6: Tapping OWN badge opens ProfileEditor (self-edit path preserved, NOT the read-only sheet) — NOTE: SUPERSEDED by [T83](./task-83-self-click-profile.md), which changes self-click to open the read-only ProfileSheet per Tron directive 2026-05-25
- [ ] AC7: Exactly ONE `GET_USER_INFO` WS message is sent per tap (no listener stacking) — verify after navigating room→lobby→room twice
- [ ] AC8: Lobby avatar (RoomBrowser) and ProfileEditor avatar remain editable (tapping them opens the editor overlay — readonly NOT applied there)
- [ ] AC9: `npm run build` succeeds
- [ ] AC10: All existing E2E specs still pass (no regression) + new test (below) passes
- [ ] AC11: Served bundle reflects **v0.4.9** — `GET /api/health` (and `/api/config`) report `version: 0.4.9`, and built `sw.js` CACHE_NAME is `rawbin-v0.4.9` (so the PWA update banner fires and the fix reaches the device)

---

## Test Scenarios (tester works from these directly)

### TS1 — Two-client member click opens sheet (E2E, new spec: `member-vcard.spec.ts`)

```
1. Client A (page1): ensureLobby(page1, 'OwnerA'), create a room, note room URL/id
2. Client B (page2): ensureLobby(page2, 'GuestB'), join the same room
3. On page1, wait for GuestB's badge to appear in member list (rb-member-badge with name "GuestB")
4. page1 taps GuestB's badge name → expect '.user-sheet' visible within 5s
5. Assert sheet contains text "GuestB"
6. Assert '#us-vcard' button visible
7. Click '#us-vcard' → assert no error thrown (download triggered; .vcf content not asserted here)
```

### TS2 — Tap avatar region opens sheet, not editor

```
1. Same setup as TS1 (page1 sees GuestB)
2. page1 taps GuestB badge's rb-avatar (shadow .circle)
3. Expect '.user-sheet' visible (the contact card)
4. Expect NO '.overlay' with '#ov-upload-btn' (the avatar editor must NOT open)
```

### TS3 — Self-tap opens editor (regression guard)

```
1. ensureLobby(page, 'SelfUser'), create/enter a room
2. Tap own badge (name === SelfUser, is-self present)
3. Expect ProfileEditor overlay ('#pe-name' visible), NOT '.user-sheet'
```

### TS4 — No listener stacking (single request per tap)

```
1. ensureLobby + enter room, leave to lobby, re-enter room (forces render() twice)
2. Instrument: page.on WS frames OR window hook counting GET_USER_INFO sends
3. Tap a member badge once
4. Assert exactly 1 GET_USER_INFO frame sent (not 2+)
```

### TS5 — Editable avatars unaffected (regression guard)

```
1. ensureLobby(page, 'EditUser')
2. In lobby, tap the lobby avatar (rb-avatar size=48, NOT readonly)
3. Expect avatar editor overlay opens ('#ov-upload-btn' visible)
```

---

## Downstream Risk (SEPARATE — not in T81 scope)

iOS Safari .vcf download: ProfileSheet.ts:102-107 uses `Blob` + `a.download` + `a.click()`. iOS Safari ignores `a.download` and won't reliably download .vcf. Verify on Tron's iPhone AFTER the click path works. If it fails, fix is a server endpoint `GET /api/vcard/<token>` with `Content-Disposition: attachment; Content-Type: text/vcard`. **Do NOT bundle into T81** — separate downstream task.

---

## Refinement Log

- 2026-05-25 robbin-architect: initial complete spec drafted (design + AC + 5 test scenarios). Ready for PO review.
- 2026-05-25 robbin-po (review round 1): Spec content is delegatable-quality — root cause is evidence-backed, design has exact diffs, AC7's "exactly 1 GET_USER_INFO per tap" is good CMM4 measurement. THREE refinements before handoff:
  - **R1 — Sprint placement (planner):** This is NOT Sprint 9 (Room Identity, closed/QA'd). It is the first Sprint 10 task. Planner: stand up the Sprint 10 dir + planning.md, relocate this file there, fix the "Back to Planning" link, and set up-traceability. Keep the T81 id.
  - **R2 — Version bump (architect, add to Design + AC):** Add an explicit step to bump `package.json` to **v0.4.9** AND bump the `sw.js` cache version. Without it the PWA update detection has nothing to detect and the fix never reaches Tron's iPhone (hard-won SW-versioning rule). Add **AC11: served bundle / `/api/health` reflects v0.4.9**.
  - **R3 — rb-avatar usage audit (architect, add one-line Design note):** Confirm ALL `rb-avatar` usages were enumerated so none regress: member-badge = `readonly`; RoomBrowser/lobby + ProfileEditor = editable (no readonly). State explicitly whether any OTHER usage exists. AC8/TS5 already guard the known editable ones.
  - After R1–R3 are applied IN THIS FILE and architect reports back to 0.0: PO re-reviews → then expert implements against this file + tester builds TS1–TS5. No chat clarification.
- 2026-05-25 robbin-architect (review round 1 response): R2 applied — added Design "Change 4 — Version bump" (package.json 0.4.8→0.4.9; build.mjs auto-stamps sw.js CACHE_NAME) + AC11 (served bundle/api/health reflects v0.4.9). R3 applied — added complete rb-avatar usage audit table to Design (3 instances: member-badge=readonly, RoomBrowser:50 + ProfileEditor:46 = editable; no other instances; RawBinClient lines are events not instances). R1 (relocation to Sprint 10) done by planner — file now at sprint-10-contacts-ui/. Design diffs for Changes 1–3 unchanged (expert implementing in parallel). Ready for PO re-review.

## QA Audit & User Feedback
- Pending PO refinement review, then Tron QA.

## Subtasks
None (atomic task for this sprint).
