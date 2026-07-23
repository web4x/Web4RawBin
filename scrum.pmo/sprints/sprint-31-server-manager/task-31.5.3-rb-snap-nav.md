<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 31.5.3: rb-snap-nav: data-driven bottom nav, one button per compartment, click snaps the viewport to its left edge

[task:uuid:d871ae32-a05b-432d-b6df-8d5196fae126]

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
    - Requirement R31.5.3 `[requirement:uuid:0a24ac9e-1b58-4be4-bdef-060deb6ec6a0]`
  - down
    - None (atomic build task)

## Task Description

rb-snap-nav is a data-driven bottom nav: one button per COMPARTMENT segment (labels from the strip descriptors); click -> scrollIntoView that compartment's snap point (native, no JS scroll math). {L,C,R} for the editor / {What,Overview,Details,Actions} for WODA — ONE component, labels from the strip. BARS are NOT nav buttons (compartments are the snap targets). Depends on rb-strip (5.2).

## Acceptance Criteria

- [ ] rb-snap-nav renders one button per COMPARTMENT segment (labels from the strip descriptors — {L,C,R} editor / {What,Overview,Details,Actions} WODA, one component); click -> scrollIntoView that compartment's snap point (native CSS, no JS scroll math). BARS are NOT nav buttons.
- [ ] POSITIONING!=FUNCTION (cross-cutting, architect design b3f30491f): the SAME component instance in ANY presentation combination {bar|compartment}x{landscape|portrait}x{inline|bottom} passes the SAME functional tests (detail renders, scroll works, expand/minimize, verb-actions fire) — only computed layout/position differs. Any behavior that CHANGES with position/presentation is a DEFECT (the anti-pattern Tron flagged). Tester gates this piece at Tron's real viewport (portrait mobile scroll-snap + landscape side-by-side).
- [ ] AC-INV-PRESENTATION (cross-cutting R31.5.8): positioning != function — presentation is a reactive layer, never a second fork.

## Subtasks

None (atomic build task).
