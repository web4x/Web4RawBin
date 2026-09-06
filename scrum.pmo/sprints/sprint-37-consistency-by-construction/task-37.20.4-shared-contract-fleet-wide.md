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

-> QA-Review (PO 2026-09-06, served v0.8.205, no-op CLOSED): an in-app unit dropped on a folder now RE-PARENTS — POST /api/room/<id>/move-unit -> 200, action='reparented', location moved '(root)' -> ':files/MoveTarget/moveme.bin'; native upload still works; client keeps BOTH paths (rb-object-item.ts:83-91: files->acceptDropIntoContainer KEPT, resolveDragUnit->reparentUnitsIntoContainer ADDED); both open/closed lints untouched. req AC-tree-folder-drop-target-routes-contract went VERIFIED-RED -> now satisfied. ⚠ CAVEAT (recorded, NOT buried): the end-to-end USER DRAG onto a tree node could NOT be exercised in-harness — a synthetic webkit drag does not deliver the payload to that handler; tester verified the SERVER endpoint (the exact one the in-app path calls) + the client wiring BY READ. Mechanism + wiring PROVEN; the full user gesture is INSTRUMENT-LIMITED. Closing confirmation = Tron's own drag (same shape as T37.31 device-accept; one drag he does anyway on accept). 0 Done till Tron.

## Task Description

Slice 4 of T37.20 (ae01f065 DnD drop contract) = the SERIALIZE half + the fleet-wide unification. ONE shared serializer produces the unit-JSON payload, ONE shared resolver (T37.20.1) consumes it, EVERY drop target reuses the SAME contract — no per-target format, no *.show?uuid= URL fallback anywhere. Carries AC-A2 (buffer carries the unit JSON, not a URL/webitem) to its FLEET-WIDE completion (SLICE-A covered only the upload surface). OWNER = EXPERT.

## Context

Covers R37.20 03e0f803 (AC-shared-contract-fleet-wide; also completes AC-A2-buffer-carries-unit fleet-wide). Depends on T37.20.1 resolver. R40.37 single-source shape. parent S37 b86b53cc.

## Intention

One serializer, one resolver, one contract across diagram/room/tree-collection/editor-drawer + future — single-source, no per-target parsing.

## Acceptance Criteria

- [ ] ONE shared serializer produces the payload + ONE shared resolver/deserializer consumes it; EVERY drop target reuses the SAME contract (diagram/room/tree-collection/editor-drawer + future) — NO per-target format, NO per-target parsing, NO *.show?uuid= URL fallback anywhere.
- [ ] AC-A2 fleet-wide: the DnD buffer payload is the scenario UNIT JSON (full {ior,ownerIor,model}) in ALL cases — never a *.show?uuid= URL / #webitem link (fixes cross-instance drops producing plain-URL WebItems), on EVERY target not just upload.

## Subtasks

None (atomic slice).
