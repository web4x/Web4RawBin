<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 31.5.6: WODA is an rb-strip instance: descriptor W|[O][D]|A + nav {What,Overview,Details,Actions}

[task:uuid:8efd4fcb-ebe2-4bb0-bf6d-ded7de2d788e]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [ ] creating test cases
  - [~] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Traceability

  - up
    - [Task 31.5 (umbrella)](./task-31.5-concept-scrollable-viewport-woda-layout.md)
    - [Sprint 31 Planning](./planning.md)
    - Requirement R31.5.6 `[requirement:uuid:2f707d67-f77e-4d6c-8b13-1fd4fb7a433b]`
  - down
    - None (atomic build task)

## Task Description

WODA is an INSTANCE of the rb-strip model: descriptor [{bar-expandable:What},{C:Overview},{C:Details},{bar:Actions}], nav {What,Overview,Details,Actions}. The What bar expands to a What compartment; Overview+Details are compartments; Actions is a bar. Pure descriptor wiring on the existing infra (5.1-5.4), zero new infra. Build order 5.

## Acceptance Criteria

- [ ] WODA = rb-strip descriptor [{bar-expandable:What},{C:Overview},{C:Details},{bar:Actions}] with nav {What,Overview,Details,Actions}; What bar expands to a What compartment. Pure descriptor wiring on the existing infra (5.1-5.4), zero new infra.
- [ ] POSITIONING!=FUNCTION (cross-cutting, architect design b3f30491f): the SAME component instance in ANY presentation combination {bar|compartment}x{landscape|portrait}x{inline|bottom} passes the SAME functional tests (detail renders, scroll works, expand/minimize, verb-actions fire) — only computed layout/position differs. Any behavior that CHANGES with position/presentation is a DEFECT (the anti-pattern Tron flagged). Tester gates this piece at Tron's real viewport (portrait mobile scroll-snap + landscape side-by-side).
- [ ] AC-INV-PRESENTATION (cross-cutting R31.5.8): positioning != function — presentation is a reactive layer, never a second fork.

## Subtasks

None (atomic build task).
