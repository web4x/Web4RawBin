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

- [ ] A FILE drags as a FILE (its file scenario-unit), NOT a collection: dragging src/.../DeviceEnrollDialog.ts yields the File unit, never #collection.show?uuid=file:... .

## Subtasks

None (atomic slice).
