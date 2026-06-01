[Back to Sprint 17 Planning](./planning.md)

# T157: Profile gate — Upload vCard for fast onboarding (button + native drag-and-drop)

[task:uuid:ec8e7a0f-18e4-418c-8242-4555c8106b7a]

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
> **Multi-platform AC (Tron 2026-06-01):** native drag-and-drop must work on
> iOS, Android, AND Windows — not just one platform.

## Assigned
**Owners (CMM4 4-role, per learnings #18) — sequence req → architect → expert → tester:**
1. **robbin-req** — B3 captured in backlog ✓ (verbatim Tron quote + canonical `requirement:uuid:a3b4c5d6-…`). Additional req work: clarify scope of vCard V3.0 fields to import (FN → name, TEL → phone, URL → url, PHOTO → avatar — confirm these are the four); confirm desired behavior when fields already filled (overwrite vs preserve); confirm whether ProfileEditor opens with the imported fields pre-filled (user can review/edit before saving) OR auto-saves
2. **robbin-architect** — design: (i) "Upload vCard" button placement at TOP of first-time-connect profile gate (above existing fields); (ii) hidden `<input type="file" accept=".vcf,text/vcard">` triggered by button; (iii) native HTML5 drag-and-drop handlers (`dragover`, `drop`) on the gate form — emit visual hint (overlay + highlight); (iv) **vCard V3.0 parser** (new — current code only EXPORTS vCards in ProfileSheet.downloadVCard); parse FN/TEL/URL/PHOTO; (v) multi-platform notes: iOS share-sheet path, Android drag, Windows drag; (vi) decide upload-vs-drop merge logic; update `scrum.pmo/standards/traceability-standard.md` if a parser convention is added
3. **robbin-expert** — implement per architect's design in `src/public/ts/ProfileEditor.ts` (gate mode); add the V3.0 vCard parser as a new helper (architect names file — likely `src/public/ts/vcard-parser.ts`); wire button + drag-drop; carry rule-pair (a)+(b) in the impl commit-set
4. **robbin-tester** — verify on **all three platforms** (iOS Safari, Android Chrome, Windows desktop): button-upload populates fields; native drag-drop populates fields; existing field-editing unaffected; vCard PHOTO → avatar URL roundtrip works; regression: ProfileEditor non-gate mode unchanged

**This file is the single source of truth.** No chat clarification.

## Traceability

`[task:uuid:ec8e7a0f-18e4-418c-8242-4555c8106b7a]`

- up
  - [Sprint 17 Planning](./planning.md)
  - **Tron quote capture (req-eng):** B3 in [scrum.pmo/backlog.md](../../backlog.md)
  - **B3 requirement** `[requirement:uuid:a3b4c5d6-e7f8-4a9b-0c1d-2e3f4a5b6c7d]`
    Verbatim Tron quote:
    > "on first time connect we have to fill out profile. add a upload vcard button at the top to speed up onboarding and initialize from the card. can be dropped natively from os drag and drop eg on iphone but also android and windows."
- down
  - None at parent level (architect may split T157.x per platform or per upload-vs-drop if scope warrants — coordinate with planner first)
- follows
  - [T7: User editor + ProfileEditor gate](../sprint-2-identity-ssh/task-7-user-editor.md) — historical ProfileEditor implementation
  - [T11: vCard download](../sprint-2-identity-ssh/task-11-vcard.md) — vCard V3.0 EXPORT precedent (T157 introduces the IMPORT side)
  - [T48: Default avatar assignment](../sprint-7-encrypted-storage/task-48-default-avatar.md) — avatar pipeline T157's PHOTO field feeds into
  - [T50: POST /api/avatar upload endpoint](../sprint-7-encrypted-storage/task-50-avatar-upload.md) — upload endpoint for the imported PHOTO
  - [T56: rb-avatar component](../sprint-7-encrypted-storage/task-56-avatar-component.md) — avatar UI affected by import
- chain (req → usecase → puml → class/method) — architect to fill on refinement
  - **requirement:** B3 `[requirement:uuid:a3b4c5d6-e7f8-4a9b-0c1d-2e3f4a5b6c7d]` (req-eng confirmed)
  - **use case:** UC-TBD (architect — likely `profileGate.uploadVCard`, `profileGate.dropVCard`, `vcard.parseV3`)
  - **puml:** [diagrams/s17-usecases.puml](./diagrams/s17-usecases.puml) — architect adds new UCs as `UseCase` instances (rule #10 / T117)
  - **class/method:** `src/public/ts/ProfileEditor.ts` (gate mode) + new `src/public/ts/vcard-parser.ts` (V3.0 parser) — architect confirms / renames

## Context

Tron 2026-06-01 (B3): first-time-connect profile gate currently requires manual
entry of name + phone + URL fields. A vCard upload (button) and native OS
drag-and-drop would speed onboarding by pre-filling those fields from a
contact card. Multi-platform requirement: iOS, Android, Windows.

Touches: ProfileEditor in gate mode (initial-profile flow), new vCard V3.0
parser (current code only EXPORTS in `ProfileSheet.downloadVCard`), HTML5
drag-and-drop API, mobile share-sheet / file-drop handling.

## Intention

### Why this task exists
- Manual profile entry is the slowest path to first-room-join
- Most users have a contact card they could provide
- Tron called out the speed gap explicitly

### Problems this task solves
- Slow first-time-connect onboarding
- No automated way to populate name/phone/URL/avatar from existing data

### How it solves them
- Add Upload button at TOP of profile gate (above existing fields)
- Native HTML5 drag-and-drop with visual hint
- vCard V3.0 parser populates the existing form fields
- User reviews + edits before submitting (architect-confirmed UX)

## Acceptance Criteria
- [ ] AC1 (Upload button) — "Upload vCard" button at the TOP of the first-time-connect profile gate (above name/phone/URL fields)
- [ ] AC2 (File picker) — Clicking the button opens a file picker filtered to `.vcf` / `text/vcard`
- [ ] AC3 (Drag-and-drop) — Dropping a `.vcf` file onto the gate form populates fields; visual hint (overlay + highlight) appears during dragover
- [ ] AC4 (Parser) — vCard V3.0 fields parsed: **FN** → name, **TEL** → phone, **URL** → url, **PHOTO** → avatar (data URL or web URL — architect decides how to feed into existing upload pipeline T50)
- [ ] AC5 (Review-before-save) — Imported fields appear in the existing form; user can edit before submitting (no auto-save)
- [ ] AC6 (iOS) — Works on iOS Safari (share-sheet file path or drag if supported)
- [ ] AC7 (Android) — Works on Android Chrome (file picker + drag if supported)
- [ ] AC8 (Windows) — Works on Windows desktop browsers (file picker + native OS file drag)
- [ ] AC9 (Avatar pipeline) — PHOTO data integrates with existing T50 POST `/api/avatar` upload (no plaintext storage; encrypted-at-rest preserved)
- [ ] AC10 (Regression) — ProfileEditor non-gate (edit) mode unchanged; existing profile creation without vCard still works
- [ ] AC11 — `npm run build` succeeds; all existing tests pass
- [ ] AC12 — **Rule-pair (a)+(b) [learnings #15 + #16]:** `package.json` "version" bumped AND `src/public/sw.js` CACHE_NAME bumped in the SAME commit-set as the user-facing impl. (c) STATIC_SHELL: likely exempt (no new route — architect confirms)
- [ ] AC13 — All 4 roles committed work in this file

## Test Scenarios
File: `test/vitest/vcard-parser.test.ts` (new — V3.0 parser unit tests) + multi-platform manual + Playwright visual.

| Test | Action | Expected |
|------|--------|----------|
| TS1 (parser unit) | Parse fixture `.vcf` with FN/TEL/URL/PHOTO | All four fields extracted correctly |
| TS2 (parser unit edge) | Malformed `.vcf`, V2.1, missing fields | Graceful — fields that exist populate; missing ones leave the form blank |
| TS3 (upload button) | Click Upload vCard → select fixture file | name/phone/url/avatar pre-fill in the gate form |
| TS4 (drag-drop desktop) | Drag fixture `.vcf` onto the gate form (Windows / macOS) | Fields populate; visual hint appears during dragover |
| TS5 (iOS) | iOS Safari: tap Upload vCard → share sheet → select `.vcf` from Files | Fields populate |
| TS6 (Android) | Android Chrome: tap Upload vCard → file picker → select `.vcf` | Fields populate |
| TS7 (review-before-save) | After import, user edits a field and submits | Submitted profile reflects the edit, not the imported value |
| TS8 (avatar pipeline) | Import vCard with PHOTO | PHOTO data flows through T50 POST `/api/avatar` (encrypted-at-rest) |
| TS9 (regression — non-gate mode) | Existing profile edit (post-onboarding) | Unchanged — no Upload button in non-gate mode (architect decides) |
| TS10 (regression — vCard export) | Existing T11 `ProfileSheet.downloadVCard` | Still works; the new parser doesn't break the exporter |
| TS11 (rule-pair post-bump) | New CACHE_NAME activates | Onboarding gate gains Upload + drag-drop on Tron's device |

## Dependencies
- **Requires:** existing ProfileEditor gate mode, existing T50 `/api/avatar` upload endpoint (for the PHOTO field)
- **Coordinate-with:** T11 (vCard exporter — the parser is its symmetric counterpart), T48/T56 (avatar pipeline)
- **Enables:** fast onboarding from existing contact cards

## Drive Plan (planner-coordinated, CMM4 4-role)
1. **robbin-req** confirms the four-field scope (FN/TEL/URL/PHOTO), review-before-save UX, and multi-platform scope
2. **robbin-architect** designs: gate-mode button placement + drag-drop handlers + V3.0 parser + PHOTO-to-T50 pipeline; writes Design section here
3. **robbin-expert** implements per the design in one commit-set; carries rule-pair (a)+(b)
4. **robbin-tester** verifies on iOS / Android / Windows + parser unit tests + regression

## Definition of Done
- [ ] All AC met (AC1–AC13) — especially AC6/AC7/AC8 (multi-platform)
- [ ] Rule-pair (a)+(b) ✓; (c) STATIC_SHELL if applicable
- [ ] No regression on ProfileEditor edit-mode, T11 exporter, T48/T56 avatar pipeline
- [ ] All 4 roles committed work
- [ ] Tron QA approved

## QA Audit & User Feedback
- 2026-06-01: PO directed planner to stand up T157 from backlog B3. CMM4 4-role (#18); real v4 uuids (#17); rule-pair (a)+(b) in AC12 + DoD (#15+#16). Multi-platform iOS/Android/Windows hard requirement per Tron.
- 2026-06-01 **robbin-req (anchor confirm):** B3 verbatim already in traceability block (line 39, canonical uuid:a3b4c5d6). Full 3-fragment Tron quote present (upload button + initialize from card + native OS drag-and-drop iOS/Android/Windows). Chain section updated with full uuid. Note: B3 uuid was flagged by planner as invalid v4 (4th-group variant `0c1d` outside `[89ab]`) — functional but trace-cli may drop it. Consider regenerating via uuidgen if it causes issues. Ready for architect.

## Design (robbin-architect, 2026-06-01)

### FINDING: Already implemented

Code audit reveals T157 is **already fully implemented** in the current codebase:

**ProfileEditor.ts (lines 48-52, 92-113, 159-176):**
- `📇 Import vCard` button (line 49) — positioned at top of gate form ✅
- Hidden `<input type="file" accept=".vcf,text/vcard">` (line 50) ✅
- Drag-drop hint text (line 51) ✅
- Button click → triggers file input (lines 92-93) ✅
- File input change → `parseVCard(await file.text())` → `applyVCard(vcf)` (lines 95-100) ✅
- Drag-drop handlers: `dragover` (line 104), `drop` (lines 108-113) ✅
- `applyVCard()` populates FN→name, TEL→phone, URL→url, PHOTO→avatar (lines 159-169) ✅

**vcard-parse.ts** — V3.0 parser exists:
- Imported at ProfileEditor.ts line 5: `import { parseVCard, type VCardData } from './vcard-parse.js'`
- Parses FN, TEL, URL, PHOTO fields ✅

### What's left: tester verification only

The implementation exists. What's needed is **multi-platform testing** per Tron's directive:
1. iOS Safari — button upload + share-sheet drop
2. Android Chrome — button upload + drag-drop
3. Windows Edge/Chrome — button upload + native drag-drop
4. Verify PHOTO → avatar roundtrip (blob upload via rb-avatar.uploadBlob)
5. Verify fields pre-fill (user reviews before saving) — confirmed by line 159-169 logic

### Architect recommendation

Mark T157 as **implementing: DONE** (already in codebase). Move directly to **testing** phase. Tester runs TS1-TS8 across all three platforms.

### No design changes needed. No new code. No rule-pair (already shipped).

## Subtasks
None (testing only — implementation already present).

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views · Phase 21 (Profile gate vCard onboarding)*
*Owners (CMM4): robbin-req → robbin-architect → robbin-expert → robbin-tester*
*Priority: 5 (high onboarding-UX value; multi-platform scope)*
