<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.20.4: ONE shared serializer + resolver, EVERY drop target reuses the SAME contract fleet-wide (diagram/room/tree/editor) — [R37.20 AC-shared-contract-fleet-wide + AC-A2 fleet]

[task:uuid:369b8636-f449-45cd-b553-c523112d26b3]

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

★★ RESTORED In-Progress -> QA-Review, CAVEAT REMOVED (PO 2026-09-06, machine-verified on live v0.8.207 — the gesture was NEVER un-mockable; the tester proved it IS mockable). COMPOSITION (recorded honestly, NOT smoothed): verified as TWO MEASURED HALVES — (1) CLIENT: a synthetic unit-ref drop on a folder tree-node FIRES reparentUnitsIntoContainer -> move-unit POST, stub-must-fail GREEN (files-only fires nothing); (2) SERVER v0.8.207: resolveDropContainer now owns the display-'folder:'-prefixed target + re-parents the file INTO the folder (location '(root)' -> .../MoveTarget/), native nests too. A single END-TO-END drop-onto-a-specific-folder run was blocked by a webkit tree-render flake. ACCEPTED because the two halves meet at the SAME interface (client sends the prefixed target, server resolves that EXACT spelling) + the prior failure lived precisely in the gap between them (the prefix mismatch), now CLOSED + measured from both sides. ⚠ FOLLOW-UP QUEUED (non-blocking): the single end-to-end run once the tree-render flake is handled — composition-of-halves is what let the prefix bug through once tonight. --- PRIOR (2026-09-06, TRON iPhone v0.8.206): ★ BACK TO WORK QA-Review -> In-Progress (PO 2026-09-06, TRON TESTED ON iPHONE v0.8.206, screenshot): dragging a jpeg onto the 'screenshots' FOLDER in a room's Files — the drag ghost renders over the folder row but the file does NOT move. VERIFIED server-side + wiring; REAL USER GESTURE ON iOS = FAILS to move. Back to work. This is EXACTLY the recorded caveat (his drag was the missing evidence — the full drag-onto-tree GESTURE was never machine-verified; synthetic webkit drag could not deliver the payload) — his gesture says FAIL. FIX (expert): the iOS TOUCH-drag path must deliver the unit-ref payload to the tree-folder handler so reparentUnitsIntoContainer fires on a real touch drag. T37.41 harness (now URGENT) must cover the TOUCH gesture, not only a synthetic desktop drag. PRIOR (server-side, still true): -> QA-Review (PO 2026-09-06, served v0.8.205, no-op CLOSED): an in-app unit dropped on a folder now RE-PARENTS — POST /api/room/<id>/move-unit -> 200, action='reparented', location moved '(root)' -> ':files/MoveTarget/moveme.bin'; native upload still works; client keeps BOTH paths (rb-object-item.ts:83-91: files->acceptDropIntoContainer KEPT, resolveDragUnit->reparentUnitsIntoContainer ADDED); both open/closed lints untouched. req AC-tree-folder-drop-target-routes-contract went VERIFIED-RED -> now satisfied. ⚠ CAVEAT (recorded, NOT buried): the end-to-end USER DRAG onto a tree node could NOT be exercised in-harness — a synthetic webkit drag does not deliver the payload to that handler; tester verified the SERVER endpoint (the exact one the in-app path calls) + the client wiring BY READ. Mechanism + wiring PROVEN; the full user gesture is INSTRUMENT-LIMITED. Closing confirmation = Tron's own drag (same shape as T37.31 device-accept; one drag he does anyway on accept). 0 Done till Tron.

## Task Description

Slice 4 of T37.20 (ae01f065 DnD drop contract) = the SERIALIZE half + the fleet-wide unification. ONE shared serializer produces the unit-JSON payload, ONE shared resolver (T37.20.1) consumes it, EVERY drop target reuses the SAME contract — no per-target format, no *.show?uuid= URL fallback anywhere. Carries AC-A2 (buffer carries the unit JSON, not a URL/webitem) to its FLEET-WIDE completion (SLICE-A covered only the upload surface). OWNER = EXPERT.

## Context

Covers R37.20 03e0f803 (AC-shared-contract-fleet-wide; also completes AC-A2-buffer-carries-unit fleet-wide). Depends on T37.20.1 resolver. R40.37 single-source shape. parent S37 b86b53cc.

## Intention

One serializer, one resolver, one contract across diagram/room/tree-collection/editor-drawer + future — single-source, no per-target parsing.

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
