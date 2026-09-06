<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.20: ONE shared DnD drop contract — buffer carries the scenario unit (not a URL/webitem), file-drags-as-file, details render, fleet-wide every drop target

[task:uuid:ae01f065-bb0b-413e-bdd4-ee97f2fa94ba]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [ ] Done

## Task Description

Deliver R37.20: a single shared serializer+resolver so the DnD buffer always carries the scenario UNIT (never a *.show URL), a file drags as a file, detail views render, and every drop target (diagram/room/tree/editor) reuses ONE contract with no URL fallback. Architect designs the shared serializer/resolver first (scenario-first #126).

## Context

Covers R37.20 (03e0f803) via UC dnd.carryUnitPayload (5474886a). Chain pending architect drop-contract design.

## Intention

Tron 2026-08-12 overnight: dragging /model tree files produced #collection.show/#webitem.show URLs (generally wrong) + empty detail views; amendment makes the contract fleet-wide.

## Acceptance Criteria

- [ ] **(functional)** A FILE drags as a FILE (its file scenario-unit), NOT a collection: dragging src/.../DeviceEnrollDialog.ts yields the File unit, never #collection.show?uuid=file:... .
- [ ] **(functional)** The DnD buffer payload is the scenario UNIT JSON (full {ior,ownerIor,model}) in ALL cases — NEVER a *.show?uuid= URL, a #webitem.show link, or any URL/webitem. ALWAYS the actual unit (this is why cross-instance drops produced plain-URL WebItems).
- [ ] **(functional)** Detail views actually RENDER for EVERY /model tree selection (today: empty on all) — file details are shown for all files, not a blank drawer.
- [ ] **(functional)** ONE shared serializer produces the payload + ONE shared resolver/deserializer consumes it; EVERY drop target reuses the SAME contract (diagram/room/tree-collection/editor-drawer + future) — NO per-target format, NO per-target parsing, NO *.show?uuid= URL fallback anywhere (single-source, R40.37 shape).
- [ ] **(gate)** The BITE asserts the contract PER TARGET (diagram · room · tree/collection · editor/drawer) + STUB-MUST-FAIL: make the serializer emit a URL/*.show again -> assert RED. A target that regresses to a link is caught by construction.
- [ ] **(device)** [DEVICE-ONLY @390 pixel — Tron on phone, un-mockable, NEVER headless-green, TRON-ONLY] Tron verifies on device: a file drags as a file, drops onto every target carry the unit (not a URL), and detail views render.
- [ ] **(gate)** dnd.resolveDropPayload: ONE canonical drop payload (application/rb-object-ref) + ONE shared resolver EVERY drop target calls (fail-loud on unresolvable), replacing today's 4 payload formats each target resolving itself (the per-target-resolution disease). A drop updates the view LIVE @390. GATE STUB-MUST-FAIL: a target with its own payload format/resolver -> RED.
- [ ] **(serialize-fleet/.4/VERIFIED-RED)** STANDING RULE (DRY): EVERY drop target asks the ONE resolver — an in-app UNIT dropped onto a tree FOLDER routes through the shared drop contract as a unit->folder MOVE/re-parent (lands INSIDE per R40.86). ★ A NATIVE OS file dropped on a folder legitimately reads dataTransfer.files (that path MUST keep working); the rule targets IN-APP UNIT drops, which must NOT be handled by a files-only read. The gate distinguishes the two: an in-app UNIT that bypasses the contract => RED; a native file reading files is NOT a violation.

## Implementation

NOT STARTED (scenario-first #126). Architect designs; expert builds; req mints chain+Test. Units on disk BEFORE implementation.

## Subtasks

SLICED per-AC (2026-09-06, PO+req: nothing drifts to unscheduled; SLICE-A upload covered only AC-A2 partial). RESOLVER-HALF FIRST (serializer without resolver = half a contract). Each slice covers its R37.20 AC with its OWN status:
- [Task 37.20.1: RESOLVER half — one resolver](./task-37.20.1-resolver-half-one-resolver.md) `[task:uuid:68364f5e-4392-4d2d-ada5-819060b05110]` (AC-resolve-drop-payload)
- [Task 37.20.2: a file drags as a file](./task-37.20.2-file-drags-as-file.md) `[task:uuid:3dd05daa-d552-4ba2-9642-ae687446805a]` (AC-A1)
- [Task 37.20.3: details render every /model selection](./task-37.20.3-details-render-every-selection.md) `[task:uuid:82c0c01f-e3f3-44b7-b2bb-129ae3472c25]` (AC-A3)
- [Task 37.20.4: ONE shared serializer+resolver fleet-wide](./task-37.20.4-shared-contract-fleet-wide.md) `[task:uuid:369b8636-f449-45cd-b553-c523112d26b3]` (AC-shared-contract + AC-A2 fleet)
- [Task 37.20.5: per-target BITE stub-must-fail](./task-37.20.5-bite-per-target-stub-must-fail.md) `[task:uuid:4c083193-699c-44b9-85bd-0f61f9c57e88]` (AC-BITE)
- [Task 37.20.6: DEVICE @390 Tron acceptance](./task-37.20.6-device-390-tron-acceptance.md) `[task:uuid:53571e22-2c58-4451-8e05-6bfb76647008]` (AC-6-DEVICE)

THEN the NATURAL CLASSES (Tron: NO 'shapes' — a drop RESOLVES to a scenario UNIT of a CLASS that is INSTANTIATED and renders ITSELF; a mime/format-string switch IS the defect; layered DndContract -> MultipartMime -> MimeType.from -> natural class; DoD = right CLASS instantiated AND rendering itself, not bytes stored):
- [Task 37.39: Image natural class](./task-37.39-image-natural-class.md) `[task:uuid:bc0302dd-cef7-4d55-b71f-1da410ca76d3]` (MINTED, R40.99)
- [Task 37.40: CalendarEntry natural class](./task-37.40-calendarentry-natural-class.md) `[task:uuid:257ab50f-a1fc-4920-a5c6-b523230355c9]` (MINTED, R40.99)
- WebItem / Email / Contact (VCard->Contact, uuid-stable): build-go released; EXISTING coverage on disk (WebItem-unit 7c526ba6 · Emails-as-units 3960168e · vCard tasks) — radical-OOP re-frame (class renders itself) = req STRUCTURAL ruling (correct-existing vs mint), do NOT mint parallel (check-before-create).
