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

Mirrors R40.93 req ACs (no-drift, disk-resolved UC). NEVER Done till Tron.
- [ ] AC-route-through-single-owner: a room folder's PHYSICAL create routes through the ONE physical-folder owner (FolderService.createPhysicalFolder / RoomFilesService, which already gates room-physical).
- [ ] AC-no-raw-mkdir-at-2565: the raw fsSync.mkdirSync(target) at server.ts:2565 is REMOVED for the room-folder create — the create is delegated to the owner.
- [ ] AC-green-by-routing-not-listing: on fix, the INFRA_ALLOW-list entry for server.ts:2565 COMES OUT — the guard stays GREEN because the create ROUTES through the owner, NOT because the raw mkdir is allow-LISTED.
- [ ] AC-failable-self-stub: once the INFRA_ALLOW entry is gone, a seeded raw mkdir for a room folder (outside the owner) makes the guard go RED (self-bites, R40.88 pattern).
- [ ] AC-legit-today-named-not-blocking: NAMED honestly — the current raw mkdir is LEGIT room-physical-by-construction (a room folder IS a real dir), currently INFRA_ALLOW-listed with the guard GREEN = NOT a live defect, NOT blocking.

## Subtasks

None (atomic task).
