[Back to Sprint 10 Planning](./planning.md)

# T82: vCard Button Visibility + ProfileSheet Avatar DRY

[task:uuid:e8d3a7b2-5c61-4f08-a3d9-2b7c4e1f9a06]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [ ] testing (handed to robbin-tester — TS1-TS4)
- [ ] QA Review
- [ ] Done

## Implementation (robbin-expert, 2026-05-26, v0.5.0)
- **Change 1 (CSS, app.css):** added `.user-sheet .btn-secondary { background: rgba(102,126,234,0.12); color: #667eea; }` + `:active` — scoped to `.user-sheet` only, so the vCard button is readable blue-on-white (AC1) and the global lobby `.btn-secondary` (dark bg) is untouched (AC7/TS3).
- **Change 2 (ProfileSheet.ts):** `import './components/rb-avatar.js'`; replaced inline `<img>`/`avatarHtml` with `<rb-avatar size="80" name token [src] readonly>` inside `.user-sheet-avatar` — derives image from `/api/avatar/<their-token>`, gets crop + live refresh + initial fallback, readonly so tap doesn't open editor (AC4/AC5/AC6).
- **Change 3 (ProfileSheet.ts):** `open(profile, opts: SheetOpts = {})` with `interface SheetOpts { isSelf?; onEdit? }`. Button row branches: vCard always; `!isSelf` → Link Account (implemented); `isSelf` → `#us-edit` Edit Profile markup present but NOT wired (T83 owns it + self-click routing). ProfileSheet does NOT import ProfileEditor — seam contract preserved (AC11). setupEvents uses optional chaining so absent `us-link` is safe.
- **Change 4:** version 0.4.11 → 0.5.0, sw.js cache → rawbin-v0.5.0 (AC9).
- tsc clean (ProfileSheet), build clean (bundle app-KVWCKUZI.js). vCard builder `downloadVCard()` unchanged (AC3).

## Traceability
- up
  - [requirement:uuid:20b2c3d4-e5f6-4a71-9b82-0c1d2e3f4a51](./requirements.md) — R10.2 vCard button visibility + avatar DRY
  - [Sprint 10 Planning](./planning.md)
- down
  - None (atomic task)
- follows
  - [T81](./task-81-member-click-vcard.md) — member-click landed (v0.4.9); T82 fixes follow-on sheet defects

## Assigned
**Owner:** robbin-expert (implement), robbin-tester (verify)
**This file is the single source of truth.** Expert and tester work from this file alone — no chat clarification.

---

## Problem Statement

T81 (v0.4.9) fixed the member click — tapping a joined user opens their profile sheet. Tron's iPhone test surfaced two follow-on defects in the opened sheet:

1. **"Download vCard" button appears MISSING** — but "Link Account" button IS present.
2. **The sheet's profile picture is a duplicated inline `<img>`, not the `rb-avatar` web component** (DRY violation) — and it's not clickable.

---

## Root Cause (diagnosed, evidence-backed)

### Defect 1 — vCard button is INVISIBLE, not missing (CSS contrast bug)

There is exactly **ONE** profile-sheet implementation: `ProfileSheet.ts` (a plain class, not a custom element; no `rb-profile-sheet` exists). RoomView opens it via `profileSheet.open(msg.user)`. Both buttons render unconditionally — **the vCard button is NOT behind any isSelf/isBot/missing-data conditional.** Confirmed in source AND in the served bundle (`app-DEHLXFAI.js`): both `#us-vcard` and `#us-link` are emitted.

The button is in the DOM but **rendered invisible**:

| Element | Class | CSS | On white sheet |
|---------|-------|-----|----------------|
| `.profile-sheet` | — | `background: white` (app.css:156) | white card |
| `#us-vcard` "Download vCard" | `.btn-secondary` | `background: rgba(255,255,255,0.2); color: white` (app.css:20) | **white text on ~transparent-white → INVISIBLE** |
| `#us-link` "Link Account" | `.btn-primary` | `background: #667eea; color: white` (app.css:19) | blue button → visible |

