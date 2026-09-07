<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.20.2: A FILE drags as a FILE (its File unit), never a #collection — [R37.20 AC-A1-file-drags-as-file]

[task:uuid:3dd05daa-d552-4ba2-9642-ae687446805a]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [ ] Done

## Remaining Issues

-> QA-Review (PO ruling 2026-09-06): tester measured .2 (a file drags as its File unit, not a #collection) = PASS with evidence. T37.20 slice 2/6, covers R37.20 AC-A1. Awaiting Tron accept (0 Done till Tron).

## Task Description

Slice 2 of T37.20 (ae01f065 DnD drop contract). Dragging a file yields its File scenario-unit, NEVER #collection.show?uuid=file:... . OWNER = EXPERT.

## Context

Covers R37.20 03e0f803 (AC-A1-file-drags-as-file). parent S37 b86b53cc. T37.20 monolith slice, per-AC so none drifts unscheduled.

## Intention

Dragging src/.../X.ts yields the File unit, never a collection or a URL.

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
