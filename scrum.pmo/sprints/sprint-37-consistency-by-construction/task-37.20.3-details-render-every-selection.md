<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.20.3: Detail views actually RENDER for EVERY /model tree selection (not a blank drawer) — [R37.20 AC-A3-details-render]

[task:uuid:82c0c01f-e3f3-44b7-b2bb-129ae3472c25]

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

STOOD UP Planned (2026-09-06), T37.20 slice 3/6. OWNER=EXPERT. Covers R37.20 AC-A3. Coordinate with T37.30 detail-convergence (one primitive, no 2nd path). req 3-pt verifies + wires UC. 0 Done till Tron.

## Task Description

Slice 3 of T37.20 (ae01f065 DnD drop contract). Today detail views are empty on all /model selections; this closes the render half so file details show for all files. OWNER = EXPERT.

## Context

Covers R37.20 03e0f803 (AC-A3-details-render). parent S37 b86b53cc. Converges with T37.30 (RbDetailBase fail-loud primitive) — coordinate no 2nd detail path.

## Intention

Every /model tree selection renders its detail view; no blank drawer.

## Acceptance Criteria

- [ ] Detail views actually RENDER for EVERY /model tree selection (today: empty on all) — file details are shown for all files, not a blank drawer.

## Subtasks

None (atomic slice).