`.btn-secondary` was designed for the dark gradient lobby background, where white-on-translucent reads fine. Reused on the white profile sheet, it's white-on-white. The vCard button is there; you can't see it.

### Defect 2 — ProfileSheet avatar is a plain `<img>`, not rb-avatar (DRY)

`ProfileSheet.ts:23-26` builds the avatar inline:
```typescript
const avatarSrc = profile.avatar || '';
const avatarHtml = avatarSrc
  ? `<img src="${avatarSrc}" alt="${profile.name}">`
  : `<span class="avatar-placeholder">?</span>`;
```
Rendered at line 34 inside `.user-sheet-avatar`. This duplicates avatar rendering that `rb-avatar` already owns. Consequences: no crop transform, no `rb-avatar-updated` live refresh, inconsistent fallback logic, not clickable. Every other avatar surface (member badge, lobby, editor) uses `rb-avatar`; the sheet is the lone exception.

---

## Design

### Change 1 — Make secondary buttons visible on the white sheet (fixes Defect 1)

Do NOT change the vCard button's purpose or add conditionals. Fix the contrast so `.btn-secondary` is readable on the white `.profile-sheet`. Scoped CSS override so the lobby's `.btn-secondary` (on dark bg) is unaffected.

**File:** `src/public/app.css` — add after the `.user-sheet-btn` rule (app.css:180 area):
```css
.user-sheet .btn-secondary { background: rgba(102,126,234,0.12); color: #667eea; }
.user-sheet .btn-secondary:active { background: rgba(102,126,234,0.22); }
```

This gives the vCard button a light-blue background with readable blue text on the white sheet, visually distinct from the solid-blue primary "Link Account". Any future `.btn-secondary` placed inside `.user-sheet` is also fixed. The global `.btn-secondary` (dark lobby) is untouched.

**Rationale for scope:** the bug is "secondary button invisible on white sheet" generally — scoping to `.user-sheet` fixes the class of bug, not just the one button (DRY).

### Change 2 — Replace inline `<img>` with `rb-avatar readonly` (fixes Defect 2)

**File:** `src/public/ts/ProfileSheet.ts`

Add the import at top:
```typescript
import './components/rb-avatar.js';
```

Replace the inline avatar block (lines 23-26 + its use at line 34). Remove `avatarSrc`/`avatarHtml`; render the component directly. `rb-avatar` derives its image from `token` via `/api/avatar/<token>` (rb-avatar.ts:56-59) and accepts an explicit `src` (preferred if set). Pass the foreign user's `playerToken` so it loads their avatar, with `readonly` (per T81 — readonly avatars do not open the editor overlay; the click bubbles harmlessly).

Line 34 becomes:
```html
<div class="user-sheet-avatar"><rb-avatar size="80" name="${profile.name || '?'}" token="${profile.playerToken || ''}" ${profile.avatar ? `src="${profile.avatar}"` : ''} readonly></rb-avatar></div>
```

Notes:
- `readonly` (T81 pattern): tapping does not open the upload/crop editor — correct for viewing another user's card.
- `rb-avatar` brings crop support + `rb-avatar-updated` live refresh + the shared initial-letter fallback for free.
- Keep the `.user-sheet-avatar` wrapper for layout (80px circle). The `.user-sheet-avatar img` CSS (app.css:178) still applies to the `<img>` rb-avatar renders inside its shadow root — actually rb-avatar styles its own shadow content, so the wrapper just centers it; confirm the 80px sizing comes from the `size="80"` attribute, not the wrapper. If the wrapper's fixed 80px conflicts, the `size` attribute governs the component — leave the wrapper as a centering container.

### Change 3 — Button row structured for self/other (anticipates T83)

T82 and T83 reshape the SAME component (ProfileSheet). To avoid rework, build the button row now as an `isSelf` branch. Tron-confirmed final matrix:

