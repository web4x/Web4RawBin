<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.93: Room-folder physical create routes through the ONE owner (createPhysicalFolder), not a raw inline mkdir

[task:uuid:311df491-4c68-46b5-8d72-5d85f7754d15]

## Status
- [x] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

STOOD UP Planned 2026-09-05 (PO GO). Captured, chain wired, expert BUILDING (PO). Planned. Single-owner for raw-mkdir (R40.88 no-mkdir-guard family). UC full-uuid a638e7fb-7590-4a13-a313-e9fb738550d4 disk-resolved from R40.93.useCases[] (NOT fabricated). ACs mirrored no-drift. LOCAL push-freeze, path-limited. req reverse-wires R40.93.tasks[]. 0 Done till Tron.

## Task Description

Captured, chain wired, expert BUILDING (PO). Planned. Single-owner for raw-mkdir (R40.88 no-mkdir-guard family). Covers R40.93 (e0c95904), UC a638e7fb. Minted 2026-09-05 (PO GO — 3rd firefight-skip, PO-owned; planner now dispatched same-breath as req). verify-owner-first: full-index scan confirmed NO prior covering task.

## Context

Captured, chain wired, expert BUILDING (PO). Planned. Single-owner for raw-mkdir (R40.88 no-mkdir-guard family).

## Intention

Board-track R40.93 at its honest status; declare the ONE canonical planning unit (traceability=DRY enforcement).

## Acceptance Criteria

- [ ] **(single-owner/by-construction)** A room folder's PHYSICAL create routes through the ONE physical-folder owner (FolderService.createPhysicalFolder / RoomFilesService, which already gates room-physical at server.ts:47), NOT a raw inline mkdir. One canonical owner for physical-folder creation; duplicate physical-create paths ARE the defect (same family as R40.81/R40.91 two-source).
- [ ] **(single-owner/removal)** The raw fsSync.mkdirSync(target) at server.ts:2565 (currently 'mkdirSync(filesBase,{recursive:true}); mkdirSync(target)') is REMOVED for the room-folder create — the create is delegated to the owner. (The filesBase container ensure may remain if it is the owner's responsibility, but the FOLDER dir is not raw-mkdir'd here.)
- [ ] **(single-owner/the-point)** On fix, the INFRA_ALLOW-list entry for server.ts:2565 COMES OUT — the guard stays GREEN because the create ROUTES through the owner, NOT because the raw mkdir is allow-LISTED. Green-by-routing, never green-by-listing (an allow-list entry is a suppressed violation, not a fixed one).
- [ ] **(self-failability)** Once the INFRA_ALLOW entry is gone, a seeded raw mkdir for a room folder (outside the owner) makes the guard go RED. The guard self-bites (R40.88 pattern). If seeding a raw room-folder mkdir does not RED, the guard is inert.
- [ ] **(provenance/honest)** NAMED honestly: the current raw mkdir is LEGIT room-physical-by-construction (a room folder IS a real dir), currently INFRA_ALLOW-listed with the guard GREEN = NOT a live defect, NOT blocking. This is a single-owner CLEANLINESS fix (one canonical physical-create owner), queued for the expert AFTER R40.92 closes. It was HIDDEN until R40.88 e4 close (3f9a2d309) removed the recursive:true that masked it.

## Subtasks

None (atomic task).
