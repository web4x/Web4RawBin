<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 31.5.5: the 3-way editor is an rb-strip instance: descriptor [L]|[C]|[R] + nav {Left,Center,Right}

[task:uuid:00c67a73-be6c-42ed-9836-82d6aafb5d88]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [ ] QA Review
- [ ] Done

## Traceability

  - up
    - [Task 31.5 (umbrella)](./task-31.5-concept-scrollable-viewport-woda-layout.md)
    - [Sprint 31 Planning](./planning.md)
    - Requirement R31.5.5 `[requirement:uuid:3c3e1cac-8e5f-492f-b70c-18fbba6c6a33]`
  - down
    - None (atomic build task)

## Task Description

The 3-way diff editor is an INSTANCE of the rb-strip model: descriptor [{C:L},{bar:leftChangebar},{C:C},{bar:rightChangebar},{C:R}], nav {Left,Center,Right}. Pure descriptor wiring once rb-strip/rb-compartment/viewport (5.1-5.4) exist — zero new infra; the existing editor stays functional (components added around, not replacing). Build order 5.

## Acceptance Criteria

- [ ] The 3-way editor = rb-strip descriptor [{C:L},{bar:leftChangebar},{C:C},{bar:rightChangebar},{C:R}] with nav {Left,Center,Right}. Pure descriptor wiring on the existing infra (5.1-5.4), zero new infra; editor stays functional throughout.
- [ ] POSITIONING!=FUNCTION (cross-cutting, architect design b3f30491f): the SAME component instance in ANY presentation combination {bar|compartment}x{landscape|portrait}x{inline|bottom} passes the SAME functional tests (detail renders, scroll works, expand/minimize, verb-actions fire) — only computed layout/position differs. Any behavior that CHANGES with position/presentation is a DEFECT (the anti-pattern Tron flagged). Tester gates this piece at Tron's real viewport (portrait mobile scroll-snap + landscape side-by-side).
- [ ] AC-INV-PRESENTATION (cross-cutting R31.5.8): positioning != function — presentation is a reactive layer, never a second fork.

## Subtasks

None (atomic build task).
