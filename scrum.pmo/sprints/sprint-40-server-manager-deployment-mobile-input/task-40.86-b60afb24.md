<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.86: Folders are drop targets — dropping content onto a folder places it INSIDE that folder

[task:uuid:b60afb24-9244-4767-a720-87d722538f93]

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

STOOD UP Planned 2026-09-05 (PO GO). WIRED, not built (PO). Planned. UC full-uuid af1bf20b-9000-45db-9c55-9d93f4822a7c resolved from R40.86.useCases[] on disk (NOT fabricated). ACs mirrored from the req (no-drift). Minted LOCAL (push-freeze), path-limited. req reverse-wires R40.86.tasks[]. 0 Done till Tron.

## Task Description

WIRED, not built (PO). Planned. Covers R40.86 (a7bd184b), UC af1bf20b. Minted 2026-09-05 (PO GO after the R40.84-firefight coverage gap; planner was skipped, gap now closed). verify-owner-first: full-index scan confirmed NO prior covering task (no double-mint).

## Context

WIRED, not built (PO). Planned.

## Intention

Board-track R40.86 at its honest status; declare the ONE canonical planning unit for this requirement (traceability = DRY enforcement).

## Acceptance Criteria

Mirrors R40.86 req ACs (no-drift, disk-resolved UC). NEVER Done till Tron.
- [ ] AC-folder-is-drop-target: a folder ACCEPTS a drop (valid target + drop affordance); today folders are NOT drop targets, this adds it.
- [ ] AC-content-lands-inside-folder: (Tron) dropping content onto a folder places it INSIDE that folder (containment), NOT at root or elsewhere.
- [ ] AC-resolve-dest-by-one-identity: the drop resolves the DESTINATION folder by the ONE canonical roomcoll identity (R40.83), NOT a second/dual identity — a wrong-destination from a diverged identity => RED.
- [ ] AC-in-place-on-drop: the drop-add updates the target node IN PLACE (R40.84) — no collapse/rebuild, expanded state survives, only the target gains the child.
- [ ] AC-verify-member-session: WE verify @390 member-session (drop content onto a folder -> lands inside); Tron ACCEPTS delivered verified work.
- [ ] AC-stub-must-fail: seed a drop onto a folder that lands at ROOT/elsewhere (not inside target) => RED.

## Subtasks

None (atomic task).