| Viewer | Buttons |
|--------|---------|
| OTHER member | `[Download vCard]` `[Link Account]` |
| SELF | `[Download vCard]` `[Edit → opens ProfileEditor]` |

`Download vCard` is **common to both** (always rendered). The second button differs.

**File:** `src/public/ts/ProfileSheet.ts`

Extend `open()` to accept an options object (default `{}`):
```typescript
interface SheetOpts { isSelf?: boolean; onEdit?: () => void; }
open(profile: PublicProfile, opts: SheetOpts = {}): void {
  const isSelf = opts.isSelf === true;
  // store opts.onEdit for the Edit button handler (T83 wires the click)
```

Render the button row with the branch (Change 1 CSS makes the secondary button visible):
```html
<button id="us-vcard" class="btn btn-secondary user-sheet-btn">Download vCard</button>
${isSelf
  ? `<button id="us-edit" class="btn btn-primary user-sheet-btn">Edit Profile</button>`
  : `<button id="us-link" class="btn btn-primary user-sheet-btn" data-token="${profile.playerToken}" data-name="${profile.name}">Link Account</button>`}
```

**T82 implements ONLY the `!isSelf` path** (Download vCard + Link Account, both visible). The `isSelf` branch markup may be present, but:
- T82 callers pass no opts / `{}` (only OTHER members reach the sheet today; RoomView self-click still opens ProfileEditor directly until T83).
- **T83 owns:** routing self-click to `profileSheet.open(ownProfile, { isSelf: true, onEdit: () => profileEditor.open(...) })` AND wiring `#us-edit` → `opts.onEdit()`. Do NOT wire `#us-edit` in T82.

This way T83 fills the self branch without restructuring the row or the avatar — T82's CSS, avatar, and row scaffold already support both.

**Seam contract for T83 (do not change in T82):**
- `open(profile, opts: { isSelf?, onEdit? })` — options object, NOT positional (coherent with T83)
- `#us-vcard` works identically for self and other (vCard builder is viewer-agnostic — uses `profile.*`)
- `#us-edit` is the self-only button id T83 wires to `opts.onEdit()`
- ProfileSheet stays DECOUPLED from ProfileEditor — never imports/constructs it; only invokes the `onEdit` callback the caller (RoomView) supplies

### Change 4 — Version bump (required to reach the device)

Per the SW-versioning rule (same as T81): bump `package.json` `"version"` 0.4.9 → **0.5.0** and rebuild (`node build.mjs` auto-stamps `sw.js` CACHE_NAME → `rawbin-v0.5.0`). Without it the PWA update banner never fires and Tron's iPhone keeps the old bundle.

---

## Acceptance Criteria

