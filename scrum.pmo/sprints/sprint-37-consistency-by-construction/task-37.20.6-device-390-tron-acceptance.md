<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.20.6: DEVICE @390 — Tron verifies on phone: file drags as file, every drop carries the unit, details render — [R37.20 AC-6-DEVICE]

[task:uuid:53571e22-2c58-4451-8e05-6bfb76647008]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

STOOD UP Planned (2026-09-06), T37.20 slice 6/6 = DEVICE closing AC. OWNER=TESTER (harness). ★ ACCEPTANCE not TESTING — we verify slices 1-5 @390 real-WebKit in-harness BEFORE Tron sees it; his device confirm = acceptance, never a test-request (customer-not-tester law). Depends on 1-5 GREEN. req 3-pt verifies + wires UC. 0 Done till Tron.

## Task Description

Slice 6 of T37.20 (ae01f065 DnD drop contract) = the device-acceptance closing AC. Tron on phone @390 experiences the finished contract. UN-MOCKABLE, never headless-green — this is ACCEPTANCE (customer receives), verification is complete in our harness BEFORE he sees it. OWNER = TESTER (harness readies the @390 build we verify; Tron accepts).

## Context

Covers R37.20 03e0f803 (AC-6-DEVICE). CLOSING AC — depends on slices 1-5 GREEN in our harness first. parent S37 b86b53cc.

## Intention

On real device @390 the whole contract holds: a file drags as a file, drops onto every target carry the unit (not a URL), detail views render.

## Acceptance Criteria

- [ ] **(functional)** A FILE drags as a FILE (its file scenario-unit), NOT a collection: dragging src/.../DeviceEnrollDialog.ts yields the File unit, never #collection.show?uuid=file:... .
- [ ] **(functional)** The DnD buffer payload is the scenario UNIT JSON (full {ior,ownerIor,model}) in ALL cases — NEVER a *.show?uuid= URL, a #webitem.show link, or any URL/webitem. ALWAYS the actual unit (this is why cross-instance drops produced plain-URL WebItems).
- [ ] **(functional)** Detail views actually RENDER for EVERY /model tree selection (today: empty on all) — file details are shown for all files, not a blank drawer.
- [ ] **(functional)** ONE shared serializer produces the payload + ONE shared resolver/deserializer consumes it; EVERY drop target reuses the SAME contract (diagram/room/tree-collection/editor-drawer + future) — NO per-target format, NO per-target parsing, NO *.show?uuid= URL fallback anywhere (single-source, R40.37 shape).
- [ ] **(gate)** The BITE asserts the contract PER TARGET (diagram · room · tree/collection · editor/drawer) + STUB-MUST-FAIL: make the serializer emit a URL/*.show again -> assert RED. A target that regresses to a link is caught by construction.
- [ ] **(device)** [DEVICE-ONLY @390 pixel — Tron on phone, un-mockable, NEVER headless-green, TRON-ONLY] Tron verifies on device: a file drags as a file, drops onto every target carry the unit (not a URL), and detail views render.
- [ ] **(gate)** dnd.resolveDropPayload: ONE canonical drop payload (application/rb-object-ref) + ONE shared resolver EVERY drop target calls (fail-loud on unresolvable), replacing today's 4 payload formats each target resolving itself (the per-target-resolution disease). A drop updates the view LIVE @390. GATE STUB-MUST-FAIL: a target with its own payload format/resolver -> RED.
- [ ] **(serialize-fleet/.4/VERIFIED-RED)** STANDING RULE (DRY): EVERY drop target asks the ONE resolver — an in-app UNIT dropped onto a tree FOLDER routes through the shared drop contract as a unit->folder MOVE/re-parent (lands INSIDE per R40.86). ★ A NATIVE OS file dropped on a folder legitimately reads dataTransfer.files (that path MUST keep working); the rule targets IN-APP UNIT drops, which must NOT be handled by a files-only read. The gate distinguishes the two: an in-app UNIT that bypasses the contract => RED; a native file reading files is NOT a violation.

## Subtasks

None (atomic slice).
