<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 31.5.2: rb-strip: ordered row rendered from a descriptor array; owns layout+scroll+snap, no content logic

[task:uuid:03ab7342-ab45-4383-8f25-bdd1f1013dc4]

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
    - [Task 31.5 (umbrella)](./task-31.5-concept-scrollable-viewport-woda-layout.md)
    - [Sprint 31 Planning](./planning.md)
    - Requirement R31.5.2 `[requirement:uuid:86d72090-6c58-4892-bb9d-3021e4830c11]`
  - down
    - None (atomic build task)

## Task Description

rb-strip renders an ordered row from a descriptor array [{id,kind:'compartment'|'bar',content}]; it owns layout + scroll + snap and hosts whatever the descriptors give (NO content logic). The SAME rb-strip instantiates BOTH the editor and WODA — only the descriptor array differs; adding a new layout = a new descriptor array, zero new infra. FOUNDATION piece (build order 1).

## Acceptance Criteria

- [ ] rb-strip renders an ordered row from a descriptor array [{id,kind:compartment|bar,content}]; owns layout+scroll+snap, no content logic (hosts what descriptors give). SAME rb-strip instantiates editor AND WODA — only the descriptor array differs; new layout = new descriptor array, zero new infra.
- [ ] POSITIONING!=FUNCTION (cross-cutting, architect design b3f30491f): the SAME component instance in ANY presentation combination {bar|compartment}x{landscape|portrait}x{inline|bottom} passes the SAME functional tests (detail renders, scroll works, expand/minimize, verb-actions fire) — only computed layout/position differs. Any behavior that CHANGES with position/presentation is a DEFECT (the anti-pattern Tron flagged). Tester gates this piece at Tron's real viewport (portrait mobile scroll-snap + landscape side-by-side).
- [ ] AC-INV-PRESENTATION (cross-cutting R31.5.8): positioning != function — presentation is a reactive layer, never a second fork.

## Subtasks

None (atomic build task).
