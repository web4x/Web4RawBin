<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.20.1: ★ RESOLVER HALF — dnd.resolveDropPayload = ONE canonical payload (application/rb-object-ref) + ONE shared resolver EVERY target calls [R37.20 AC-resolve-drop-payload-one-resolver]

[task:uuid:68364f5e-4392-4d2d-ada5-819060b05110]

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

STOOD UP Planned (2026-09-06), T37.20 slice 1/6 = RESOLVER HALF (build FIRST). OWNER=EXPERT. useCases=[] — req named the resolve-half UC 'e3fcf5b3' (8-char only); I do NOT fabricate a full uuid (never fabricated-suffix). req resolves + wires the real resolve-half UC full-uuid on 3-pt verify (their lane). Covers R37.20 AC-resolve-drop-payload-one-resolver. 0 Done till Tron.

## Task Description

Slice 1 of T37.20 (ae01f065 DnD drop contract), the CONSUME side — FIRST because a serializer without a resolver is HALF a contract (per-target read-side branching survives). Replaces today's 4 payload formats each target resolving itself (the per-target-resolution disease). Architect keeps it in core DndContract 822e663b. OWNER = EXPERT.

## Context

Covers R37.20 03e0f803 (AC-resolve-drop-payload-one-resolver), resolve-half UC e3fcf5b3. parent S37 b86b53cc. Sibling of T37.20 monolith (ae01f065) — sliced per-AC so none drifts unscheduled.

## Intention

ONE canonical drop payload + ONE shared resolver every drop target calls; fail-loud on unresolvable; a drop updates the view LIVE.

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
