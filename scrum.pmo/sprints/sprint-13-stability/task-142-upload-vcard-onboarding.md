<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# T142: Upload-vCard onboarding gate — speed up first-time profile fill

[task:uuid:c481a2b9-b61d-4a0f-a077-690a9e2e1aa9]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement (req → architect)
  - [ ] creating test cases
  - [x] implementing
  - [x] testing  ← robbin-tester DET-3x GREEN ebec12151 (R21.1 vCard-persist, v0.6.67, 9/9; RED 404 v0.6.65 → GREEN 200)
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

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
  - **puml:** likely `scrum.pmo/sprints/sprint-02-identity-ssh/diagrams/` (identity flow) — architect picks location
  - **class/method:** `src/public/ts/ProfileEditor.ts` (UI: upload button at top + drop-zone on the form), new vCard V3.0 parser (vCard is line-oriented `KEY:VALUE`; the project currently only exports vCards via ProfileSheet.downloadVCard — this is the inverse import direction), profile-field mapping helper, HTML5 drag-and-drop handlers (`dragenter`/`dragover`/`drop` events)

## Task Description

Add an upload-vCard onboarding gate to speed up first-time profile fill.

## Dependencies

- **Requires:** existing ProfileEditor + ProfileSheet (Sprint 2 + Sprint 7); existing /api/avatar endpoint (T50)
- **Coordinate-with:** any other onboarding tweaks (none active right now)
- **Enables:** faster first-connect onboarding for users with existing .vcf

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
