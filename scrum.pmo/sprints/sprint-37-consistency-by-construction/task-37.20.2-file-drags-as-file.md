<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.20.2: A FILE drags as a FILE (its File unit), never a #collection — [R37.20 AC-A1-file-drags-as-file]

[task:uuid:3dd05daa-d552-4ba2-9642-ae687446805a]

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

STOOD UP Planned (2026-09-06), T37.20 slice 2/6. OWNER=EXPERT. Covers R37.20 AC-A1. req 3-pt verifies to this AC + wires UC. 0 Done till Tron.

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