- [ ] AC1: "Download vCard" button is VISIBLE in the joined-user sheet (readable text, distinct from "Link Account")
- [ ] AC2: "Link Account" button remains visible and unchanged
- [ ] AC3: Clicking "Download vCard" invokes the vCard builder (produces a .vcf blob) — behavior unchanged from existing `downloadVCard()`
- [ ] AC4: The sheet's avatar is an `<rb-avatar>` element (NOT a bare `<img>` built inline in ProfileSheet)
- [ ] AC5: The sheet avatar shows the joined user's picture (loaded from `/api/avatar/<their-token>`), or the initial-letter fallback if none
- [ ] AC6: The sheet avatar is `readonly` — tapping it does NOT open the upload/crop editor overlay
- [ ] AC7: Lobby `.btn-secondary` buttons (dark background, e.g. "Refresh") remain visible/unchanged — the CSS override is scoped to `.user-sheet` only
- [ ] AC8: `npm run build` succeeds; no new tsc errors in changed files
- [ ] AC9: Served bundle reflects **v0.5.0** — `/api/health` + `/api/config` report `version: 0.5.0`, built `sw.js` CACHE_NAME is `rawbin-v0.5.0`
- [ ] AC10: All existing E2E specs still pass (no regression) + new test (below) passes
- [ ] AC11: `ProfileSheet.open(profile, opts?: { isSelf?, onEdit? })` signature exists; with default/`{}` opts the row renders `[Download vCard][Link Account]` (T82's only implemented path). The `isSelf=true` branch markup (`#us-edit`) may be present but is NOT wired in T82 — T83 owns it. ProfileSheet does NOT import ProfileEditor.

---

## Test Scenarios (tester works from these directly)

### TS1 — vCard button visible + functional (extend member-vcard.spec.ts or new)

```
1. Client A: ensureLobby(page1, 'OwnerA'), create a room
2. Client B: ensureLobby(page2, 'GuestB'), join the room
3. page1 taps GuestB's badge → '.user-sheet' visible
4. Assert '#us-vcard' is visible AND its computed color/background differ (not white-on-white):
   - evaluate getComputedStyle(#us-vcard).color !== getComputedStyle(.profile-sheet).backgroundColor
   - OR simpler: assert #us-vcard is visible() AND bounding box height > 0
5. Click '#us-vcard' → no error thrown (download triggered)
```

### TS2 — Sheet avatar is rb-avatar, readonly

```
1. Setup as TS1 (page1 sees GuestB sheet open)
2. Assert '.user-sheet rb-avatar' exists (querySelector returns an element)
3. Assert NO bare '.user-sheet-avatar > img' built by ProfileSheet (the img now lives inside rb-avatar's shadow root, not as a direct ProfileSheet child)
4. Tap the rb-avatar in the sheet → assert NO '.overlay' with '#ov-upload-btn' appears (readonly: editor must not open)
```

### TS3 — Lobby secondary buttons unaffected (regression guard)

```
1. ensureLobby(page, 'RegUser')
2. In lobby, assert '#refresh-rooms-btn' (.btn-secondary on dark bg) is visible with its original light-on-dark styling
3. (Confirms the .user-sheet-scoped override did not leak to global .btn-secondary)
```

### TS4 — vCard content still well-formed (data parity guard)

```
1. Open GuestB sheet (TS1)
2. Intercept the blob created by downloadVCard (hook URL.createObjectURL or read the <a> href)
3. Assert vCard text starts 'BEGIN:VCARD' / 'VERSION:3.0' / contains 'FN:GuestB' / ends 'END:VCARD'
```

---

## Out of Scope

- iOS Safari .vcf download reliability (Blob + a.download ignored by iOS) — still the separate downstream task noted in T81. T82 only makes the button visible + the avatar DRY. If Tron taps vCard on iPhone and nothing downloads, that is the iOS endpoint task, not T82.
- Adding TEL/URL/NOTE-UUID parity to the vCard — separate enhancement.

---

## Refinement Log

- 2026-05-25 robbin-architect: drafted complete spec. Root cause: (1) vCard button invisible — `.btn-secondary` white-on-white on white `.profile-sheet` (app.css:20 vs :156); NOT conditional, NOT a duplicate sheet (single ProfileSheet.ts confirmed). (2) ProfileSheet avatar is inline `<img>` (ProfileSheet.ts:23-26,34), not rb-avatar. Fix: scope `.user-sheet .btn-secondary` to readable colors + swap inline img for `<rb-avatar readonly>` + version bump 0.5.0. Ready for PO review.
- 2026-05-25 robbin-architect (coordination w/ T83): added Change 3 — `open(profile, isSelf)` button-row scaffold so T82 and T83 reshape ProfileSheet coherently (no rework). Final matrix: vCard common; OTHER=Link Account, SELF=Edit. T82 implements only `!isSelf`; T83 wires the `#us-edit` self branch + self-click routing. Seam contract documented (AC11). Version bump renumbered Change 3→Change 4.

## QA Audit & User Feedback
- Pending PO refinement review, then Tron QA.

## Subtasks
None (atomic task for this sprint).
