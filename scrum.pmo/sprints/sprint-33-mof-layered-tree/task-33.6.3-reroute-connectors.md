<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 33.6.3: After moving a diagram element, recalculate relationships and re-route the connector lines to the element's new position

[task:uuid:dd47dd4b-9ad2-4d14-8009-4a8c70bb38f4]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [x] Done

## Remaining Issues

DONE: chain-complete-to-Test (Test 78535548, reroute connectors on box-move v0.8.24) + REAL-WEBKIT @390 self-gated GREEN (r3363, engine-swap sweep 90673e928, Safari 605.1.15 = Tron iPhone engine). Team-gated at Tron real engine -> Done.

## Traceability

  - up
    - [Sprint 33 Planning](./planning.md)
    - Requirement R33.6.3 `[requirement:uuid:50e4f6f0-b4c9-4f40-820c-2ee405ae1d35]`
  - down
    - None (atomic task)

## Task Description

Tron item-3 (interaction polish). After a diagram element is moved, the relationships must be RECALCULATED and the connector LINES re-routed/redrawn to the element's NEW position - connectors follow the moved node, no stale lines left at the old position. Reuse the existing edge/connector render (R33.3 diagram render), NO fork. Architect scopes reroute-on-commit (drop) vs live-during-drag.

## Acceptance Criteria

- [x] After a box is moved, every connector line to/from it is recomputed and redrawn so its endpoints attach to the box's NEW position; NO connector line remains anchored at the old position (no stale/orphaned lines).
- [x] Reroute occurs at least on move-commit (drop). Whether connectors also track live during the drag is architect-scoped (AC updated on design); the committed-position reroute is the minimum acceptance.
- [x] GATE @390 (screenshot/pixel + planted bite): move a CONNECTED box -> its edges redraw to the new position (pixel: no line segment left at the old anchor); planted-defect: lines stay at old position after move = RED.

## Subtasks

None (atomic task).
