[Back to Sprint 13 Planning](./planning.md)

# T142: Upload-vCard onboarding gate — speed up first-time profile fill

[task:uuid:c481a2b9-b61d-4a0f-a077-690a9e2e1aa9]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement (req → architect)
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Assigned
**Owners (CMM4 4-role, per learnings #18) — sequence req → architect → expert → tester:**
1. **robbin-req** — anchor verbatim Tron quote; formalize `requirement:uuid` below
2. **robbin-architect** — design the upload-vCard button placement on the first-connect profile-fill flow + vCard-to-profile field mapping (name, phone, url, avatar)
3. **robbin-expert** — implement per architect's design (likely ProfileEditor + vCard parser hookup)
4. **robbin-tester** — verify first-connect flow: button visible at top, .vcf upload populates profile fields, manual fill still works as fallback

**This file is the single source of truth.** No chat clarification.

## Traceability

`[task:uuid:c481a2b9-b61d-4a0f-a077-690a9e2e1aa9]`

- up
  - [Sprint 13 Planning](./planning.md)
  - **requirement:** `[requirement:uuid:a3b4c5d6-e7f8-4a9b-0c1d-2e3f4a5b6c7d]` (req-eng, B3 in backlog.md) —
    Tron literal: "on first time connect we have to fill out profile. add a upload vcard button at the top to speed up onboarding and initialize from the card. can be dropped natively from os drag and drop eg on iphone but also android and windows."
    **⚠️ Planner flag (learnings #17):** this uuid (4th group `0c1d`) is NOT valid v4 — variant nibble `0` is outside `[89ab]`. trace-cli will silently drop it. Recommend req regenerate via `uuidgen` before any chain commits depend on it. Using as-is here to preserve the backlog→task link until req refreshes.
  - **promoted from:** B3 in [backlog.md](../../backlog.md) (2026-05-31)
- down
  - None (atomic task — single onboarding UI feature)
- follows
  - existing ProfileEditor flow (Sprint 2 identity work + Sprint 7 avatar profile work — `src/public/ts/ProfileEditor.ts`, `src/public/ts/ProfileSheet.ts`)
  - existing vCard *download* (ProfileSheet.downloadVCard, post-T52 Sprint 7) — this task adds the inverse *upload* direction
- chain (req → usecase → puml → class/method)
  - **requirement:** upload-vCard onboarding gate (Tron 2026-05-31)
  - **use case:** new — `profile.uploadVCard`, `profile.dropVCard`, `profile.initFromVCard` (architect adds UC instances at refinement)
  - **puml:** likely `scrum.pmo/sprints/sprint-2-identity-ssh/diagrams/` (identity flow) — architect picks location
  - **class/method:** `src/public/ts/ProfileEditor.ts` (UI: upload button at top + drop-zone on the form), new vCard V3.0 parser (vCard is line-oriented `KEY:VALUE`; the project currently only exports vCards via ProfileSheet.downloadVCard — this is the inverse import direction), profile-field mapping helper, HTML5 drag-and-drop handlers (`dragenter`/`dragover`/`drop` events)

## Problem Statement (req-eng captured in B3; full literal in requirement: block above)

Tron literal (verbatim, full quote): *"on first time connect we have to fill out profile. add a upload vcard button at the top to speed up onboarding and initialize from the card. can be dropped natively from os drag and drop eg on iphone but also android and windows."*

Today: first-time connect → ProfileEditor opens with empty fields (name, phone,
url, avatar) — user types each. Faster path: TWO input methods:

1. **Upload button** at the TOP of the first-time-connect profile gate — user clicks → native file picker → select .vcf → form pre-fills.
2. **Native OS drag-and-drop** — user drags a .vcf from the OS file system / share sheet onto the form → form pre-fills. **Multi-platform: iOS, Android, Windows.**

Both pre-fill profile fields from the vCard: FN→name, TEL→phone, URL→url, PHOTO→avatar. Manual fill stays as fallback.

## Architect Design (TO FILL during refinement)
Architect: walk the current first-connect flow (ProfileEditor open path on no
profile / empty profile) and design BOTH input methods:

### Method 1 — Upload button
1. **Button placement:** "Upload vCard" at the TOP of the ProfileEditor form,
   visually prominent (this is the speed-up affordance — should be the first
   thing the user sees).
2. **vCard parsing:** RFC 6350 minimal subset — FN, TEL, URL, PHOTO. Use a
   small lib or hand-parse (vCard is line-oriented `KEY:VALUE`). Avatar from
   PHOTO field (base64 or URL): if base64, POST to `/api/avatar` (T50
   endpoint) like the existing avatar upload flow; if URL, set profile.avatar
   directly.
3. **Field population:** populate the form inputs (don't auto-save — let user
   review + edit before submit). Highlight pre-filled fields visually so user
   knows what came from the .vcf.
4. **Manual fill fallback:** unchanged behavior if no .vcf uploaded. Upload is
   strictly additive.
5. **Edge cases:** corrupt .vcf (parse error) — show inline error, don't break
   the form; partial fields — fill what's present, leave rest empty; PHOTO
   absent — keep the default random avatar (existing T48 flow).
6. **Mobile (iPhone):** `<input type="file" accept=".vcf,text/vcard">` triggers
   native file picker. Confirm iOS Safari accepts `.vcf` (test in tester
   phase).

### Method 2 — OS native drag-and-drop (multi-platform)
7. **Drop zone:** the entire ProfileEditor form (or a clearly-marked region at the top) acts as an HTML5 drop target. Visual cue on `dragenter` (e.g. dashed border + "Drop your .vcf here" overlay).
8. **HTML5 drag-drop API:** `dragenter`/`dragover` (preventDefault to enable drop) + `drop` (read `event.dataTransfer.files[0]` if `.vcf` mime/extension). Parse identical to Method 1.
9. **Platform notes (architect verifies):**
   - **Windows:** native drag from Explorer works via standard HTML5 dataTransfer. Test in Chrome+Edge.
   - **macOS:** same — native drag from Finder.
   - **iOS Safari (iPhone/iPad):** drag from Files app or share-sheet drop — supported in iOS 15+ Safari with `event.dataTransfer.items`. Verify support; provide button fallback if drag is unreliable.
   - **Android Chrome:** drag from Files app on Android 11+ supported; older versions degrade to button.
10. **Reject non-.vcf drops:** show inline error, don't break the form.
11. **A11y:** drop zone should be keyboard-equivalent to the upload button (both reach the same parse path).

## Architect Design — robbin-architect (2026-05-31)

### Button Placement + Label

In ProfileEditor.open() (line 39-60), add BEFORE the avatar row:

```html
<div class="profile-vcard-import">
  <button id="pe-import-vcard" class="btn btn-primary profile-vcard-btn">
    📇 Import vCard
  </button>
  <input type="file" id="pe-vcf-input" accept=".vcf,text/vcard" hidden>
  <p class="profile-vcard-hint">or drag & drop a .vcf file here</p>
</div>
```

Gate mode: prominent (primary style, full-width). Normal mode: secondary style, same position.

### vCard Parser (hand-rolled, ~30 lines, no lib)

New file: `src/public/ts/vcard-parse.ts`

```typescript
export interface VCardData {
  fn?: string;
  tel?: string;
  url?: string;
  photo?: Blob;
}

export function parseVCard(text: string): VCardData {
  const result: VCardData = {};
  // RFC 6350 unfold: lines starting with space/tab are continuations
  const lines = text.replace(/\r\n[ \t]/g, '').replace(/\r\n/g, '\n').split('\n');

  for (const line of lines) {
    if (line.startsWith('FN:')) {
      result.fn = line.slice(3).trim();
    } else if (line.startsWith('TEL') && line.includes(':')) {
      result.tel = line.slice(line.indexOf(':') + 1).trim();
    } else if (line.startsWith('URL') && line.includes(':')) {
      result.url = line.slice(line.indexOf(':') + 1).trim();
    } else if (line.startsWith('PHOTO')) {
      const dataStart = line.indexOf(':') + 1;
      const base64Data = line.slice(dataStart).trim();
      if (!base64Data) continue;
      const mimeMatch = line.match(/TYPE=(\w+)/i) || line.match(/MEDIATYPE=image\/(\w+)/i);
      const mime = mimeMatch ? `image/${mimeMatch[1].toLowerCase()}` : 'image/jpeg';
      try {
        const binary = atob(base64Data);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        result.photo = new Blob([bytes], { type: mime });
      } catch { /* corrupt base64 — skip photo silently */ }
    }
  }
  return result;
}
```

Handles both vCard v3 (`ENCODING=b;TYPE=JPEG`) and v4 (`MEDIATYPE=image/jpeg`).

### Profile Form Pre-Fill

In ProfileEditor.ts, new method:

```typescript
private async applyVCard(vcf: VCardData): void {
  if (vcf.fn) {
    const nameInput = document.getElementById('pe-name') as HTMLInputElement;
    nameInput.value = vcf.fn;
    nameInput.dispatchEvent(new Event('input')); // trigger gate-mode enable logic
  }
  if (vcf.tel) (document.getElementById('pe-phone') as HTMLInputElement).value = vcf.tel;
  if (vcf.url) (document.getElementById('pe-url') as HTMLInputElement).value = vcf.url;
  if (vcf.photo) {
    // Feed photo blob into rb-avatar's existing upload pipeline
    const avatar = document.getElementById('pe-avatar') as any;
    if (avatar?.uploadBlob) avatar.uploadBlob(vcf.photo);
  }
}
```

### rb-avatar Extension (~5 lines)

Add `uploadBlob(blob: Blob)` to rb-avatar.ts — bypasses file picker, feeds directly into the crop/encrypt pipeline:

```typescript
// In rb-avatar.ts, alongside existing file-input change handler:
uploadBlob(blob: Blob): void {
  const file = new File([blob], 'vcard-photo.jpg', { type: blob.type });
  this.handleFile(file); // reuse existing handleFile() path
}
```

### Drag-and-Drop Handler

In ProfileEditor.setupEvents(), add to the overlay:

```typescript
const overlay = this.overlay!;
overlay.addEventListener('dragover', (e: DragEvent) => {
  e.preventDefault();
  e.dataTransfer!.dropEffect = 'copy';
  overlay.classList.add('profile-drag-active');
});
overlay.addEventListener('dragleave', () => {
  overlay.classList.remove('profile-drag-active');
});
overlay.addEventListener('drop', async (e: DragEvent) => {
  e.preventDefault();
  overlay.classList.remove('profile-drag-active');
  const file = e.dataTransfer?.files[0];
  if (!file || (!file.name.endsWith('.vcf') && file.type !== 'text/vcard')) {
    this.showVCardError('Please drop a .vcf file');
    return;
  }
  try {
    const text = await file.text();
    const vcf = parseVCard(text);
    if (!vcf.fn && !vcf.tel && !vcf.url && !vcf.photo) {
      this.showVCardError('No profile data found in this vCard');
      return;
    }
    this.applyVCard(vcf);
  } catch {
    this.showVCardError('Could not read this file');
  }
});
```

### File Picker Handler

```typescript
document.getElementById('pe-import-vcard')?.addEventListener('click', () => {
  document.getElementById('pe-vcf-input')?.click();
});
document.getElementById('pe-vcf-input')?.addEventListener('change', async (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const vcf = parseVCard(text);
    this.applyVCard(vcf);
  } catch {
    this.showVCardError('Could not parse this vCard');
  }
});
```

### Error Display

```typescript
private showVCardError(msg: string): void {
  const hint = this.overlay?.querySelector('.profile-vcard-hint');
  if (hint) { hint.textContent = msg; hint.classList.add('profile-vcard-error'); }
  setTimeout(() => {
    if (hint) { hint.textContent = 'or drag & drop a .vcf file here'; hint.classList.remove('profile-vcard-error'); }
  }, 3000);
}
```

### CSS

```css
.profile-vcard-import { text-align: center; margin-bottom: 16px; }
.profile-vcard-btn { width: 100%; font-size: 1rem; }
.profile-vcard-hint { font-size: 0.75rem; color: #999; margin-top: 4px; }
.profile-vcard-error { color: #e74c3c; }
.profile-drag-active { outline: 2px dashed #667eea; outline-offset: -4px; }
```

### Summary

| Piece | File | Lines |
|-------|------|-------|
| vCard parser | `src/public/ts/vcard-parse.ts` (NEW) | ~30 |
| applyVCard + error | `ProfileEditor.ts` | ~25 |
| File picker + drag-drop handlers | `ProfileEditor.ts` | ~25 |
| rb-avatar.uploadBlob | `rb-avatar.ts` | ~5 |
| CSS | `app.css` | ~6 |
| **Total** | | **~91 lines** |

## Acceptance Criteria
- [ ] AC1 — On first-connect ProfileEditor, an "Upload vCard" button is visible at the TOP of the form
- [ ] AC2 — Clicking the button opens the native file picker filtered to `.vcf` / `text/vcard`
- [ ] AC3 — Selecting a valid .vcf populates name (FN), phone (TEL), url (URL), avatar (PHOTO if present) into the form inputs
- [ ] AC4 — Pre-filled fields are visually marked (architect picks: badge, color, "from vCard" hint)
- [ ] AC5 — User can edit pre-filled fields before submit (no auto-save)
- [ ] AC6 — Manual fill (no vCard upload) still works exactly as before
- [ ] AC7 — Corrupt .vcf shows inline error; form stays usable
- [ ] AC8 — PHOTO field: data URL → posted to `/api/avatar` (T50 flow); URL → set profile.avatar; absent → keep default random avatar (T48 flow)
- [ ] AC9 — Mobile (iPhone Safari): file picker accepts .vcf; flow works on touch viewport
- [ ] AC10 — **Native OS drag-and-drop drop zone**: dragging a .vcf from the OS file system onto the form triggers the same parse + populate flow as Method 1
- [ ] AC11 — Drop zone shows visual cue on `dragenter` (architect picks: dashed border / overlay / etc.)
- [ ] AC12 — Multi-platform drag-drop verified by tester: **macOS Finder drag**, **Windows Explorer drag**, **iOS Safari (iPhone) drag from Files/share-sheet**, **Android Chrome drag from Files**. Document any platforms where drag is unsupported — those fall back to Method 1 button (no broken UX)
- [ ] AC13 — Non-.vcf drops rejected with inline error; form stays usable
- [ ] AC14 — Drop zone keyboard-equivalent to upload button (a11y parity)
- [ ] AC15 — `npm run build` succeeds; full vitest + playwright pass; **rule-pair (a) package.json + (b) sw.js CACHE_NAME bumped** per learnings #15 (client-facing UI change); **(c) STATIC_SHELL exempt** per #16 (no new route — confirm in commit)
- [ ] AC16 — No regression: existing vCard *download* (ProfileSheet.downloadVCard) still works; the new *upload+drop* is the inverse direction, all three flows coexist

## Test Scenarios
File: `test/vitest/profile-editor-vcard-upload.test.ts` (new) + Playwright spec extension.

| Test | Action | Expected |
|------|--------|----------|
| TS1 | Render ProfileEditor with no profile data; upload sample.vcf | Form fields populated: FN→name, TEL→phone, URL→url |
| TS2 | Sample.vcf has PHOTO (base64 jpeg) | Avatar uploaded via /api/avatar; profile.avatar set to /api/avatar/<token> |
| TS3 | Sample.vcf has PHOTO (URL ref) | profile.avatar set to URL directly |
| TS4 | Sample.vcf with corrupt body | Inline error displayed; form remains editable |
| TS5 | Partial .vcf (only FN, no TEL) | name populated; phone empty (user fills) |
| TS6 | Manual fill (no .vcf upload) | Existing flow unchanged — submits successfully |
| TS7 | Playwright on iPhone viewport: tap upload button → select .vcf | Native picker opens; .vcf accepted; form populated |
| TS8 | Round-trip: download vCard → upload it back | Profile fields restored identically (FN+TEL+URL+PHOTO) |
| TS9 | **Drag .vcf from macOS Finder onto the drop zone** | Drop zone highlights on dragenter; form pre-fills on drop |
| TS10 | **Drag .vcf from Windows Explorer onto the drop zone** (Chrome+Edge) | Same as TS9 |
| TS11 | **iOS Safari (iPhone) — drag .vcf from Files app onto the form** | Drop zone accepts; form pre-fills. Document any iOS version where this fails — button fallback engages |
| TS12 | **Android Chrome — drag .vcf from Files app onto the form** | Drop zone accepts; form pre-fills. Document Android version threshold |
| TS13 | Drag a non-.vcf file (e.g. .txt) onto the drop zone | Inline error; form unchanged |
| TS14 | Keyboard navigation: Tab to drop zone, hit Enter | Same flow as clicking the upload button (a11y) |

## Dependencies
- **Requires:** existing ProfileEditor + ProfileSheet (Sprint 2 + Sprint 7); existing /api/avatar endpoint (T50)
- **Coordinate-with:** any other onboarding tweaks (none active right now)
- **Enables:** faster first-connect onboarding for users with existing .vcf

## Drive Plan (planner-coordinated, CMM4 4-role per learnings #18)
PO 2026-05-31 update: architect is now picking up (no longer plan-only).

1. **req-eng** — DONE (B3 in backlog → promoted here; verbatim Tron quote captured + requirement:uuid filed). Recommend req regenerate the requirement:uuid via `uuidgen` (the current one fails v4 variant check — see flag above) before chain commits depend on it.
2. **architect** — picks up NOW: designs button placement + drop zone + vCard parser + field mapping + multi-platform drag-drop strategy + edge cases (sections above).
3. **expert** — implements ProfileEditor.ts changes + parser + drop handlers per architect's design.
4. **tester** — runs TS1-TS14 across **macOS, Windows, iOS, Android** — the multi-platform AC12 is the critical verify scope.

## Definition of Done
- [ ] All AC met
- [ ] Rule-pair (a)+(b) ✓, (c) exempt
- [ ] Tron QA approved

## QA Audit & User Feedback
- 2026-05-31: B3 filed in backlog.md by req-eng with verbatim Tron quote + drag-drop dimension. PO promoted to T142 with architect-picks-up direction (no longer plan-only). Multi-platform scope (iOS/Android/Windows) is the key new dimension over my initial stand-up draft. CMM4 4-role structured per #18.
- 2026-05-31: Planner flagged req's `requirement:uuid:a3b4c5d6-e7f8-4a9b-0c1d-2e3f4a5b6c7d` as invalid v4 (4th-group variant `0c1d` — `0` outside `[89ab]`). Recommend req regenerate via `uuidgen`; current id used as-is to preserve B3→T142 link.

## Subtasks
None (atomic task — single onboarding UI feature).

---

*Sprint 13 — Stability*
*Owners (CMM4): robbin-req → robbin-architect → robbin-expert → robbin-tester*
*Priority: 7 (UX speed-up; reduces first-connect friction)*
