<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 31.5.1: rb-compartment: one component whose presentation attr flips full-content (expanded) <-> collapsed bar strip

[task:uuid:b9e529ec-2788-4cb3-accb-7682f48be509]

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
    - Requirement R31.5.1 `[requirement:uuid:6be68334-4188-462d-912f-ed6b7767aa8a]`
  - down
    - None (atomic build task)

## Task Description

rb-compartment hosts content; a single presentation=expanded|bar attr flips EXPANDED (full content []) <-> BAR (collapsed strip | of icons/verb-buttons). Content+behavior are FIXED; only the presentation CSS + what's-shown branches — NOT two components. What-bar, changebar, Actions-bar are all rb-compartment[presentation=bar]. FOUNDATION piece (build order 1).

## Acceptance Criteria

- [ ] presentation=expanded|bar on ONE rb-compartment flips full-content <-> collapsed | strip (icons/verb-buttons); content+behavior fixed, only presentation CSS + what's-shown branches. What-bar/changebar/Actions-bar = rb-compartment[presentation=bar]. NOT a second component.
- [ ] In portrait, a compartment's min-width is 88vw (via a single CSS var --rb-peek:12vw for the ~12% peek of the next compartment) — tunable, not per-snap logic (architect decision).
- [ ] POSITIONING!=FUNCTION (cross-cutting, architect design b3f30491f): the SAME component instance in ANY presentation combination {bar|compartment}x{landscape|portrait}x{inline|bottom} passes the SAME functional tests (detail renders, scroll works, expand/minimize, verb-actions fire) — only computed layout/position differs. Any behavior that CHANGES with position/presentation is a DEFECT (the anti-pattern Tron flagged). Tester gates this piece at Tron's real viewport (portrait mobile scroll-snap + landscape side-by-side).
- [ ] AC-INV-PRESENTATION (cross-cutting R31.5.8): positioning != function — presentation is a reactive layer, never a second fork.

## Subtasks

None (atomic build task).
