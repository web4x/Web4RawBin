<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.41: Harness-harden the tree-node drop handler — machine-verify drag-onto-tree with a synthetic unit-ref DataTransfer (removes the T37.20.4 instrument-limited caveat) [R37.20]

[task:uuid:cb015b3d-14d5-46fc-81e5-e6119b210273]

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

★★ NOW URGENT (PO 2026-09-06) — NOT a nicety: Tron tested the folder move on his iPHONE (v0.8.206) and the file does NOT MOVE on a real iOS TOUCH drag. This task exists precisely to catch THIS class, and it now GATES T37.20.4's return to QA-Review. ★ SCOPE EXPANDED: it must cover the TOUCH gesture (iOS touch-drag delivers the unit-ref payload to the tree-folder handler so reparentUnitsIntoContainer fires), NOT ONLY a synthetic desktop drag. If a real touch-drag is genuinely un-mockable in-harness (unlike the desktop synthetic drag), that is a finding to escalate — but attempt the touch-gesture machine-verification first. OWNER=TESTER (pull ahead of other TIER-A). On GREEN -> the expert's iOS-touch fix is proven + T37.20.4 returns to QA-Review. Covers R37.20 AC-tree-folder-drop-target-routes-contract. 0 Done till Tron.

## Task Description

TIER-A harness gap, NOT a physics limit (PO 2026-09-06): the tester already synthesized a REAL drag for the ROOM target tonight (fired the app's own onDragStart, asserted zero-fetch). So the tree-node drop handler CAN be machine-verified with a synthetic unit-ref DataTransfer — it was just not yet instrumented, which is why T37.20.4 carries a 'full drag-onto-tree gesture instrument-limited, Tron's drag closes' caveat. This task closes that harness gap so the folder-drop is machine-verified end-to-end and Tron just ACCEPTS instead of verifying. This is the customer-not-tester law applied: machine-verify whatever CAN be, lean on his gesture only for the genuinely un-mockable (iOS suspend, not this). OWNER = TESTER (take after A2 per PO).

## Context

Machine-verification of R37.20 03e0f803 AC-tree-folder-drop-target-routes-contract. Unblocks removing the T37.20.4 (369b8636) caveat. parent S37 b86b53cc.

## Intention

The full user drag onto a tree node is exercised in-harness with a synthetic unit-ref payload — no reliance on Tron's drag to verify the mechanism.

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

None (atomic harness task).
