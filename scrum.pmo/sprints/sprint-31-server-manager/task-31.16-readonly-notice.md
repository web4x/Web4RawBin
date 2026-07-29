<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 31.16: Non-host read-only notice in room settings (explains why editing is disabled)

[task:uuid:05cea277-cb43-4fc7-9fbf-29c70f71fa6e]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [x] Done

## Traceability

  - up
    - [Sprint 31 Planning](./planning.md)
    - Requirement R31.16 `[requirement:uuid:8a584787-13ce-435d-ac5c-cf4c67be51a1]`
  - down
    - None (atomic task)

## Task Description

When a NON-host member opens the room settings/config modal, a visible READ-ONLY NOTICE explains they cannot edit because they are not the room owner. Host-only edits are CONFIRMED correct by Tron (keep read-only for non-host, R31.12); this adds the UX affordance so a non-host understands WHY the fields are disabled (not a bug). Nothing else broken - radios work, values bound (architect confirmed). Trivial: expert builds a ~2-line notice.

## Acceptance Criteria

- [x] When a NON-host member opens the room settings/config modal, a VISIBLE read-only notice is shown explaining they cannot edit because they are not the room owner. @390.
- [x] The HOST/owner does NOT see the read-only notice (host has editable fields + Save, R31.12) - the notice is non-host-only.

## Subtasks

None (atomic task).
